import type { LineString, MultiLineString, Position } from 'geojson';
import type {
  CyclingSegmentCollection,
  CyclingSegmentFeature
} from '../../src/types';

const metersPerLatitudeDegree = 110_540;
const metersPerLongitudeDegree = 111_320 * Math.cos((35.68 * Math.PI) / 180);
const gridSizeMeters = 40;
const overlapDistanceMeters = 6;
const sampleLengthMeters = 6;
const parallelCosineThreshold = Math.cos((25 * Math.PI) / 180);

interface Point2d {
  x: number;
  y: number;
}

interface IndexedSegment {
  start: Point2d;
  end: Point2d;
}

export interface ConflationStats {
  fullySuppressed: number;
  inputFeatures: number;
  outputFeatures: number;
  suppressedMeters: number;
  trimmed: number;
}

function toPoint(position: Position): Point2d {
  return {
    x: position[0] * metersPerLongitudeDegree,
    y: position[1] * metersPerLatitudeDegree
  };
}

function distance(left: Point2d, right: Point2d): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function pointToSegmentDistance(point: Point2d, segment: IndexedSegment): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, segment.start);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) /
        lengthSquared
    )
  );

  return distance(point, {
    x: segment.start.x + projection * dx,
    y: segment.start.y + projection * dy
  });
}

function isParallel(start: Point2d, end: Point2d, candidate: IndexedSegment): boolean {
  const leftX = end.x - start.x;
  const leftY = end.y - start.y;
  const rightX = candidate.end.x - candidate.start.x;
  const rightY = candidate.end.y - candidate.start.y;
  const leftLength = Math.hypot(leftX, leftY);
  const rightLength = Math.hypot(rightX, rightY);

  if (leftLength === 0 || rightLength === 0) {
    return false;
  }

  return (
    Math.abs(leftX * rightX + leftY * rightY) / (leftLength * rightLength) >=
    parallelCosineThreshold
  );
}

function interpolate(start: Position, end: Position, ratio: number): Position {
  return [
    start[0] + (end[0] - start[0]) * ratio,
    start[1] + (end[1] - start[1]) * ratio
  ];
}

function positionsEqual(left: Position, right: Position): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function lineLength(coordinates: Position[]): number {
  let length = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    length += distance(toPoint(coordinates[index - 1]), toPoint(coordinates[index]));
  }

  return length;
}

function geometryLines(geometry: LineString | MultiLineString): Position[][] {
  return geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
}

class SegmentGrid {
  private readonly cells = new Map<string, Set<IndexedSegment>>();

  private key(x: number, y: number): string {
    return `${x}:${y}`;
  }

  private cellRange(start: Point2d, end: Point2d): [number, number, number, number] {
    return [
      Math.floor((Math.min(start.x, end.x) - overlapDistanceMeters) / gridSizeMeters),
      Math.floor((Math.min(start.y, end.y) - overlapDistanceMeters) / gridSizeMeters),
      Math.floor((Math.max(start.x, end.x) + overlapDistanceMeters) / gridSizeMeters),
      Math.floor((Math.max(start.y, end.y) + overlapDistanceMeters) / gridSizeMeters)
    ];
  }

  add(start: Position, end: Position): void {
    const segment = { start: toPoint(start), end: toPoint(end) };
    const [minX, minY, maxX, maxY] = this.cellRange(segment.start, segment.end);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const key = this.key(x, y);
        const entries = this.cells.get(key) ?? new Set<IndexedSegment>();
        entries.add(segment);
        this.cells.set(key, entries);
      }
    }
  }

  candidates(start: Position, end: Position): IndexedSegment[] {
    const projectedStart = toPoint(start);
    const projectedEnd = toPoint(end);
    const [minX, minY, maxX, maxY] = this.cellRange(projectedStart, projectedEnd);
    const matches = new Set<IndexedSegment>();

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        this.cells.get(this.key(x, y))?.forEach((segment) => matches.add(segment));
      }
    }

    return [...matches];
  }
}

