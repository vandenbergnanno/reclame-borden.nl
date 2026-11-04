-- Gedeelde opslag voor de rate limiter (zie lib/security/rateLimit.ts). Was in-memory (per
-- serverproces) -- dat telt niet mee over meerdere serverinstanties heen en vergeet alles bij een
-- herstart, waardoor de limiet in de praktijk hoger uitvalt dan bedoeld. Deze tabel + functie
-- maken de telling gedeeld en persistent, en atomisch (één statement, geen race condition tussen
-- twee gelijktijdige verzoeken met dezelfde sleutel).

create table if not exists rate_limieten (
  sleutel text primary key,
  aantal integer not null default 0,
  reset_op timestamptz not null
);

comment on table rate_limieten is 'Gedeelde teller voor rate limiting (per IP, per e-mailadres, enz. -- zie de sleutel-conventie in lib/security/rateLimit.ts-aanroepen). Uitsluitend gebruikt via de service-role key en de rate_limit_tik()-functie.';

-- Ruimt oude, allang verlopen vensters op zodra de tabel groter wordt dan een paar duizend rijen --
-- voorkomt dat de tabel onbeperkt blijft groeien door IP's/e-mailadressen die maar één keer
-- langskomen. Dit draait als onderdeel van rate_limit_tik() zelf (zie hieronder), niet als losse
-- cronjob: simpeler, en de kostprijs (één extra delete-statement) valt in het niet bij de rest van
-- een requestverwerking.
create or replace function rate_limiet_opruimen() returns void
language sql
as $$
  delete from rate_limieten where reset_op < now() - interval '1 day';
$$;

-- Atomische "tik": hoogt de teller voor `p_sleutel` met 1 op (of begint een nieuw venster als het
-- vorige verlopen is), en geeft het nieuwe aantal + wanneer het venster opnieuw begint terug. De
-- aanroepende code (checkRateLimit in lib/security/rateLimit.ts) vergelijkt dat aantal zelf met de
-- limiet -- de limiet zelf staat niet in de database, zodat dezelfde tabel voor elke sleutel/limiet-
-- combinatie gebruikt kan worden.
--
-- De hele operatie gebeurt in één insert ... on conflict ... do update-statement (geen aparte
-- select ervoor): zo kunnen twee gelijktijdige verzoeken met dezelfde sleutel elkaar nooit inhalen.
create or replace function rate_limit_tik(p_sleutel text, p_venster_ms bigint)
returns table (aantal integer, reset_op timestamptz)
language plpgsql
as $$
declare
  v_nu timestamptz := now();
begin
  if random() < 0.01 then
    perform rate_limiet_opruimen();
  end if;

  return query
  insert into rate_limieten as rl (sleutel, aantal, reset_op)
  values (p_sleutel, 1, v_nu + make_interval(secs => p_venster_ms / 1000.0))
  on conflict (sleutel) do update
    set aantal = case when rl.reset_op <= v_nu then 1 else rl.aantal + 1 end,
        reset_op = case when rl.reset_op <= v_nu then v_nu + make_interval(secs => p_venster_ms / 1000.0) else rl.reset_op end
  returning rl.aantal, rl.reset_op;
end;
$$;

comment on function rate_limit_tik(text, bigint) is 'Hoogt de teller voor p_sleutel atomisch op (of start een nieuw venster als het vorige verlopen is) en geeft het nieuwe aantal + reset-moment terug. De aanroeper vergelijkt het aantal zelf met zijn eigen limiet.';

-- Row Level Security: deze tabel is uitsluitend voor de rate limiter zelf, die altijd met de
-- service-role key draait (zie lib/supabase/server.ts) -- die omzeilt RLS toch al, maar expliciet
-- RLS aanzetten zonder policies voorkomt dat de tabel ooit per ongeluk leesbaar/schrijfbaar wordt
-- met de publieke anon-key (bijv. als iemand later per abuis een policy-loze aanname maakt).
alter table rate_limieten enable row level security;
