import type { BicycleParkingFeature, NearbyParking } from '../types';

const earthRadiusMeters = 6_371_000;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const startLatitude = radians(latitudeA);
  const endLatitude = radians(latitudeB);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export function findNearbyParking(
  features: BicycleParkingFeature[],
  latitude: number,
  longitude: number,
  limit = 5,
  radiusMeters = 2_000
): NearbyParking[] {
  const seenFacilities = new Set<string>();
  return features
    .map((feature) => {
      const [parkingLongitude, parkingLatitude] = feature.geometry.coordinates;
      return {
        distanceMeters: distanceMeters(latitude, longitude, parkingLatitude, parkingLongitude),
        feature
      };
    })
    .filter(({ distanceMeters: distance }) => distance <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .filter(({ feature }) => {
      const [parkingLongitude, parkingLatitude] = feature.geometry.coordinates;
      const facilityKey = [
        feature.properties.municipality.trim(),
        feature.properties.name.trim(),
        parkingLatitude.toFixed(5),
        parkingLongitude.toFixed(5)
      ].join('|');
      if (seenFacilities.has(facilityKey)) return false;
      seenFacilities.add(facilityKey);
      return true;
    })
    .slice(0, limit);
}
