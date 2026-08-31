import type { ComfortClass } from './types';

export type Language = 'ja' | 'en' | 'zh';

interface ClassText {
  description: string;
  label: string;
}

interface Messages {
  about: string;
  ad: string;
  areaDocumentTitle: string;
  areaHeading: string;
  areaMetaDescription: string;
  areaPageTagline: string;
  areaPageTitle: string;
  comfortable: string;
  contact: string;
  copied: string;
  copyFailed: string;
  clearSelection: string;
  dataCaveat: string;
  dataNoteBody: string;
  dataNoteHeading: string;
  dataNoteSecondary: string;
  dataPill: string;
  detailHeading: string;
  detailPrompt: string;
  destinationClear: string;
  destinationDocumentTitle: string;
  destinationMetaDescription: string;
  destinationNearbyEmpty: string;
  destinationNearbyHeading: string;
  destinationNearbyHelp: string;
  destinationResultsLabel: string;
  destinationSearchAction: string;
  destinationSearchError: string;
  destinationSearchLabel: string;
  destinationSearchLoading: string;
  destinationSearchNoResults: string;
  destinationSearchPlaceholder: string;
  destinationPageTagline: string;
  destinationPageTitle: string;
  destinationType: string;
  documentTitle: string;
  eyebrow: string;
  feedbackCancel: string;
  feedbackCategory: string;
  feedbackCategoryDifficult: string;
  feedbackCategoryMissing: string;
  feedbackCategoryOther: string;
  feedbackCategoryParking: string;
  feedbackCategoryPlaceholder: string;
  feedbackCategoryRoad: string;
  feedbackClose: string;
  feedbackDate: string;
  feedbackDetails: string;
  feedbackDetailsHelp: string;
  feedbackDetailsTooShort: string;
  feedbackDialogTitle: string;
  feedbackDone: string;
  feedbackError: string;
  feedbackLocationAttached: string;
  feedbackOptional: string;
  feedbackPersonalInfoConfirm: string;
  feedbackPrivacyNote: string;
  feedbackRateLimited: string;
  feedbackSending: string;
  feedbackSubmit: string;
  feedbackSuccessBody: string;
  feedbackSuccessTitle: string;
  feedbackSubjectLocation: string;
  feedbackSubjectParking: string;
  feedbackSubjectSegment: string;
  language: string;
  layersHeading: string;
  loadingFailed: string;
  locate: string;
  locateDenied: string;
  locateFailed: string;
  mapAria: string;
  methodology: string;
  metaDescription: string;
  officialParking: string;
  officialParkingHelp: string;
  parkingAddress: string;
  parkingCapacity: string;
  parkingCount: string;
  parkingCoverage: string;
  parkingDataWarning: string;
  parkingDetailLabel: string;
  parkingOpenMaps: string;
  parkingSource: string;
  parkingSpaces: string;
  parkingStatusCheck: string;
  parkingReportAction: string;
  popularDestinationsHeading: string;
  privacy: string;
  reportAction: string;
  reportNote: string;
  reset: string;
  segmentSource: string;
  segmentReportAction: string;
  segmentsVisible: string;
  share: string;
  siteInfo: string;
  sourceChecked: string;
  sourceCurrent: string;
  sourceLicense: string;
  sourceNote: string;
  sourceParking: string;
  sourceReferences: string;
  sources: string;
  tagline: string;
  terms: string;
  title: string;
  updates: string;
  viewCount: string;
  viewSourceData: string;
  visibleRoads: string;
}

