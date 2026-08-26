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

`bicycle-parking.geojson` is compiled from bicycle-parking datasets published by
Tokyo municipalities through the Tokyo Open Data Catalog. Each feature keeps a
link to its official dataset page and names the publishing municipality.

- Source catalogue: https://catalog.data.metro.tokyo.lg.jp/
- Publishers: the 22 municipalities listed in the GeoJSON metadata
- Licence: the licence shown on each linked official dataset page, generally
  Creative Commons Attribution 4.0 International (CC BY 4.0)
- Adaptations: source tables are decoded, normalized, joined where necessary,
  filtered to records with valid coordinates, and converted to GeoJSON.

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
