# Merkmateriaal — De Mediagraaf

Deze map bevat de merkidentiteit van De Mediagraaf, gebruikt om de tool (en later de gegenereerde ontwerpen) visueel te laten aansluiten bij het bedrijf.

## Huidige status

Alleen de basiskleuren zijn nu vastgelegd (ook toegepast in `tailwind.config.ts`):

| Kleur  | Hex       | Gebruik                          |
| ------ | --------- | --------------------------------- |
| Groen  | `#5FB238` | Primaire merkkleur / call-to-action |
| Oranje | `#E8792A` | Secundaire accentkleur             |
| Zwart  | `#111111` | Tekst / basis                      |

## Nog toe te voegen

- Logo (SVG/PNG, verschillende varianten: kleur, wit, monochroom)
- Typografie / lettertype-richtlijnen
- Eventuele bestaande huisstijlgids van De Mediagraaf

Plaats nieuwe bestanden hier zodra ze beschikbaar zijn vanuit De Mediagraaf.

## Tijdelijk logo

Zolang het echte logo er nog niet is, gebruikt de app een placeholder-beeldmerk:
[`components/MediagraafLogo.tsx`](../../components/MediagraafLogo.tsx). Zet het echte logo hier
in deze map en pas daarna alleen dat ene component aan (bijv. met een `<img>` naar het nieuwe
bestand) — de header en homepage hoeven zelf niet gewijzigd te worden.
