# 神田警察通り Phase II review — 2026-11-21

Only 白山通り to 千代田通り is included. The two survey-stage candidate routes
and the unfinished next section are excluded.

## Evidence

- [Chiyoda mayor’s address, 2026-11-17, section 4](https://www.city.chiyoda.lg.jp/koho/kuse/kucho/aisatsu/r8-4teirei.html): Phase II completed at the end of October 2026; the next section is still being worked on.
- [Official plan](https://www.city.chiyoda.lg.jp/koho/machizukuri/kotsu/setsubi/keikaku.html), [extent diagram](https://www.city.chiyoda.lg.jp/documents/27388/setsubihani.pdf), and [cross-section](https://www.city.chiyoda.lg.jp/documents/27388/keikaku-image.pdf): the named endpoints and marked bicycle space within widened sidewalks.
- [Official meeting minutes](https://www.city.chiyoda.lg.jp/documents/7003/21kyogikai-gijiyoshi.pdf): infrastructure planning official reports approximately 230 m for Phase II and 220 m for Phase I. The passage is on printed/PDF page 8 in the retrieved file (the supplied link points to page 7).
- [OSM way 1143901797](https://www.openstreetmap.org/way/1143901797), retrieved 2026-11-21 using `/api/0.6/way/1143901797/full`: eight existing road-center coordinates, used without offsets or invented vertices. OSM tags still describe the old carriageway; the official sources establish the updated facility classification.

## Map change and geometry audit

Base commit: `f43ff11f70be931a4721e1968ec074a10b3cbd4d`.

One B feature added; zero existing features changed or removed. Use
`path_or_sidewalk_bicycle_space`, `car_separation: yes`,
`pedestrian_shared: partial`, and `status: built`. Marked pedestrian/bicycle
zones do not establish a barrier between them. Direction and parking conflicts
remain unknown. The review date is a document review, not a field visit.

The added road-center line is **208.3 m**, calculated by summing haversine distances
between its eight vertices (mean Earth radius 6,371,008.8 m). This is one corridor
representation of both sides, not 416.6 m of corridor. The official approximate
project extent remains **230 m**. The 21.7 m difference is unresolved measurement/
extent precision, not evidence of a missing 21.7 m connection. No geometry is
extended merely to match the reported project length.

The western endpoint `[139.7587725, 35.6928355]` exactly matches the eastern endpoint
of existing Phase I feature `osm-way-203035385` and the 白山通り ways. The eastern
endpoint `[139.7610772, 35.6929118]` is the shared OSM node with 千代田通り ways
139505519 / 958539562 and the next 神田警察通り way 958539563. Stop here.

All runtime lines intersecting the surrounding bounding box were inspected,
including unnamed features. No existing Phase II feature or parallel runtime
bike line was found. The adjacent A line and crossing D lines are retained.
The OSM sidewalk network contains separate pieces and crossings; these are not
stitched into claimed surveyed bike paths. There is no internal gap in the
chosen centerline or at its western map join. Physical sidewalk connections,
intersection protection and exact bicycle alignments remain unverified; the
feature warning makes this limitation visible.

## Refresh and validation

`data/verified-segments.geojson` is applied by ID before full-Tokyo ingestion
conflation. Tests cover insertion, replacement, repeat application, duplicate
rejection, published-record parity and the western join/eastern limit. If OSM
splits this way, review the curated identity and geometry before another refresh.

Run `npm test` and `npm run build` (includes data validation and TypeScript checks).