function addVisiblePiece(line: Position[], start: Position, end: Position): void {
  if (line.length === 0) {
    line.push(start);
  } else if (!positionsEqual(line[line.length - 1], start)) {
    line.push(start);
  }

  if (!positionsEqual(line[line.length - 1], end)) {
    line.push(end);
  }
}

function trimLine(
  coordinates: Position[],
  grid: SegmentGrid
): { changed: boolean; lines: Position[][] } {
  const visibleLines: Position[][] = [];
  let currentLine: Position[] = [];
  let changed = false;

  const flush = (): void => {
    if (currentLine.length >= 2 && lineLength(currentLine) >= 1) {
      visibleLines.push(currentLine);
    }
    currentLine = [];
  };

  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    const candidates = grid.candidates(start, end);

    if (candidates.length === 0) {
      addVisiblePiece(currentLine, start, end);
      continue;
    }

    const projectedStart = toPoint(start);
    const projectedEnd = toPoint(end);
    const steps = Math.max(1, Math.ceil(distance(projectedStart, projectedEnd) / sampleLengthMeters));

    for (let step = 0; step < steps; step += 1) {
      const pieceStart = interpolate(start, end, step / steps);
      const pieceEnd = interpolate(start, end, (step + 1) / steps);
      const projectedPieceStart = toPoint(pieceStart);
      const projectedPieceEnd = toPoint(pieceEnd);
      const midpoint = {
        x: (projectedPieceStart.x + projectedPieceEnd.x) / 2,
        y: (projectedPieceStart.y + projectedPieceEnd.y) / 2
      };
      const suppressed = candidates.some(
        (candidate) =>
          isParallel(projectedPieceStart, projectedPieceEnd, candidate) &&
          pointToSegmentDistance(midpoint, candidate) <= overlapDistanceMeters
      );

      if (suppressed) {
        changed = true;
        flush();
      } else {
        addVisiblePiece(currentLine, pieceStart, pieceEnd);
      }
    }
  }

  flush();
  return changed ? { changed, lines: visibleLines } : { changed, lines: [coordinates] };
}

function buildSuppressorGrid(features: CyclingSegmentFeature[]): SegmentGrid {
  const grid = new SegmentGrid();

  features
    .filter((feature) => ['A', 'B', 'C'].includes(feature.properties.comfort_class))
    .forEach((feature) => {
      geometryLines(feature.geometry).forEach((line) => {
        for (let index = 1; index < line.length; index += 1) {
          grid.add(line[index - 1], line[index]);
        }
      });
    });

  return grid;
}

export function conflateComfortSegments(input: CyclingSegmentCollection): {
  collection: CyclingSegmentCollection;
  stats: ConflationStats;
} {
  const grid = buildSuppressorGrid(input.features);
  const outputFeatures: CyclingSegmentFeature[] = [];
  let fullySuppressed = 0;
  let suppressedMeters = 0;
  let trimmed = 0;

  input.features.forEach((feature) => {
    if (feature.properties.comfort_class !== 'D') {
      outputFeatures.push(feature);
      return;
    }

    const originalLength = geometryLines(feature.geometry).reduce(
      (total, line) => total + lineLength(line),
      0
    );
    const results = geometryLines(feature.geometry).map((line) => trimLine(line, grid));
    const changed = results.some((result) => result.changed);

    if (!changed) {
      outputFeatures.push(feature);
      return;
    }

    const visibleLines = results.flatMap((result) => result.lines);
    const visibleLength = visibleLines.reduce((total, line) => total + lineLength(line), 0);
    suppressedMeters += Math.max(0, originalLength - visibleLength);

    if (visibleLines.length === 0) {
      fullySuppressed += 1;
      return;
    }

    trimmed += 1;
    outputFeatures.push({
      ...feature,
      geometry:
        visibleLines.length === 1
          ? { type: 'LineString', coordinates: visibleLines[0] }
          : { type: 'MultiLineString', coordinates: visibleLines }
    });
  });

  return {
    collection: { type: 'FeatureCollection', features: outputFeatures },
    stats: {
      fullySuppressed,
      inputFeatures: input.features.length,
      outputFeatures: outputFeatures.length,
      suppressedMeters: Math.round(suppressedMeters),
      trimmed
    }
  };
}
