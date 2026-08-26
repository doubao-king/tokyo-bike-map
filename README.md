# 東京じてんしゃマップ

**車が怖い人のための自転車マップ。**

東京の自転車ルートを「最速」ではなく **安心度 / comfort** で可視化するMVPです。

## MVPの機能

- Leaflet + Stadia Maps ベースマップ（地図データ: OpenStreetMap）
- 走行環境別の4区分表示
- クラス別表示/非表示
- 東京の主要エリアへ移動できる大きなエリアボタン
- 区間クリックで詳細表示
- 日本語・英語・中国語の表示切り替え
- ブラウザの許可後に現在地を表示
- 国土地理院の坂・地形レイヤー
- 自治体の公式公開データによる駐輪場レイヤー
- typed GeoJSONデータを差し替えるだけで実データ化できる構成
- 区間ごとの出典・確認日・整備状況の表示
- モバイル対応
- データ方針、更新履歴、プライバシー、利用規約の公開ページ

## 開発

```bash
npm install
npm run dev
```

本番ビルド確認:

```bash
npm run build
```

## 表示区分

| 表示 | 内容 |
| --- | --- |
| 走りやすい道・車と物理分離 | 縁石・柵・植栽等で自動車と物理分離 |
| 走りやすい道・歩道や緑道 | 広い歩道内自転車空間、緑道、河川敷 |
| 自転車レーン | 車道上の自転車専用通行帯 |
| 車道混在 | ナビライン / ナビマーク / 車道混在 |

## データ方針

地図は `public/data/osm-segments.geojson` のOSM道路線形を読み込みます。23区、多摩、島しょを含む東京都から抽出した自転車関連wayで、ベースマップと同じOSM geometryに沿います。安心度はタグからの暫定分類で、公式な安全評価ではありません。地域によって自転車関連タグの情報量には差があります。

`data/processed/official-reference.geojson` は東京都建設局のシェープファイルを変換した調査用アーカイブです。2015年4月の自転車推奨ルートと、2012年10月計画の優先整備区間を含みます。古い計画資料が現在の安心度と誤解されないよう、配布ビルドや実行時の地図には含めていません。

元の8区間は `data/fixtures/demo-segments.geojson` にUI fixtureとして残していますが、実行時には読み込みません。

Runtime data should conform to the schema in `src/types.ts`:

公開版では以下を統合する想定です。

1. OpenStreetMap (`cycleway=*`, `highway=cycleway`, `segregated=*`, etc.)
2. 東京都オープンデータ / 建設局資料
3. 豊島区・文京区・千代田区・港区等の as-built 資料
4. 現地確認 / ユーザー投稿

### 推奨プロパティ

```json
{
  "id": "tokyo-319-aoyama-001",
  "name": "道路・区間名",
  "comfort_class": "A",
  "facility_type": "protected_cycleway",
  "legal_type": "自転車道",
  "car_separation": "yes",
  "pedestrian_shared": "no",
  "parking_conflict": "low",
  "verification": "official|osm|community|official+community|unverified|demo",
  "verified_at": "2026-08",
  "source": {
    "name": "東京都",
    "url": "https://...",
    "source_date": "2026-xx-xx",
    "reference_date": "2026-xx-xx"
  },
  "status": "built|planned|under_construction|unknown",
  "notes": "..."
}
```

## OSM ingestion

OSM ingestion is intentionally preliminary. It downloads cycling-related ways,
normalizes tags into the project schema, and marks segments as `verification:
"osm"` with `status: "unknown"`. OSM download time is stored as retrieval
provenance, not as a field-verification date. Each inferred classification also
stores `classification_confidence` and `classification_method`.

```bash
npm run ingest:osm -- --area tokyo --out public/data/osm-segments.geojson
```

The Tokyo administrative-area query covers the 23 wards, the Tama area, and
Tokyo's islands while excluding neighboring prefectures. The generated file is
bundled with the app; the browser does not query Overpass at runtime.
Large queries are split into regional requests, with a short-lived cache in
`data/cache/osm/` so transient Overpass failures can resume without repeating
completed requests.

