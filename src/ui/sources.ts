import sourceRegistry from '../../data/source-registry.json';
import { messages, type Language } from '../i18n';
import type { BicycleParkingFeature } from '../types';

interface RegisteredSource {
  map_role: string;
  publisher: string;
  reference_dates?: string[];
  title: string;
  url: string;
}

function parkingSourcesFromFeatures(features: BicycleParkingFeature[]): RegisteredSource[] {
  const bySource = new Map<string, RegisteredSource>();

  features.forEach(({ properties }) => {
    if (bySource.has(properties.source_url)) return;
    bySource.set(properties.source_url, {
      map_role: 'official_bicycle_parking',
      publisher: properties.source_publisher ?? properties.municipality,
      reference_dates: properties.source_updated_at ? [properties.source_updated_at] : undefined,
      title: properties.source_title,
      url: properties.source_url
    });
  });

  return [...bySource.values()].sort((left, right) =>
    left.publisher.localeCompare(right.publisher, 'ja')
  );
}

export function renderSourceRegistry(
  container: HTMLElement,
  language: Language,
  parkingFeatures: BicycleParkingFeature[] = []
): void {
  const copy = messages[language];
  const sources = sourceRegistry.sources as RegisteredSource[];
  container.replaceChildren();
  const renderedSources = sources.filter(
    (source) => source.map_role === 'comfort_geometry_and_tag_inference'
  );
  const parkingSources = parkingSourcesFromFeatures(parkingFeatures);
  const referenceSources = sources.filter(
    (source) =>
      source.map_role !== 'comfort_geometry_and_tag_inference' &&
      source.map_role !== 'official_bicycle_parking'
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

  renderGroup(copy.sourceCurrent, renderedSources);
  if (parkingSources.length > 0) renderGroup(copy.sourceParking, parkingSources);
  renderGroup(copy.sourceReferences, referenceSources);

  const osmWayNote = document.createElement('p');
  osmWayNote.className = 'source-registry-note';
  osmWayNote.append(copy.sourceNote, document.createElement('br'));
  const licenseLink = document.createElement('a');
  licenseLink.href = '/data/LICENSE.md';
  licenseLink.textContent = copy.sourceLicense;
  osmWayNote.append(licenseLink);
  container.append(osmWayNote);

  const checked = document.createElement('p');
  checked.className = 'source-registry-date';
  checked.textContent = `${copy.sourceChecked} ${sourceRegistry.last_checked}`;
  container.append(checked);
}
