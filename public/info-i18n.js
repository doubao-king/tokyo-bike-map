const supportedLanguages = ['ja', 'en', 'zh'];
const pageId = document.body.dataset.infoPage;
const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
let storedLanguage;

try {
  storedLanguage = window.localStorage.getItem('tokyo-bike-map-language');
} catch {
  // Japanese remains the fallback when storage is unavailable.
}

const language = supportedLanguages.includes(requestedLanguage)
  ? requestedLanguage
  : supportedLanguages.includes(storedLanguage)
    ? storedLanguage
    : 'ja';

const labels = {
  ja: {
    about: 'このマップについて', contact: '情報の修正・お問い合わせ', language: '表示言語',
    map: '← 地図に戻る', methodology: 'データと判定方法', privacy: 'プライバシー', site: 'サイト情報',
    terms: '利用規約', title: '東京じてんしゃマップ', updates: '更新履歴'
  },
  en: {
    about: 'About this map', contact: 'Corrections and contact', language: 'Language',
    map: '← Back to the map', methodology: 'Data and methodology', privacy: 'Privacy', site: 'Site information',
    terms: 'Terms', title: 'Tokyo Bicycle Map', updates: 'Updates'
  },
  zh: {
    about: '关于本地图', contact: '信息修正与联系', language: '显示语言',
    map: '← 返回地图', methodology: '数据与判定方法', privacy: '隐私政策', site: '网站信息',
    terms: '使用条款', title: '东京自行车地图', updates: '更新记录'
  }
};

