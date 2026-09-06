import type { BicycleParkingFeature, BicyclePumpFeature } from '../types';

export interface ParkingMapLinks {
  apple: string;
  google: string;
}

export function createPointMapLinks(
  feature: BicycleParkingFeature | BicyclePumpFeature
): ParkingMapLinks {
  const [longitude, latitude] = feature.geometry.coordinates;
  const coordinates = `${latitude},${longitude}`;
  const google = new URL('https://www.google.com/maps/search/');
  const apple = new URL('https://maps.apple.com/');

  google.searchParams.set('api', '1');
  google.searchParams.set('query', coordinates);
  apple.searchParams.set('ll', coordinates);
  apple.searchParams.set('q', feature.properties.name);

  return { apple: apple.toString(), google: google.toString() };
}

export function createParkingMapLinks(feature: BicycleParkingFeature): ParkingMapLinks {
  return createPointMapLinks(feature);
}