export const messages: Record<Language, Messages> = {
  ja: {
    about: 'このマップについて',
    ad: '広告',
    areaDocumentTitle: '{area}の自転車マップ | 走りやすい道・駐輪場',
    areaHeading: 'エリアから見る',
    areaMetaDescription:
      '東京都の{area}周辺で、車と分離された道、緑道・河川敷、自転車レーン、駐輪場を確認できる自転車マップです。',
    areaPageTagline: '走りやすい道・自転車レーン・駐輪場を地図で確認できます。',
    areaPageTitle: '{area}の自転車マップ',
    comfortable: '走りやすい道',
    contact: '情報の修正・お問い合わせ',
    copied: 'コピー済み',
    copyFailed: 'コピー失敗',
    clearSelection: '選択を解除',
    dataCaveat: 'OSMの登録内容から判定しています。現地の道路状況と異なる場合があります。',
    dataNoteBody:
      '現在の安心度表示にはOpenStreetMapを使用し、東京都・区市町村・国の公式公開資料を調査・参照しています。公開時点や工事などにより、実際の道路状況と異なる場合があります。',
    dataNoteHeading: 'データと現地状況について',
    dataNoteSecondary:
      '安心度は主にOSMタグからの暫定分類です。公式公開情報を定期的に確認して更新します。地域により公開情報量に差があります。走行時は現地の標識・規制を優先してください。',
    dataPill: 'OSM暫定',
    detailHeading: '地図上の情報',
    detailPrompt: '色付きの道または駐輪場を選んでください。',
    destinationClear: '目的地を解除',
    destinationDocumentTitle: '{destination}周辺の駐輪場 | 東京じてんしゃマップ',
    destinationMetaDescription:
      '{destination}周辺の駐輪場を近い順に確認。所在地、駐輪台数、公式データへのリンクと、周辺の走りやすい道・自転車レーンを地図で見られます。',
    destinationNearbyEmpty: '2km以内に登録済みの駐輪場が見つかりません。',
    destinationNearbyHeading: '近くの駐輪場',
    destinationNearbyHelp: '直線距離2km以内から、近い順に最大5件を表示しています。',
    destinationResultsLabel: '目的地の検索候補',
    destinationSearchAction: '検索',
    destinationSearchError: '目的地を検索できませんでした。少し時間をおいてお試しください。',
    destinationSearchLabel: '目的地を検索',
    destinationSearchLoading: '検索中…',
    destinationSearchNoResults: '東京都内の候補が見つかりません。',
    destinationSearchPlaceholder: '駅・施設・住所を検索',
    destinationPageTagline: '駅から近い駐輪場と、周辺の自転車通行環境を確認できます。',
    destinationPageTitle: '{destination}周辺の駐輪場',
    destinationType: '目的地',
    documentTitle: '東京の自転車マップ | 走りやすい道・自転車レーン・駐輪場',
    eyebrow: '東京都内の自転車通行環境',
    feedbackCancel: 'キャンセル',
    feedbackCategory: '報告の種類',
    feedbackCategoryDifficult: '走りにくい・危険に感じる場所',
    feedbackCategoryMissing: '地図に情報がない',
    feedbackCategoryOther: 'その他',
    feedbackCategoryParking: '駐輪場が閉鎖・移転した',
    feedbackCategoryPlaceholder: '選んでください',
    feedbackCategoryRoad: '道路・自転車通行空間が変わった',
    feedbackClose: '閉じる',
    feedbackDate: '確認した日',
    feedbackDetails: '現地ではどうなっていますか？',
    feedbackDetailsHelp: '地図の表示と違う点を、分かる範囲で具体的に書いてください。',
    feedbackDetailsTooShort: '10文字以上で入力してください。',
    feedbackDialogTitle: '地図情報を報告',
    feedbackDone: '閉じる',
    feedbackError: '送信できませんでした。少し時間をおいて、もう一度お試しください。',
    feedbackLocationAttached: '現在の地図位置を自動で添付します',
    feedbackOptional: '任意',
    feedbackPersonalInfoConfirm: '氏名、住所、顔、車両番号などの個人情報を含めていません。',
    feedbackPrivacyNote: 'アカウントや連絡先は不要です。報告は確認のため非公開で保存します。',
    feedbackRateLimited: '短時間の送信回数が多すぎます。1分ほど待ってからお試しください。',
    feedbackSending: '送信中…',
    feedbackSubmit: '送信する',
    feedbackSuccessBody: 'ありがとうございます。公開資料や地図データと照合して確認します。',
    feedbackSuccessTitle: '報告を受け付けました',
    feedbackSubjectLocation: '対象地点: 地図中心 {lat}, {lng}',
    feedbackSubjectParking: '対象駐輪場: {name}',
    feedbackSubjectSegment: '対象区間: {name}',
    language: '表示言語',
    layersHeading: '地図レイヤー',
    loadingFailed: 'データの読み込みに失敗しました。',
    locate: '現在地を表示',
    locateDenied: '位置情報の利用が許可されていません。',
    locateFailed: '現在地を取得できませんでした。',
    mapAria: '東京の自転車通行環境地図',
    methodology: 'データと判定方法',
    metaDescription:
      '東京都内の走りやすい道、自転車レーン、緑道、河川敷、駐輪場を地図で確認。車との分離や通行環境を色分けした無料の東京自転車マップです。',
    officialParking: '駐輪場（東京都公開データ）',
    officialParkingHelp: '東京都の公式データを読み込み中',
    parkingAddress: '所在地',
    parkingCapacity: '最大駐輪台数',
    parkingCount: '登録施設',
    parkingCoverage: '{count}区市町を収録',
    parkingDataWarning:
      '駐輪場情報も公開時点の内容です。閉鎖・休止・移転、営業時間や利用条件の変更が反映されていない場合があります。利用前に施設・自治体の最新情報や現地表示を確認してください。',
    parkingDetailLabel: '駐輪場',
    parkingOpenMaps: '地図アプリで開く',
    parkingSource: '公式データを見る',
    parkingSpaces: '台',
    parkingStatusCheck: '閉鎖・移転などが未反映の場合があります。現地情報をご確認ください。',
    parkingReportAction: 'この駐輪場の情報を報告',
    popularDestinationsHeading: '駅から駐輪場を探す',
    privacy: 'プライバシー',
    reportAction: '地図にない情報を報告',
    reportNote: 'アカウント不要で送信できます。内容は確認のため非公開で保存します。',
    reset: '東京本土',
    segmentSource: '出典',
    segmentReportAction: 'この区間の情報を報告',
    segmentsVisible: '区間を表示中',
    share: '共有',
    siteInfo: 'サイト情報',
    sourceChecked: '出典確認日',
    sourceCurrent: '現在の安心度表示に使用',
    sourceLicense: 'データライセンスを見る',
    sourceNote: '各区間のOpenStreetMap元データは、地図上の区間を選ぶと個別に確認できます。',
    sourceParking: '駐輪場レイヤーに使用',
    sourceReferences: '調査・参考資料（現在の地図には未反映）',
    sources: 'データ出典一覧',
    tagline: '車が怖い人のための自転車マップ。',
    terms: '利用規約',
    title: '東京じてんしゃマップ',
    updates: '更新履歴',
    viewCount: '閲覧',
    viewSourceData: '元データを見る',
    visibleRoads: '表示する道'
  },
  en: {
    about: 'About this map',
    ad: 'Advertisement',
    areaDocumentTitle: '{area} Bicycle Map | Comfortable roads and parking',
    areaHeading: 'Explore by area',
    areaMetaDescription:
      'Explore physically separated roads, greenways, riverbanks, bicycle lanes and bicycle parking around {area}, Tokyo.',
    areaPageTagline: 'Explore comfortable roads, bicycle lanes and bicycle parking.',
    areaPageTitle: '{area} Bicycle Map',
    comfortable: 'Comfortable roads',
    contact: 'Corrections and contact',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    clearSelection: 'Clear selection',
    dataCaveat: 'This classification is inferred from OSM data and may differ from conditions on site.',
    dataNoteBody:
      'Comfort classifications currently use OpenStreetMap, supported by research into official publications from Tokyo, municipalities, and national agencies. Construction and publication dates may make real conditions different from the map.',
    dataNoteHeading: 'Data and real-world conditions',
    dataNoteSecondary:
      'Most comfort classifications are preliminary inferences from OSM tags. We regularly review official sources, but coverage varies by area. Always follow signs and restrictions on site.',
    dataPill: 'OSM estimate',
    detailHeading: 'Map information',
    detailPrompt: 'Select a colored road or bicycle parking marker.',
    destinationClear: 'Clear destination',
    destinationDocumentTitle: 'Bicycle parking near {destination} | Tokyo Bicycle Map',
    destinationMetaDescription:
      'Find bicycle parking near {destination}, ordered by distance, with locations, capacity, official sources and nearby comfortable cycling roads.',
    destinationNearbyEmpty: 'No registered bicycle parking was found within 2 km.',
    destinationNearbyHeading: 'Nearby bicycle parking',
    destinationNearbyHelp: 'Up to five facilities within 2 km, ordered by straight-line distance.',
    destinationResultsLabel: 'Destination suggestions',
    destinationSearchAction: 'Search',
    destinationSearchError: 'The destination search is unavailable. Please try again shortly.',
    destinationSearchLabel: 'Search for a destination',
    destinationSearchLoading: 'Searching…',
    destinationSearchNoResults: 'No matching destination was found in Tokyo.',
    destinationSearchPlaceholder: 'Search stations, places or addresses',
    destinationPageTagline: 'Compare nearby bicycle parking and the surrounding cycling environment.',
    destinationPageTitle: 'Bicycle parking near {destination}',
    destinationType: 'Destination',
    documentTitle: 'Tokyo Bicycle Map | Comfortable roads, bicycle lanes and parking',
    eyebrow: 'Cycling conditions across Tokyo',
    feedbackCancel: 'Cancel',
    feedbackCategory: 'Report type',
    feedbackCategoryDifficult: 'A difficult or dangerous location',
    feedbackCategoryMissing: 'Information is missing from the map',
    feedbackCategoryOther: 'Something else',
    feedbackCategoryParking: 'Bicycle parking has closed or moved',
    feedbackCategoryPlaceholder: 'Choose one',
    feedbackCategoryRoad: 'A road or cycling space has changed',
    feedbackClose: 'Close',
    feedbackDate: 'Date observed',
    feedbackDetails: 'What is present on site?',
    feedbackDetailsHelp: 'Describe how conditions differ from the map, as specifically as you can.',
    feedbackDetailsTooShort: 'Please enter at least 10 characters.',
    feedbackDialogTitle: 'Report map information',
    feedbackDone: 'Close',
    feedbackError: 'Your report could not be sent. Please wait a moment and try again.',
    feedbackLocationAttached: 'Your current map position will be attached automatically',
    feedbackOptional: 'Optional',
    feedbackPersonalInfoConfirm: 'I have not included names, addresses, faces, vehicle numbers, or other personal information.',
    feedbackPrivacyNote: 'No account or contact details are needed. Reports are stored privately for review.',
    feedbackRateLimited: 'Too many reports were sent in a short time. Please wait about a minute and try again.',
    feedbackSending: 'Sending…',
    feedbackSubmit: 'Send report',
    feedbackSuccessBody: 'Thank you. We will check it against public sources and map data.',
    feedbackSuccessTitle: 'Report received',
    feedbackSubjectLocation: 'Location: map center at {lat}, {lng}',
    feedbackSubjectParking: 'Bicycle parking: {name}',
    feedbackSubjectSegment: 'Road segment: {name}',
    language: 'Language',
    layersHeading: 'Map layers',
    loadingFailed: 'The map data could not be loaded.',
    locate: 'Show my location',
    locateDenied: 'Location access was not permitted.',
    locateFailed: 'Your current location could not be found.',
    mapAria: 'Map of cycling conditions in Tokyo',
    methodology: 'Data and methodology',
    metaDescription:
      'Explore comfortable roads, physically separated cycling space, greenways, riverbanks, bicycle lanes and bicycle parking across Tokyo.',
    officialParking: 'Bicycle parking (Tokyo data)',
    officialParkingHelp: 'Loading official Tokyo data',
    parkingAddress: 'Address',
    parkingCapacity: 'Maximum capacity',
    parkingCount: 'Facilities',
    parkingCoverage: '{count} municipalities covered',
    parkingDataWarning:
      'Bicycle-parking information reflects the source at its publication date. Closures, temporary suspensions, relocations, opening hours and conditions of use may have changed. Check current facility or municipal information and signs on site before relying on it.',
    parkingDetailLabel: 'Bicycle parking',
    parkingOpenMaps: 'Open in a maps app',
    parkingSource: 'View official data',
    parkingSpaces: 'spaces',
    parkingStatusCheck: 'Closures or relocations may not yet be reflected. Check current information on site.',
    parkingReportAction: 'Report this bicycle parking facility',
    popularDestinationsHeading: 'Parking near major stations',
    privacy: 'Privacy',
    reportAction: 'Report missing map information',
    reportNote: 'No account is needed. Reports are stored privately for review.',
    reset: 'Tokyo mainland',
    segmentSource: 'Source',
    segmentReportAction: 'Report this road segment',
    segmentsVisible: 'segments shown',
    share: 'Share',
    siteInfo: 'Site information',
    sourceChecked: 'Sources checked',
    sourceCurrent: 'Used for the current comfort display',
    sourceLicense: 'View data licenses',
    sourceNote: 'Select a segment on the map to inspect its original OpenStreetMap record.',
    sourceParking: 'Used for the bicycle-parking layer',
    sourceReferences: 'Research and reference material (not yet reflected on the map)',
    sources: 'Data sources',
    tagline: 'A cycling map for people who feel uneasy around cars.',
    terms: 'Terms',
    title: 'Tokyo Bicycle Map',
    updates: 'Updates',
    viewCount: 'Views',
    viewSourceData: 'View source data',
    visibleRoads: 'Roads to show'
  },
  zh: {
    about: '关于这张地图',
    ad: '广告',
    areaDocumentTitle: '{area}自行车地图 | 舒适道路与停车场',
    areaHeading: '按地区查看',
    areaMetaDescription:
      '查看东京{area}周边与机动车分隔的道路、绿道、河岸、自行车专用车道和自行车停车场。',
    areaPageTagline: '查看舒适道路、自行车专用车道和自行车停车场。',
    areaPageTitle: '{area}自行车地图',
    comfortable: '舒适道路',
    contact: '信息修正与联系',
    copied: '已复制',
    copyFailed: '复制失败',
    clearSelection: '取消选择',
    dataCaveat: '此分类根据 OSM 数据推测，可能与现场道路状况不同。',
    dataNoteBody:
      '当前的舒适度显示使用 OpenStreetMap，并参考东京都、各区市町村及国家机关公开的官方资料。由于资料发布时间和施工等原因，实际道路状况可能与地图不同。',
    dataNoteHeading: '数据与现场状况',
    dataNoteSecondary:
      '舒适度主要依据 OSM 标签进行初步分类。我们会定期核对官方公开信息，但各地区的数据量不同。骑行时请以现场标志和交通规定为准。',
    dataPill: 'OSM 推测',
    detailHeading: '地图信息',
    detailPrompt: '请选择彩色道路或自行车停车场标记。',
    destinationClear: '清除目的地',
    destinationDocumentTitle: '{destination}附近的自行车停车场 | 东京自行车地图',
    destinationMetaDescription:
      '按距离查看{destination}附近的自行车停车场，包括地址、停车数量、官方来源及周边舒适骑行道路。',
    destinationNearbyEmpty: '2公里内未找到已登记的自行车停车场。',
    destinationNearbyHeading: '附近的自行车停车场',
    destinationNearbyHelp: '按直线距离显示2公里内最近的最多5处设施。',
    destinationResultsLabel: '目的地搜索结果',
    destinationSearchAction: '搜索',
    destinationSearchError: '暂时无法搜索目的地，请稍后再试。',
    destinationSearchLabel: '搜索目的地',
    destinationSearchLoading: '正在搜索…',
    destinationSearchNoResults: '在东京都内未找到匹配的目的地。',
    destinationSearchPlaceholder: '搜索车站、设施或地址',
    destinationPageTagline: '查看附近的自行车停车场和周边骑行环境。',
    destinationPageTitle: '{destination}附近的自行车停车场',
    destinationType: '目的地',
    documentTitle: '东京自行车地图 | 舒适道路、自行车专用车道与停车场',
    eyebrow: '东京都内自行车通行环境',
    feedbackCancel: '取消',
    feedbackCategory: '报告类型',
    feedbackCategoryDifficult: '骑行困难或感觉危险的地点',
    feedbackCategoryMissing: '地图缺少信息',
    feedbackCategoryOther: '其他',
    feedbackCategoryParking: '自行车停车场已关闭或搬迁',
    feedbackCategoryPlaceholder: '请选择',
    feedbackCategoryRoad: '道路或自行车通行空间已发生变化',
    feedbackClose: '关闭',
    feedbackDate: '确认日期',
    feedbackDetails: '现场实际情况如何？',
    feedbackDetailsHelp: '请尽量具体说明现场情况与地图显示有何不同。',
    feedbackDetailsTooShort: '请至少输入10个字符。',
    feedbackDialogTitle: '报告地图信息',
    feedbackDone: '关闭',
    feedbackError: '报告发送失败，请稍后再试。',
    feedbackLocationAttached: '将自动附上当前地图位置',
    feedbackOptional: '选填',
    feedbackPersonalInfoConfirm: '我没有填写姓名、地址、人脸、车辆号码或其他个人信息。',
    feedbackPrivacyNote: '无需账号或联系方式。报告将以非公开方式保存，供核查使用。',
    feedbackRateLimited: '短时间内发送次数过多，请等待约一分钟后重试。',
    feedbackSending: '正在发送…',
    feedbackSubmit: '发送报告',
    feedbackSuccessBody: '谢谢。我们会与公开资料和地图数据进行核对。',
    feedbackSuccessTitle: '已收到报告',
    feedbackSubjectLocation: '目标地点：地图中心 {lat}, {lng}',
    feedbackSubjectParking: '目标停车场：{name}',
    feedbackSubjectSegment: '目标路段：{name}',
    language: '显示语言',
    layersHeading: '地图图层',
    loadingFailed: '地图数据加载失败。',
    locate: '显示当前位置',
    locateDenied: '未获准使用位置信息。',
    locateFailed: '无法获取当前位置。',
    mapAria: '东京都自行车通行环境地图',
    methodology: '数据与判定方法',
    metaDescription:
      '查看东京都内的舒适道路、与机动车分隔的骑行空间、绿道、河岸、自行车专用车道和自行车停车场。',
    officialParking: '自行车停车场（东京都公开数据）',
    officialParkingHelp: '正在加载东京都官方数据',
    parkingAddress: '地址',
    parkingCapacity: '最大停车数量',
    parkingCount: '设施数量',
    parkingCoverage: '已收录 {count} 个区市町',
    parkingDataWarning:
      '自行车停车场信息以数据发布时的内容为准。关闭、暂停营业、搬迁、开放时间及使用条件的变化可能尚未更新。使用前请确认设施或自治体的最新信息以及现场告示。',
    parkingDetailLabel: '自行车停车场',
    parkingOpenMaps: '在地图应用中打开',
    parkingSource: '查看官方数据',
    parkingSpaces: '辆',
    parkingStatusCheck: '关闭或搬迁等变化可能尚未更新，请确认现场最新信息。',
    parkingReportAction: '报告此自行车停车场',
    popularDestinationsHeading: '按车站查找停车场',
    privacy: '隐私政策',
    reportAction: '报告地图缺少的信息',
    reportNote: '无需账号。报告将以非公开方式保存，供核查使用。',
    reset: '东京本土',
    segmentSource: '来源',
    segmentReportAction: '报告此路段',
    segmentsVisible: '个路段已显示',
    share: '分享',
    siteInfo: '网站信息',
    sourceChecked: '来源确认日期',
    sourceCurrent: '用于当前舒适度显示',
    sourceLicense: '查看数据许可',
    sourceNote: '选择地图上的路段即可查看对应的 OpenStreetMap 原始记录。',
    sourceParking: '用于自行车停车场图层',
    sourceReferences: '调查与参考资料（尚未反映在地图中）',
    sources: '数据来源',
    tagline: '为对机动车感到不安的人准备的自行车地图。',
    terms: '使用条款',
    title: '东京自行车地图',
    updates: '更新记录',
    viewCount: '浏览',
    viewSourceData: '查看原始数据',
    visibleRoads: '显示道路'
  }
};