const pages = {
  en: {
    about: {
      description: 'The purpose, coverage, capabilities and limitations of Tokyo Bicycle Map.',
      lede: 'Tokyo Bicycle Map is a static information map that helps people who feel uneasy riding near cars compare cycling conditions across Tokyo.',
      html: `<section><h2>Purpose</h2><p>Cycle tracks, shared sidewalk spaces, riverbanks, bicycle lanes and mixed-traffic markings can look similar on a conventional map. This map separates them by riding environment so suitable areas are easier to find.</p><p>It is not navigation and does not calculate the shortest route or journey time. Use it to research an area before setting out.</p></section><section><h2>Coverage</h2><p>The map covers the 23 wards, Tama and Tokyo's islands. OpenStreetMap coverage varies by area, so a place with few colored segments may still have cycling infrastructure on the ground.</p></section><section><h2>Follow conditions on site</h2><div class="notice"><p>Roadworks, time restrictions, sign changes, congestion and surface conditions may not be reflected. Always follow signs, traffic rules and conditions on site.</p></div></section>`
    },
    methodology: {
      description: 'Data sources, road classifications, additional layers and limitations of Tokyo Bicycle Map.',
      lede: 'Road geometry and cycling tags come from OpenStreetMap, supported by official publications from Tokyo, municipalities and national agencies.',
      html: `<section><h2>Current map data</h2><p>Colored segments are static GeoJSON extracted and classified from OpenStreetMap geometry and tags at build time. The browser does not query OpenStreetMap or government sites while you use the map.</p><p>Historic recommended routes and priority projects from Tokyo are retained for research but are not displayed as present-day comfortable roads.</p></section><section><h2>Additional layer</h2><dl class="definition-list"><dt>Bicycle parking (Tokyo data)</dt><dd>Static public and private bicycle-parking locations collected by Tokyo through municipalities, supplemented by Musashino City's official open data. All 23 wards and 26 cities are included, but facilities unknown to Tokyo or lacking valid coordinates are not displayed. Closures, temporary suspensions, relocations, opening hours and conditions of use may not yet be reflected in the published data.</dd></dl></section><section><h2>Road categories</h2><dl class="definition-list"><dt>Physically separated</dt><dd>Cycling space separated from motor traffic by a curb, barrier, planting or similar feature.</dd><dt>Wide sidewalks, greenways and riverbanks</dt><dd>Includes bicycle space on wide sidewalks, greenways and riverbanks, some shared with pedestrians.</dd><dt>Bicycle lane</dt><dd>A dedicated lane on the roadway, including sections without physical separation.</dd><dt>Mixed traffic</dt><dd>Roadways with bicycle guide lines or markings. Hidden initially.</dd></dl></section><section><h2>Limitations</h2><ul><li>OSM-tag classifications are estimates, not an official safety assessment.</li><li>Short bicycle crossings are omitted until the map has an appropriate way to show them.</li><li>Overlapping mixed-traffic lines are removed where a more comfortable class occupies the same geometry.</li><li>Width, traffic volume, road grade, lighting and surface condition do not affect the comfort classification.</li></ul></section><section><h2>Sources and licences</h2><p>Administrative sources are listed in the map's Data sources panel. OpenStreetMap data is used under the Open Data Commons Open Database License.</p></section>`
    },
    updates: {
      description: 'Data and feature updates for Tokyo Bicycle Map.',
      lede: 'This page records data dates and changes that affect classification or display.',
      html: `<section><h2>27 August 2026</h2><ul><li>Added Japanese, English and Chinese interfaces.</li><li>Added current-location display.</li><li>Expanded bicycle parking to 1,768 facilities across 51 municipalities, including all 23 wards and 26 cities, using Tokyo's consolidated official data.</li><li>Added Google Maps and Apple Maps links for parking facilities, with a warning that closures or relocations may not yet be reflected.</li><li>Added area-specific URLs, page metadata and a sitemap for search discovery.</li><li>Added a private, account-free correction form that attaches the selected road or parking data ID and location.</li><li>Removed the terrain layer after initial review.</li></ul></section><section><h2>26 August 2026</h2><ul><li>Added public hosting, security settings and a commercial map-tile provider.</li><li>Added public pages covering methodology, privacy and terms.</li><li>Organized Tokyo-wide area shortcuts and official references.</li></ul></section><section><h2>25 August 2026</h2><ul><li>Imported Tokyo-wide cycling-related OpenStreetMap data.</li><li>Omitted short bicycle-crossing strokes.</li><li>Resolved overlaps between mixed-traffic and more comfortable classes.</li></ul></section><p class="updated">Data is refreshed according to source availability and review capacity.</p>`
    },
    contact: {
      description: 'How to suggest corrections or contact Tokyo Bicycle Map.',
      lede: 'If the map differs from conditions on site, or a source needs correction, use the private form without creating an account.',
      html: `<section><h2>Report a correction</h2><p>Select a colored road or bicycle-parking marker, then use Report this road segment or Report this bicycle parking facility. The selected data ID, name and clicked location are attached automatically. For information not shown on the map, use Report missing map information to attach the map center. Reports are not published and are used only for review.</p><p><a href="/?feedback=1&lang=en">Open the map and report a correction</a></p><p>The following details help us review it:</p><ul><li>What the map shows and what is present on site</li><li>The date observed</li><li>An official source URL, if known</li></ul></section><section><h2>Do not include personal information</h2><div class="notice"><p>Do not enter names, addresses, phone numbers, faces, vehicle registration numbers, or anything else that identifies a person.</p></div></section><section><h2>Review</h2><p>Suggestions are checked against public sources and map data before inclusion. We may not be able to incorporate every suggestion, and verification can take time.</p></section>`
    },
    privacy: {
      description: 'How Tokyo Bicycle Map handles site settings, correction reports, location, view counts and external services.',
      lede: 'Tokyo Bicycle Map does not require an account or ask for your name or address.',
      html: `<section><h2>Current data use</h2><dl class="definition-list"><dt>Site settings</dt><dd>Map position, road categories and layers are included in shareable URLs. Only the selected language is stored in local storage.</dd><dt>Current location</dt><dd>Your browser's location feature is used only after you press Show my location. It moves the map in your browser. If you then send a correction report, the reported map coordinates are stored.</dd><dt>Correction reports</dt><dd>Cloudflare D1 privately stores the report type, text, optional observation date, display language, map URL and coordinates. When a road or bicycle-parking facility is selected, its data type, ID and displayed name are also stored. The report table does not store a name, email address, account, IP address or browser information. Reports are retained as needed for review and correction and may be deleted when no longer needed. Do not include personal information.</dd><dt>View counter</dt><dd>Cloudflare D1 stores only a site-wide total. Session storage prevents repeated reloads in the same tab from being counted. No person-specific history or identifier is stored in the database.</dd><dt>Hosting</dt><dd>Cloudflare may process IP addresses and ordinary request information for delivery, security and incident response.</dd><dt>Map tiles</dt><dd>Stadia Maps receives technical request information when loading the base map.</dd><dt>Advertising</dt><dd>Google AdSense loads only after site review, consent settings and ad IDs are complete. When enabled, Google may process cookies, IP addresses and browser information for ad delivery and measurement.</dd><dt>Analytics</dt><dd>No analytics service that tracks individual behavior is enabled.</dd></dl></section><section><h2>External links</h2><p>External sites such as OpenStreetMap and government agencies apply their own privacy policies.</p></section><section><h2>Future changes</h2><p>This page will be updated before changing external services or stored information.</p></section><section><h2>Contact</h2><p>Questions about this policy can be sent through <a href="/contact/index.html?lang=en">Corrections and contact</a>.</p><p class="updated">Effective: 26 August 2026 / Updated: 27 August 2026</p></section>`
    },
    terms: {
      description: 'Terms, disclaimers and data licences for Tokyo Bicycle Map.',
      lede: 'Please review these terms before using the map.',
      html: `<section><h2>Information map</h2><p>Tokyo Bicycle Map is reference information for researching cycling conditions. It does not guarantee navigation, legal access, safety, construction status or opening times.</p></section><section><h2>Responsibility while riding</h2><p>Follow signs, traffic rules, road conditions, weather and surrounding traffic, and ride using your own judgment. Do not rely on this map alone to decide whether a road is passable.</p></section><section><h2>Accuracy and availability</h2><p>We update information where possible but do not guarantee completeness, accuracy, timeliness or fitness for a particular purpose. Display, classifications or availability may change without notice.</p></section><section><h2>Data and copyright</h2><p>OpenStreetMap-derived data is subject to the Open Data Commons Open Database License. Government materials remain subject to each publisher's terms. Sources are listed in the map.</p></section><section><h2>Advertising and sponsorship</h2><p>Advertising or sponsorship will be clearly separated from map controls and data. This site does not guarantee third-party products or services.</p><p class="updated">Effective: 26 August 2026</p></section>`
    }
  },
  zh: {
    about: {
      description: '介绍东京自行车地图的目的、范围、功能与限制。',
      lede: '东京自行车地图是一张静态信息地图，帮助对机动车感到不安的骑行者比较东京各地的自行车通行环境。',
      html: `<section><h2>目的</h2><p>在普通地图上，自行车道、人行道内的骑行空间、河岸、自行车专用车道和混合车流标线可能看起来相似。本地图按骑行环境将它们区分显示，方便寻找合适区域。</p><p>本地图不是导航工具，不计算最短路线或所需时间。请用于出发前了解地区情况。</p></section><section><h2>显示范围</h2><p>范围包括东京23区、多摩地区和岛屿地区。OpenStreetMap 的登记量因地区而异，彩色路段较少不代表现场没有自行车设施。</p></section><section><h2>请以现场状况为准</h2><div class="notice"><p>道路施工、时段限制、标志变化、拥堵和路面状况可能尚未反映。骑行时请遵守现场标志、交通规则并留意周围环境。</p></div></section>`
    },
    methodology: {
      description: '介绍东京自行车地图的数据来源、道路分类、附加图层和限制。',
      lede: '道路形状与自行车标签来自 OpenStreetMap，并参考东京都、各地方政府及国家机关的官方公开资料。',
      html: `<section><h2>当前地图数据</h2><p>彩色路段是构建时根据 OpenStreetMap 道路形状和标签提取、分类的静态 GeoJSON。使用地图时，浏览器不会查询 OpenStreetMap 或政府网站。</p><p>东京都过去的推荐路线和优先建设路段仅作为调查资料保存，不作为当前的舒适道路显示。</p></section><section><h2>附加图层</h2><dl class="definition-list"><dt>自行车停车场（东京都公开数据）</dt><dd>静态导入东京都通过各区市町村收集的公营及民营自行车停车场资料，并用武藏野市官方开放数据补充。已覆盖全部23区和26市，但东京都尚未掌握或缺少有效坐标的设施不会显示。关闭、暂停营业、搬迁、开放时间及使用条件的变化可能尚未反映在公开数据中。</dd></dl></section><section><h2>道路分类</h2><dl class="definition-list"><dt>与机动车物理隔离</dt><dd>通过路缘、护栏或绿化等与机动车交通分隔的骑行空间。</dd><dt>宽阔人行道、绿道和河岸</dt><dd>包括宽阔人行道内的骑行空间、绿道和河岸，部分路段与行人共用。</dd><dt>自行车专用车道</dt><dd>机动车道上的专用通行带，包括没有物理隔离的路段。</dd><dt>混合车流</dt><dd>设置自行车引导线或标记的机动车道，初始状态不显示。</dd></dl></section><section><h2>限制</h2><ul><li>根据 OSM 标签推测的分类并非官方安全评价。</li><li>在找到合适的表现方式前，短小的自行车横穿带暂不显示。</li><li>混合车流与更舒适分类重合时，会移除重合部分。</li><li>道路宽度、交通量、道路坡度、照明和路面状况不影响舒适度分类。</li></ul></section><section><h2>来源与许可</h2><p>行政资料列在地图的“数据来源”中。OpenStreetMap 数据依据 Open Data Commons Open Database License 使用。</p></section>`
    },
    updates: {
      description: '东京自行车地图的数据与功能更新记录。',
      lede: '本页记录数据日期以及影响分类或显示方式的变更。',
      html: `<section><h2>2026年8月27日</h2><ul><li>增加日语、英语和中文界面。</li><li>增加当前位置显示。</li><li>使用东京都整合的官方数据，将自行车停车场扩大至51个区市町的1,768处设施，覆盖全部23区和26市。</li><li>为停车场增加 Google Maps 与 Apple Maps 链接，并提示关闭或搬迁等变化可能尚未更新。</li><li>增加供搜索发现的地区专属网址、页面信息和网站地图。</li><li>增加无需账号、可附上所选道路或停车场数据 ID 及地点的非公开修正表单。</li><li>初步确认后移除地形图层。</li></ul></section><section><h2>2026年8月26日</h2><ul><li>增加公开托管、安全设置和商用地图图块服务。</li><li>增加数据方法、隐私政策和使用条款等页面。</li><li>整理覆盖东京全域的地区按钮与官方参考资料。</li></ul></section><section><h2>2026年8月25日</h2><ul><li>导入东京全域的 OpenStreetMap 自行车相关数据。</li><li>暂不显示短小的自行车横穿带。</li><li>整理混合车流与更舒适分类的重合部分。</li></ul></section><p class="updated">数据将根据来源的公开情况和核查能力进行更新。</p>`
    },
    contact: {
      description: '如何向东京自行车地图提出修正或联系。',
      lede: '如地图与现场状况不符，或数据来源需要修正，可使用无需账号的非公开表单。',
      html: `<section><h2>报告修正</h2><p>选择彩色道路或自行车停车场标记，然后使用“报告此路段”或“报告此自行车停车场”。系统会自动附上所选数据的 ID、名称和点击位置。对于地图尚未显示的信息，可使用“报告地图缺少的信息”附上地图中心位置。报告不会公开，仅用于核查。</p><p><a href="/?feedback=1&lang=zh">打开地图并报告修正</a></p><p>提供以下信息有助于核查：</p><ul><li>地图显示内容与现场实际情况</li><li>确认日期</li><li>已知的官方资料链接</li></ul></section><section><h2>请勿填写个人信息</h2><div class="notice"><p>请勿填写姓名、地址、电话号码、人脸、车辆号码或其他可以识别个人的信息。</p></div></section><section><h2>核查与反映</h2><p>建议将在与公开资料和地图数据核对后反映。我们可能无法采纳所有建议，核查也可能需要时间。</p></section>`
    },
    privacy: {
      description: '东京自行车地图如何处理网站设置、修正报告、位置、浏览次数和外部服务。',
      lede: '东京自行车地图不要求注册账号，也不会要求输入姓名或地址。',
      html: `<section><h2>当前的数据使用</h2><dl class="definition-list"><dt>网站设置</dt><dd>地图位置、道路分类和图层会包含在可分享的链接中。浏览器本地存储只保存所选语言。</dd><dt>当前位置</dt><dd>仅在按下“显示当前位置”后使用浏览器的位置功能，用于在浏览器内移动地图。如随后发送修正报告，会保存报告所指的地图坐标。</dd><dt>修正报告</dt><dd>Cloudflare D1 会以非公开方式保存报告类型、正文、选填的确认日期、显示语言、地图 URL 和坐标。选择道路或自行车停车场时，还会保存对象类型、数据 ID 和显示名称。报告数据表不保存姓名、电子邮箱、账号、IP 地址或浏览器信息。报告会在核查和修正所需期间保留，不再需要时可以删除。请勿填写个人信息。</dd><dt>浏览计数</dt><dd>Cloudflare D1 只保存全站累计次数。会话存储用于避免同一标签页重复刷新计数。数据库不保存个人浏览记录或识别码。</dd><dt>托管</dt><dd>Cloudflare 可能为内容分发、安全防护和故障处理而处理 IP 地址及一般请求信息。</dd><dt>地图图块</dt><dd>加载底图时 Stadia Maps 会收到技术请求信息。</dd><dt>广告</dt><dd>仅在网站审核、同意设置和广告 ID 完成后加载 Google AdSense。启用时，Google 可能为广告投放和效果测量处理 Cookie、IP 地址和浏览器信息。</dd><dt>访问分析</dt><dd>目前未启用追踪个人行为的分析服务。</dd></dl></section><section><h2>外部链接</h2><p>OpenStreetMap、政府机关等外部网站适用其各自的隐私政策。</p></section><section><h2>今后变更</h2><p>如外部服务或保存的信息发生变化，本页会在实际启用前更新。</p></section><section><h2>联系</h2><p>关于本政策的问题可通过<a href="/contact/index.html?lang=zh">信息修正与联系</a>提出。</p><p class="updated">制定：2026年8月26日 / 更新：2026年8月27日</p></section>`
    },
    terms: {
      description: '东京自行车地图的使用条件、免责声明和数据许可。',
      lede: '使用本地图前，请确认以下内容。',
      html: `<section><h2>作为信息地图使用</h2><p>东京自行车地图是用于调查自行车通行环境的参考信息，不保证导航、法律上的可通行性、安全性、施工状态或开放时间。</p></section><section><h2>骑行责任</h2><p>请遵守现场标志、交通规则、道路状况、天气和周围交通，并自行判断。请勿仅依据本地图判断道路是否可以通行。</p></section><section><h2>准确性与持续提供</h2><p>我们会尽可能更新信息，但不保证完整性、准确性、及时性或特定用途适用性。显示、分类或服务方式可能在不预告的情况下变更或停止。</p></section><section><h2>数据与著作权</h2><p>OpenStreetMap 衍生数据适用 Open Data Commons Open Database License。政府资料适用各发布方的使用条件。来源列在地图中。</p></section><section><h2>广告与赞助</h2><p>广告或赞助内容会与地图操作和数据明确区分。本网站不保证第三方商品或服务的质量与适用性。</p><p class="updated">制定：2026年8月26日</p></section>`
    }
  }
};

