import { EccPoint, EccCalculationStep } from '../../types/crypto';

// Extended Euclidean Algorithm for modular inverse: a^-1 mod m
export function modInverse(a: number, m: number): number {
  let [oldR, r] = [((a % m) + m) % m, m];
  let [oldS, s] = [1, 0];

  while (r !== 0) {
    const quotient = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }

  if (oldR !== 1) {
    return 0; // No inverse exists
  }
  return ((oldS % m) + m) % m;
}

// Elliptic Curve definition over finite field F_p: y^2 = x^3 + ax + b (mod p)
export interface CurveParams {
  p: number; // Prime modulus
  a: number;
  b: number;
  G: EccPoint; // Generator base point
  order: number; // Order of G
}

// Educational secure curve parameters with rich integer coordinates
export const DEFAULT_CURVE: CurveParams = {
  p: 97, // prime
  a: 2,
  b: 3,
  G: { x: 3, y: 6, isInfinity: false },
  order: 31,
};

// Check if point satisfies y^2 = x^3 + ax + b (mod p)
export function isOnCurve(point: EccPoint, curve: CurveParams): boolean {
  if (point.isInfinity) return true;
  const left = (point.y * point.y) % curve.p;
  const right = (((point.x ** 3) + curve.a * point.x + curve.b) % curve.p + curve.p) % curve.p;
  return left === right;
}

// Point Addition: P + Q on curve
export function addPoints(P: EccPoint, Q: EccPoint, curve: CurveParams): { result: EccPoint; slope?: number; formula: string } {
  if (P.isInfinity) return { result: { ...Q }, formula: 'P is Point-at-Infinity => Result = Q' };
  if (Q.isInfinity) return { result: { ...P }, formula: 'Q is Point-at-Infinity => Result = P' };

  const { p, a } = curve;

  // Opposite points: P + (-P) = Infinity
  if (P.x === Q.x && (P.y + Q.y) % p === 0) {
    return {
      result: { x: 0, y: 0, isInfinity: true },
      formula: 'P and Q are vertical reflections: P + (-P) = Point-at-Infinity (O)',
    };
  }

  let lambda: number;
  let formula: string;

  if (P.x === Q.x && P.y === Q.y) {
    // Point Doubling: P = Q
    if (P.y === 0) {
      return {
        result: { x: 0, y: 0, isInfinity: true },
        formula: 'Tangent is vertical (y = 0) => Result = Point-at-Infinity (O)',
      };
    }
    const numerator = (3 * P.x * P.x + a) % p;
    const denominator = (2 * P.y) % p;
    const invDenom = modInverse(denominator, p);
    lambda = ((numerator * invDenom) % p + p) % p;
    formula = `Tangent Slope λ = (3·x₁² + a)/(2·y₁) mod p = (3·${P.x}² + ${a})/(2·${P.y}) ≡ ${lambda} (mod ${p})`;
  } else {
    // Point Addition: P ≠ Q
    const numerator = ((Q.y - P.y) % p + p) % p;
    const denominator = ((Q.x - P.x) % p + p) % p;
    const invDenom = modInverse(denominator, p);
    lambda = ((numerator * invDenom) % p + p) % p;
    formula = `Secant Slope λ = (y₂ - y₁)/(x₂ - x₁) mod p = (${Q.y} - ${P.y})/(${Q.x} - ${P.x}) ≡ ${lambda} (mod ${p})`;
  }

  const xR = (((lambda * lambda - P.x - Q.x) % p) + p) % p;
  const yR = (((lambda * (P.x - xR) - P.y) % p) + p) % p;

  return {
    result: { x: xR, y: yR, isInfinity: false },
    slope: lambda,
    formula: `${formula} | x₃ = λ² - x₁ - x₂ = ${xR}, y₃ = λ(x₁ - x₃) - y₁ = ${yR}`,
  };
}

// Scalar Multiplication: k * P via Double-and-Add Algorithm
export function scalarMultiply(
  k: number,
  P: EccPoint,
  curve: CurveParams
): { result: EccPoint; steps: EccCalculationStep[] } {
  let current: EccPoint = { x: 0, y: 0, isInfinity: true };
  let base: EccPoint = { ...P };
  let scalar = k;
  const steps: EccCalculationStep[] = [];

  let bitIndex = 0;
  while (scalar > 0) {
    if (scalar & 1) {
      const addRes = addPoints(current, base, curve);
      steps.push({
        description: `Bit ${bitIndex} is 1: Accumulate Base Point to Result`,
        type: 'add',
        pointP: { ...current },
        pointQ: { ...base },
        result: { ...addRes.result },
        slope: addRes.slope,
        formula: addRes.formula,
      });
      current = addRes.result;
    }

    scalar >>= 1;
    if (scalar > 0) {
      const doubleRes = addPoints(base, base, curve);
      steps.push({
        description: `Bit ${bitIndex}: Double Base Point for next power of 2`,
        type: 'double',
        pointP: { ...base },
        pointQ: { ...base },
        result: { ...doubleRes.result },
        slope: doubleRes.slope,
        formula: doubleRes.formula,
      });
      base = doubleRes.result;
    }
    bitIndex++;
  }

  return { result: current, steps };
}

// Find all integer points on the curve in F_p
export function getAllPointsOnCurve(curve: CurveParams): EccPoint[] {
  const points: EccPoint[] = [];
  const { p, a, b } = curve;

  for (let x = 0; x < p; x++) {
    const rhs = (((x ** 3) + a * x + b) % p + p) % p;
    for (let y = 0; y < p; y++) {
      if ((y * y) % p === rhs) {
        points.push({ x, y, isInfinity: false });
      }
    }
  }
  return points;
}
