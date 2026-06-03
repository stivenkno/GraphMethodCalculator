import { polygonHull } from 'd3-polygon';

export type OpType = '<=' | '>=' | '=';

export interface Constraint {
  id: string;
  a: number;
  b: number;
  op: OpType;
  c: number;
}

export function computeFeasibleRegion(constraints: Constraint[], xMaxLimit = 500, yMaxLimit = 500): [number, number][] {
  const lines: { a: number; b: number; c: number; op: OpType }[] = [...constraints];
  
  lines.push({ a: 1, b: 0, c: 0, op: '>=' });
  lines.push({ a: 0, b: 1, c: 0, op: '>=' });
  
  lines.push({ a: 1, b: 0, c: xMaxLimit, op: '<=' });
  lines.push({ a: 0, b: 1, c: yMaxLimit, op: '<=' });

  const points: [number, number][] = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const line1 = lines[i];
      const line2 = lines[j];

      const det = line1.a * line2.b - line1.b * line2.a;
      if (Math.abs(det) < 1e-10) continue;

      const x = (line1.c * line2.b - line1.b * line2.c) / det;
      const y = (line1.a * line2.c - line1.c * line2.a) / det;

      let isFeasible = true;
      for (let k = 0; k < lines.length; k++) {
        const val = lines[k].a * x + lines[k].b * y;
        const target = lines[k].c;
        const op = lines[k].op;

        if (op === '<=' && val > target + 1e-6) {
          isFeasible = false;
          break;
        } else if (op === '>=' && val < target - 1e-6) {
          isFeasible = false;
          break;
        } else if (op === '=' && Math.abs(val - target) > 1e-6) {
          isFeasible = false;
          break;
        }
      }

      if (isFeasible) {
        if (!points.some(v => Math.abs(v[0] - x) < 1e-5 && Math.abs(v[1] - y) < 1e-5)) {
          points.push([x, y]);
        }
      }
    }
  }

  if (points.length < 3) return points;
  return polygonHull(points) || points;
}

export function computeLineSegment(
  constraint: Constraint, 
  xBounds: [number, number], 
  yBounds: [number, number]
): [[number, number], [number, number]] | null {
  const { a, b, c } = constraint;
  const points: [number, number][] = [];

  if (Math.abs(a) < 1e-10) {
    if (Math.abs(b) < 1e-10) return null;
    const y = c / b;
    return [[xBounds[0], y], [xBounds[1], y]];
  }
  
  if (Math.abs(b) < 1e-10) {
    const x = c / a;
    return [[x, yBounds[0]], [x, yBounds[1]]];
  }

  points.push([xBounds[0], (c - a * xBounds[0]) / b]);
  points.push([xBounds[1], (c - a * xBounds[1]) / b]);
  
  return [points[0], points[1]];
}
