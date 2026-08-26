import type { ComfortClass } from './types';

export type Language = 'ja' | 'en' | 'zh';

interface ClassText {
  description: string;
  label: string;
}

interface Messages {
  about: string;
  ad: string;
  areaHeading: string;
  comfortable: string;
  contact: string;
  copied: string;
  copyFailed: string;
  dataCaveat: string;
  dataNoteBody: string;
  dataNoteHeading: string;
  dataNoteSecondary: string;
  dataPill: string;
  detailHeading: string;
  detailPrompt: string;
  eyebrow: string;
  language: string;
  layersHeading: string;
  loadingFailed: string;
  locate: string;
  locateDenied: string;
  locateFailed: string;
  mapAria: string;
  methodology: string;
  officialParking: string;
  officialParkingHelp: string;
  parkingAddress: string;
  parkingCapacity: string;
  parkingCount: string;
  parkingSource: string;
  parkingSpaces: string;
  privacy: string;
  reset: string;
  segmentSource: string;
  segmentsVisible: string;
  share: string;
  siteInfo: string;
  slope: string;
  slopeHelp: string;
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
    areaHeading: 'エリアから見る',
    comfortable: '走りやすい道',
    contact: '情報の修正・お問い合わせ',
    copied: 'コピー済み',
    copyFailed: 'コピー失敗',
    dataCaveat: 'OSMの登録内容から判定しています。現地の道路状況と異なる場合があります。',
    dataNoteBody:
      '現在の安心度表示にはOpenStreetMapを使用し、東京都・区市町村・国の公式公開資料を調査・参照しています。公開時点や工事などにより、実際の道路状況と異なる場合があります。',
    dataNoteHeading: 'データと現地状況について',
    dataNoteSecondary:
      '安心度は主にOSMタグからの暫定分類です。公式公開情報を定期的に確認して更新します。地域により公開情報量に差があります。走行時は現地の標識・規制を優先してください。',
    dataPill: 'OSM暫定',
    detailHeading: '区間情報',
    detailPrompt: '地図上の色付き区間をタップしてください。',
    eyebrow: '東京都内の自転車通行環境',
    language: '表示言語',
    layersHeading: '地図レイヤー',
    loadingFailed: 'データの読み込みに失敗しました。',
    locate: '現在地を表示',
    locateDenied: '位置情報の利用が許可されていません。',
    locateFailed: '現在地を取得できませんでした。',
    mapAria: '東京の自転車通行環境地図',
    methodology: 'データと判定方法',
    officialParking: '駐輪場（公式データ）',
    officialParkingHelp: '自治体が公開する登録施設',
    parkingAddress: '所在地',
    parkingCapacity: '最大駐輪台数',
    parkingCount: '登録施設',
    parkingSource: '公式データを見る',
    parkingSpaces: '台',
    privacy: 'プライバシー',
    reset: '東京本土',
    segmentSource: '出典',
    segmentsVisible: '区間を表示中',
    share: '共有',
    siteInfo: 'サイト情報',
    slope: '坂・地形',
    slopeHelp: '濃いほど急な地形',
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
    areaHeading: 'Explore by area',
    comfortable: 'Comfortable roads',
    contact: 'Corrections and contact',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    dataCaveat: 'This classification is inferred from OSM data and may differ from conditions on site.',
    dataNoteBody:
      'Comfort classifications currently use OpenStreetMap, supported by research into official publications from Tokyo, municipalities, and national agencies. Construction and publication dates may make real conditions different from the map.',
    dataNoteHeading: 'Data and real-world conditions',
    dataNoteSecondary:
      'Most comfort classifications are preliminary inferences from OSM tags. We regularly review official sources, but coverage varies by area. Always follow signs and restrictions on site.',
    dataPill: 'OSM estimate',
    detailHeading: 'Segment details',
    detailPrompt: 'Select a colored segment on the map.',
    eyebrow: 'Cycling conditions across Tokyo',
    language: 'Language',
    layersHeading: 'Map layers',
    loadingFailed: 'The map data could not be loaded.',
    locate: 'Show my location',
    locateDenied: 'Location access was not permitted.',
    locateFailed: 'Your current location could not be found.',
    mapAria: 'Map of cycling conditions in Tokyo',
    methodology: 'Data and methodology',
    officialParking: 'Bicycle parking (official data)',
    officialParkingHelp: 'Facilities published by municipalities',
    parkingAddress: 'Address',
    parkingCapacity: 'Maximum capacity',
    parkingCount: 'Facilities',
    parkingSource: 'View official data',
    parkingSpaces: 'spaces',
    privacy: 'Privacy',
    reset: 'Tokyo mainland',
    segmentSource: 'Source',
    segmentsVisible: 'segments shown',
    share: 'Share',
    siteInfo: 'Site information',
    slope: 'Slopes and terrain',
    slopeHelp: 'Darker terrain is steeper',
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
    about: '关于本地图',
    ad: '广告',
    areaHeading: '按地区查看',
    comfortable: '舒适道路',
    contact: '信息修正与联系',
    copied: '已复制',
    copyFailed: '复制失败',
    dataCaveat: '此分类根据 OSM 数据推测，可能与现场道路状况不同。',
    dataNoteBody:
      '当前的舒适度显示使用 OpenStreetMap，并参考东京都、各区市町村及国家机关公开的官方资料。由于资料发布时间和施工等原因，实际道路状况可能与地图不同。',
    dataNoteHeading: '数据与现场状况',
    dataNoteSecondary:
      '舒适度主要依据 OSM 标签进行初步分类。我们会定期核对官方公开信息，但各地区的数据量不同。骑行时请以现场标志和交通规定为准。',
    dataPill: 'OSM 推测',
    detailHeading: '路段信息',
    detailPrompt: '请选择地图上的彩色路段。',
    eyebrow: '东京都内自行车通行环境',
    language: '显示语言',
    layersHeading: '地图图层',
    loadingFailed: '地图数据加载失败。',
    locate: '显示当前位置',
    locateDenied: '未获准使用位置信息。',
    locateFailed: '无法获取当前位置。',
    mapAria: '东京都自行车通行环境地图',
    methodology: '数据与判定方法',
    officialParking: '自行车停车场（官方数据）',
    officialParkingHelp: '各地方政府公开的登记设施',
    parkingAddress: '地址',
    parkingCapacity: '最大停车数量',
    parkingCount: '设施数量',
    parkingSource: '查看官方数据',
    parkingSpaces: '辆',
    privacy: '隐私政策',
    reset: '东京本土',
    segmentSource: '来源',
    segmentsVisible: '个路段已显示',
    share: '分享',
    siteInfo: '网站信息',
    slope: '坡度与地形',
    slopeHelp: '颜色越深，地形越陡',
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
  document.title = copy.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    'content',
    copy.tagline
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
