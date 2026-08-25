import sourceRegistry from '../../data/source-registry.json';

interface RegisteredSource {
  map_role: string;
  publisher: string;
  reference_dates?: string[];
  title: string;
  url: string;
}

export function renderSourceRegistry(container: HTMLElement): void {
  const sources = sourceRegistry.sources as RegisteredSource[];
  const renderedSources = sources.filter(
    (source) => source.map_role === 'comfort_geometry_and_tag_inference'
  );
  const referenceSources = sources.filter(
    (source) => source.map_role !== 'comfort_geometry_and_tag_inference'
  );

  const renderGroup = (title: string, entries: RegisteredSource[]): void => {
    const heading = document.createElement('h3');
    heading.className = 'source-group-title';
    heading.textContent = title;
    container.append(heading);

    entries.forEach((source) => {
      const item = document.createElement('div');
      item.className = 'source-item';

      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = source.title;

      const meta = document.createElement('small');
      meta.textContent = [source.publisher, source.reference_dates?.join(' / ')]
        .filter(Boolean)
        .join(' · ');

      item.append(link, meta);
      container.append(item);
    });
  };

  renderGroup('現在の安心度表示に使用', renderedSources);
  renderGroup('調査・参考資料（現在の地図には未反映）', referenceSources);

  const osmWayNote = document.createElement('p');
  osmWayNote.className = 'source-registry-note';
  osmWayNote.append(
    '各区間のOpenStreetMap元データは、地図上の区間を選ぶと個別に確認できます。',
    document.createElement('br')
  );
  const licenseLink = document.createElement('a');
  licenseLink.href = '/data/LICENSE.md';
  licenseLink.textContent = 'データライセンスを見る';
  osmWayNote.append(licenseLink);
  container.append(osmWayNote);

  const checked = document.createElement('p');
  checked.className = 'source-registry-date';
  checked.textContent = `出典確認日 ${sourceRegistry.last_checked}`;
  container.append(checked);
}