The classifier lives in `scripts/osm/classifier.ts` so comfort assumptions can
be reviewed and tuned. Automated output should not be presented as authoritative
without official or field verification. Short OSM ways representing bicycle
crossings (`cycleway=crossing` or `highway=cycleway` with `crossing=*`) are
currently omitted from the comfort layer until the map has a dedicated crossing
visualization. Bicycle-designated footways are treated as B rather than mixed
traffic. During ingestion, parallel D geometry within 6 metres of A, B, or C is
trimmed in `scripts/osm/conflate.ts`; non-overlapping tails and perpendicular
crossings are retained.

Classifier and geometry regression checks:

```bash
npm test
```

## 東京都公式shape import

取得済みの東京都建設局shape原本は `data/raw/tokyo-metropolitan/` に保存しています。JGD2000 / Tokyo Plane Rectangular CS IXをWGS84へ変換し、静的GeoJSONを生成します。

```bash
npm run import:official
```

生成先は `data/processed/official-reference.geojson` です。元データのカタログ更新日ではなく、各リソースの実際の対象時点を保持します。各区・国の公式資料は `data/source-registry.json` に登録し、PDFしかないものは位置精度を捏造せず provenance-only としています。

## 公式駐輪場データ

`data/parking-sources.json` に登録した東京都オープンデータカタログの自治体データセットを取得し、座標を持つ施設を静的GeoJSONへ変換します。

```bash
npm run import:parking
```

生成先は `public/data/bicycle-parking.geojson` です。現在の配布データは22自治体・672施設を収録しています。自治体ごとに公開形式や座標の有無が異なるため、東京都内の全施設を網羅するものではありません。

## 公開前チェック

開発・公開ビルドともにStadia MapsのAlidade Smoothを既定で使用します。localhostでは開発利用が可能です。公開前にStadia Mapsで公開ホスト名を登録し、商用利用時は有料プランを有効にしてください。別の商用タイル提供元を使う場合は、`.env.example` を元にURLと帰属表示を上書きできます。

```bash
npm run check:launch
```

このチェックは、商用タイル設定、OpenStreetMapとタイル提供元へのリンク付き帰属表示、データライセンス、テスト、データ検証、本番ビルドをまとめて確認します。

## 公開構成

- GitHub: ソース管理と変更履歴
- Cloudflare Workers Static Assets: 静的ファイル配信、HTTPS、DDoS対策
- Stadia Maps: 商用利用可能な背景地図タイル

`wrangler.jsonc` は `dist` を静的アセットとして配信します。Cloudflareへログイン済みの環境では、公開前チェックを含む次のコマンドでデプロイできます。

```bash
npm run deploy:cloudflare
```

現在の公開先は `https://tokyo-bike-map.manymao.com` で、AdSenseのルートドメイン確認用に `https://manymao.com` からも同じサイトを配信します。`public/_headers` はセキュリティヘッダーと静的データのキャッシュ方針を設定します。広告はAdSenseの承認と同意管理の準備が整うまで読み込みません。

### 閲覧カウンター

`/api/views` だけをCloudflare Workerで処理し、D1の `page_views` テーブルへ累計回数を保存します。ブラウザ側はセッションストレージを使い、同じタブでの再読み込みを重複計上しません。個人を識別する値はD1へ保存しません。

```bash
npm run db:migrate:local
npm run dev:cloudflare
```

### 広告の有効化

広告枠は既定で非表示で、Googleへ通信しません。AdSenseのサイト確認用メタタグと `public/ads.txt` は公開しますが、広告スクリプトは読み込みません。AdSenseでサイトが「準備完了」になり、Googleの「プライバシーとメッセージ」で必要な同意設定を終えた後、`.env.production.local` に `VITE_ADSENSE_CLIENT` と `VITE_ADSENSE_SLOT` を設定してビルドします。値が未設定または不正な場合、広告コードは読み込まれません。

## 静的構成

地図データや検索用のバックエンドはありません。OSMと行政データの取得・正規化は開発時に実行し、Vite buildでは生成済みGeoJSONをそのまま配信します。ブラウザ側はLeafletで静的ファイルを描画し、閲覧カウンターだけがCloudflare WorkerとD1を使用します。

## 次の実装候補

- 各区のas-built GIS公開データが見つかった場合の追加adapter
- 「Fastest / Comfortable / Avoid mixed traffic」のルーティング
- 投稿/訂正フロー
- 区間写真
- 施設が突然終わる地点の warning marker
- URL共有 (`?lat=&lng=&z=`)
- SEO用区・路線ページ