const languageQuery = (value) => value === 'ja' ? '' : `?lang=${value}`;

function renderNavigation() {
  const navigation = document.createElement('nav');
  navigation.className = 'info-nav';
  navigation.setAttribute('aria-label', labels[language].site);
  ['about', 'methodology', 'updates', 'contact', 'privacy', 'terms']
    .filter((id) => id !== pageId)
    .forEach((id) => {
      const link = document.createElement('a');
      link.href = `/${id}/index.html${languageQuery(language)}`;
      link.textContent = labels[language][id];
      navigation.append(link);
    });
  return navigation;
}

const header = document.querySelector('.info-header-inner');
if (header) {
  const control = document.createElement('div');
  control.className = 'info-language';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', labels[language].language);
  control.innerHTML = `<button type="button" data-info-language="ja">日本語</button><button type="button" data-info-language="en">English</button><button type="button" data-info-language="zh">中文</button>`;
  control.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.infoLanguage === language));
    button.addEventListener('click', () => {
      const nextLanguage = button.dataset.infoLanguage;
      if (nextLanguage === language) return;
      try {
        window.localStorage.setItem('tokyo-bike-map-language', nextLanguage);
      } catch {
        // The query parameter still carries the choice.
      }
      const url = new URL(window.location.href);
      if (nextLanguage === 'ja') url.searchParams.delete('lang');
      else url.searchParams.set('lang', nextLanguage);
      window.location.assign(url.href);
    });
  });
  header.append(control);
}

if (language !== 'ja' && pageId && pages[language]?.[pageId]) {
  const page = pages[language][pageId];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  document.title = `${labels[language][pageId]} | ${labels[language].title}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);
  const backLink = document.querySelector('.back-link');
  if (backLink) {
    backLink.href = `/${languageQuery(language)}`;
    backLink.textContent = labels[language].map;
  }
  const heading = document.querySelector('.info-header h1');
  if (heading) heading.textContent = labels[language][pageId];
  const main = document.querySelector('.info-main');
  if (main) {
    main.innerHTML = `<p class="lede">${page.lede}</p>${page.html}`;
    main.append(renderNavigation());
  }
}
