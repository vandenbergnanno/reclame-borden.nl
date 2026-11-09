-- Bedrag excl. btw dat een medewerker intern invult voor de goedkeuringsmail/factuur (zie
-- app/intern/(besloten)/[id]/BevestigingsmailKopieren.tsx).
alter table aanvragen add column if not exists factuurprijs_excl_btw numeric(10,2) null;

comment on column aanvragen.factuurprijs_excl_btw is 'Bedrag excl. btw dat een medewerker intern invult voor de goedkeuringsmail/factuur (zie app/intern/(besloten)/[id]/BevestigingsmailKopieren.tsx). Null zolang nog geen prijs is bepaald.';
