-- Harde, door Storage zelf afgedwongen bovengrens per bestand voor de "aanvraag-bijlagen"-bucket,
-- als vangnet onder de zachte controle in app/api/aanvragen/upload-url/route.ts (die controleert
-- wat de klant OPGEEFT, niet wat er werkelijk binnenkomt). Moet in dezelfde orde van grootte
-- blijven als MAX_BESTAND_BYTES in app/api/aanvragen/ontwerp/route.ts (20 MB) -- hier losjes
-- boven, zodat Storage nooit strenger is dan onze eigen foutmelding.
--
-- Bewust GEEN allowed_mime_types gezet: professionele ontwerpbestanden (.ai/.eps/.cdr/.psd) hebben
-- vaak geen eenduidige, consistente browser-MIME-type (zie dezelfde afweging in
-- app/api/aanvragen/upload-url/route.ts, die daarom op extensie controleert, niet op MIME-type) --
-- een MIME-allowlist op de bucket zelf zou legitieme drukbestanden juist kunnen blokkeren.
update storage.buckets
set file_size_limit = 22020096  -- 21 MB, iets ruimer dan de eigen 20 MB-grens
where id = 'aanvraag-bijlagen';