export const classText: Record<Language, Record<ComfortClass, ClassText>> = {
  ja: {
    A: { label: '車と分離された走りやすい道', description: '車と物理分離' },
    B: { label: '歩道・緑道などの走りやすい道', description: '広い歩道内・緑道・河川敷' },
    C: { label: '自転車レーン', description: '車道上の専用通行帯' },
    D: { label: '車道混在', description: 'ナビライン・ナビマーク' }
  },
  en: {
    A: { label: 'Comfortable and physically separated', description: 'Physically separated from cars' },
    B: { label: 'Comfortable paths and greenways', description: 'Wide sidewalks, greenways and riverbanks' },
    C: { label: 'Bicycle lane', description: 'Dedicated lane on the roadway' },
    D: { label: 'Mixed traffic', description: 'Bicycle guide lines and markings' }
  },
  zh: {
    A: { label: '与机动车物理隔离的舒适道路', description: '与机动车物理隔离' },
    B: { label: '人行道、绿道等舒适道路', description: '宽阔人行道、绿道和河岸' },
    C: { label: '自行车专用车道', description: '机动车道上的专用通行带' },
    D: { label: '混合车流', description: '自行车引导线和引导标记' }
  }
};

export const areaGroupText: Record<Language, Record<string, string>> = {
  ja: {
    '23区 北・西': '23区 北・西',
    '23区 都心': '23区 都心',
    '23区 南・湾岸': '23区 南・湾岸',
    '23区 河川': '23区 河川',
    '多摩 東部': '多摩 東部',
    '多摩 西部': '多摩 西部',
    '島しょ': '島しょ'
  },
  en: {
    '23区 北・西': '23 wards: north and west',
    '23区 都心': '23 wards: central',
    '23区 南・湾岸': '23 wards: south and bay',
    '23区 河川': '23 wards: rivers',
    '多摩 東部': 'Tama: east',
    '多摩 西部': 'Tama: west',
    '島しょ': 'Islands'
  },
  zh: {
    '23区 北・西': '23区：北部与西部',
    '23区 都心': '23区：都心',
    '23区 南・湾岸': '23区：南部与湾岸',
    '23区 河川': '23区：河川',
    '多摩 東部': '多摩：东部',
    '多摩 西部': '多摩：西部',
    '島しょ': '岛屿'
  }
};

