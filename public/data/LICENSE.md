# Map data licences

## Cycling comfort data

`osm-segments.geojson` is an adapted database based on OpenStreetMap data.

- Copyright: OpenStreetMap contributors
- Source: https://www.openstreetmap.org/
- Licence: Open Database License 1.0 (ODbL)
- Licence information: https://www.openstreetmap.org/copyright
- Adaptations: cycling-related ways are selected, classified into riding-environment categories, and spatially conflated by the Tokyo Bicycle Map project.

The adapted database is made available under the ODbL 1.0. Individual feature
properties retain a link to the corresponding OpenStreetMap way and retrieval
provenance.

## Bicycle-parking data

`bicycle-parking.geojson` is compiled primarily from the Tokyo Metropolitan
Government's consolidated bicycle-parking dataset. Musashino City's official
open dataset supplements the one city absent from the consolidated source. Each
feature keeps a link to its official source page.

- Primary publisher: Tokyo Metropolitan Government, Office for Promotion of Citizen Safety
- Primary source: https://www.tomin-anzen.metro.tokyo.lg.jp/kotsu/jitensha/seisaku-jyourei/churinjou
- Supplemental source: https://catalog.data.metro.tokyo.lg.jp/dataset/t132039d0000000008
- Licence: the terms shown on each linked official source page
- Adaptations: source tables are decoded, normalized, filtered to bicycle-parking
  records with valid coordinates, merged, and converted to GeoJSON.

## Bicycle-pump data

`bicycle-pumps.geojson` combines OpenStreetMap locations with factual service
information published by bicycle-shop operators and Tokyo municipalities.
OpenStreetMap-derived locations remain subject to the ODbL 1.0. Operator and
municipal pages are linked as evidence that a pump service or facility was
published when the source was checked; their text and images are not
republished. A feature marked `official+community` combines a rider's on-site
report with published facility, operator, or industry-directory records; it does
not claim that the linked facility page individually lists the pump.

- Location data: OpenStreetMap contributors, https://www.openstreetmap.org/copyright
- Service evidence: the operator and municipal pages linked from each feature
- Adaptations: explicit public-pump tags and supported shop names are selected,
  matched to service evidence, combined with documented parking facilities,
  deduplicated, and converted to GeoJSON.

## Archived Tokyo Metropolitan Government data

The project archive at `data/processed/official-reference.geojson` is a conversion
of Tokyo Metropolitan Government source material and is not distributed or
displayed by the application.

- Publisher: Tokyo Metropolitan Government, Bureau of Construction
- Source: https://catalog.data.metro.tokyo.lg.jp/dataset/t000014d0000000026
- Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Licence text: https://creativecommons.org/licenses/by/4.0/

No safety or comfort endorsement by OpenStreetMap or the Tokyo Metropolitan
Government is implied.
