import React, { useRef, useEffect, useState } from 'react';
import { EccPoint, EccCalculationStep } from '../../types/crypto';
import { DEFAULT_CURVE, addPoints, scalarMultiply, CurveParams } from '../../core/ecc/curveMath';
import { Play, RotateCcw, Plus, Zap } from 'lucide-react';

export const InteractiveCurveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real Weierstrass curve: y^2 = x^3 - 3x + 3
  const [curveA, setCurveA] = useState<number>(-3);
  const [curveB, setCurveB] = useState<number>(3);

  // Interactive points
  const [pX, setPX] = useState<number>(-1.5);
  const [qX, setQX] = useState<number>(1.2);
  const [operationType, setOperationType] = useState<'add' | 'double'>('add');

  // Calculate y for given x on y^2 = x^3 + ax + b
  const getY = (x: number, a: number, b: number): number | null => {
    const rhs = x ** 3 + a * x + b;
    if (rhs < 0) return null;
    return Math.sqrt(rhs);
  };

  const pY = getY(pX, curveA, curveB) ?? 1;
  const qY = operationType === 'double' ? pY : (getY(qX, curveA, curveB) ?? 1);

  // Render continuous Weierstrass curve and geometric chords
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;
    const scale = 36; // pixels per unit

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Draw Continuous Curve: y^2 = x^3 + ax + b
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 2.5;

    // Top branch (+y)
    ctx.beginPath();
    let started = false;
    for (let screenX = 0; screenX < width; screenX += 1.5) {
      const mathX = (screenX - originX) / scale;
      const mathY = getY(mathX, curveA, curveB);
      if (mathY !== null) {
        const screenY = originY - mathY * scale;
        if (!started) {
          ctx.moveTo(screenX, screenY);
          started = true;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();

    // Bottom branch (-y)
    ctx.beginPath();
    started = false;
    for (let screenX = 0; screenX < width; screenX += 1.5) {
      const mathX = (screenX - originX) / scale;
      const mathY = getY(mathX, curveA, curveB);
      if (mathY !== null) {
        const screenY = originY + mathY * scale;
        if (!started) {
          ctx.moveTo(screenX, screenY);
          started = true;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();

    // Geometry: Point P and Q
    let lambda: number;
    if (operationType === 'double') {
      // Tangent line at P: lambda = (3x^2 + a)/(2y)
      lambda = (3 * pX * pX + curveA) / (2 * pY);
    } else {
      // Secant line through P and Q: lambda = (yQ - yP)/(xQ - xP)
      lambda = Math.abs(qX - pX) < 0.001 ? 0 : (qY - pY) / (qX - pX);
    }

    // Intersection x3 = lambda^2 - x1 - x2
    const x3 = operationType === 'double' ? lambda * lambda - 2 * pX : lambda * lambda - pX - qX;
    const y3Intersect = lambda * (pX - x3) - pY; // -R
    const y3Result = -y3Intersect; // R (reflected across x-axis)

    // Draw secant / tangent line
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    const lineX1 = -6;
    const lineY1 = pY + lambda * (lineX1 - pX);
    const lineX2 = 6;
    const lineY2 = pY + lambda * (lineX2 - pX);
    ctx.moveTo(originX + lineX1 * scale, originY - lineY1 * scale);
    ctx.lineTo(originX + lineX2 * scale, originY - lineY2 * scale);
    ctx.stroke();

    // Draw reflection vertical line (from -R to R)
    ctx.strokeStyle = '#ef4444'; // Crimson
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(originX + x3 * scale, originY - y3Intersect * scale);
    ctx.lineTo(originX + x3 * scale, originY - y3Result * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Helper: draw point
    const drawPoint = (x: number, y: number, color: string, label: string) => {
      const scrX = originX + x * scale;
      const scrY = originY - y * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(scrX, scrY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(label, scrX + 8, scrY - 6);
    };

    drawPoint(pX, pY, '#06b6d4', 'P');
    if (operationType === 'add') {
      drawPoint(qX, qY, '#10b981', 'Q');
    }
    // Intersection -R
    drawPoint(x3, y3Intersect, '#94a3b8', '-R');
    // Final Result R
    drawPoint(x3, y3Result, '#10b981', operationType === 'double' ? '2P' : 'R = P + Q');
  }, [curveA, curveB, pX, qX, operationType, pY, qY]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center space-x-2">
            <span>Weierstrass Elliptic Curve Geometry Engine</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded">
              y² = x³ + ax + b
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Interactive chord-and-tangent geometric group operations: Point Addition & Point Doubling
          </p>
        </div>

        {/* Operation Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setOperationType('add')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              operationType === 'add'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Point Addition (P + Q)</span>
          </button>
          <button
            onClick={() => setOperationType('double')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              operationType === 'double'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Point Doubling (2P)</span>
          </button>
        </div>
      </div>

      {/* Canvas and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex justify-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <canvas
            ref={canvasRef}
            width={600}
            height={380}
            className="w-full max-w-[600px] h-[340px] rounded-lg shadow-inner"
          />
        </div>

        {/* Sliders & Coordinates */}
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider border-b border-slate-800 pb-1.5">
              Curve Parameters & Points
            </h4>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Point P x-coordinate:</span>
                <span className="text-cyan-400 font-bold">{pX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={pX}
                onChange={e => setPX(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {operationType === 'add' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Point Q x-coordinate:</span>
                  <span className="text-emerald-400 font-bold">{qX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.5"
                  step="0.05"
                  value={qX}
                  onChange={e => setQX(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
            )}
          </div>

          {/* Mathematical Proof Card */}
          <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">
              Group Law Formulation
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p>
                <strong className="text-slate-400">Slope λ:</strong>{' '}
                {operationType === 'double'
                  ? 'λ = (3x₁² + a) / (2y₁) [Tangent]'
                  : 'λ = (y₂ - y₁) / (x₂ - x₁) [Secant]'}
              </p>
              <p>
                <strong className="text-slate-400">x₃:</strong> x₃ = λ² - x₁ - x₂
              </p>
              <p>
                <strong className="text-slate-400">y₃:</strong> y₃ = λ(x₁ - x₃) - y₁
              </p>
              <p className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
                Any secant/tangent intersects the cubic curve at exactly 3 points. The reflection across y=0 establishes the abelian group identity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