export const areaText: Record<Language, Record<string, string>> = {
  ja: {},
  en: {
    'ikebukuro-otsuka': 'Ikebukuro / Otsuka',
    'kanamecho-senkawa': 'Kanamecho / Senkawa',
    'sugamo-oji': 'Sugamo / Nishigahara / Oji',
    bunkyo: 'Bunkyo',
    'imperial-chiyoda': 'Imperial Palace / Chiyoda',
    'yotsuya-gaien': 'Yotsuya / Jingu Gaien',
    'aoyama-akasaka': 'Aoyama / Nogizaka / Akasaka',
    'shiba-takeshiba': 'Shiba / Takeshiba',
    'toyosu-odaiba': 'Toyosu / Ariake / Odaiba',
    'shinkiba-yumenoshima': 'Shinkiba / Yumenoshima',
    arakawa: 'Arakawa / Kasai Bridge',
    'musashino-mitaka': 'Musashino / Mitaka',
    'chofu-fuchu': 'Chofu / Fuchu',
    'koganei-kokubunji': 'Koganei / Kokubunji',
    'tachikawa-akishima': 'Tachikawa / Akishima',
    'tama-machida': 'Tama / Machida',
    hachioji: 'Hachioji',
    'ome-okutama': 'Ome / Okutama',
    'izu-oshima': 'Izu Oshima'
  },
  zh: {
    'ikebukuro-otsuka': '池袋 / 大冢',
    'kanamecho-senkawa': '要町 / 千川',
    'sugamo-oji': '巢鸭 / 西原 / 王子',
    bunkyo: '文京',
    'imperial-chiyoda': '皇居 / 千代田',
    'yotsuya-gaien': '四谷 / 神宫外苑',
    'aoyama-akasaka': '青山 / 乃木坂 / 赤坂',
    'shiba-takeshiba': '芝 / 竹芝',
    'toyosu-odaiba': '丰洲 / 有明 / 台场',
    'shinkiba-yumenoshima': '新木场 / 梦之岛',
    arakawa: '荒川 / 葛西桥',
    'musashino-mitaka': '武藏野 / 三鹰',
    'chofu-fuchu': '调布 / 府中',
    'koganei-kokubunji': '小金井 / 国分寺',
    'tachikawa-akishima': '立川 / 昭岛',
    'tama-machida': '多摩 / 町田',
    hachioji: '八王子',
    'ome-okutama': '青梅 / 奥多摩',
    'izu-oshima': '伊豆大岛'
  }
};

export const localeByLanguage: Record<Language, string> = {
  ja: 'ja-JP',
  en: 'en',
  zh: 'zh-CN'
};

export function getLanguage(): Language {
  const requested = new URLSearchParams(window.location.search).get('lang');
  if (requested === 'ja' || requested === 'en' || requested === 'zh') return requested;

  try {
    const stored = window.localStorage.getItem('tokyo-bike-map-language');
    if (stored === 'ja' || stored === 'en' || stored === 'zh') return stored;
  } catch {
    // Japanese remains the default when storage is unavailable.
  }

  return 'ja';
}

export function rememberLanguage(language: Language): void {
  try {
    window.localStorage.setItem('tokyo-bike-map-language', language);
  } catch {
    // The URL still carries non-Japanese language choices when storage is unavailable.
  }
}

export function languageUrl(language: Language): string {
  const url = new URL(window.location.href);
  if (language === 'ja') {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', language);
  }
  return url.href;
}

export function applyStaticTranslations(language: Language): void {
  const copy = messages[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  document.title = copy.documentTitle;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    'content',
    copy.metaDescription
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute(
    'content',
    copy.documentTitle
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute(
    'content',
    copy.metaDescription
  );

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as keyof Messages | undefined;
    if (key && copy[key]) element.textContent = copy[key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
    const key = element.dataset.i18nAria as keyof Messages | undefined;
    if (key && copy[key]) element.setAttribute('aria-label', copy[key]);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle as keyof Messages | undefined;
    if (key && copy[key]) element.setAttribute('title', copy[key]);
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder as keyof Messages | undefined;
    if (key && copy[key]) element.setAttribute('placeholder', copy[key]);
  });

  (['A', 'B', 'C', 'D'] as ComfortClass[]).forEach((cls) => {
    document.querySelectorAll<HTMLElement>(`[data-class-label="${cls}"]`).forEach((element) => {
      element.textContent = classText[language][cls].label;
    });
    document
      .querySelectorAll<HTMLElement>(`[data-class-description="${cls}"]`)
      .forEach((element) => {
        element.textContent = classText[language][cls].description;
      });
  });
}
