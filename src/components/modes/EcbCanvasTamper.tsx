import React, { useState, useRef, useEffect } from 'react';
import { Eye, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const EcbCanvasTamper: React.FC = () => {
  const GRID_SIZE = 16; // 16x16 pixels
  const [pixels, setPixels] = useState<number[]>(() => {
    // Initial pattern: A centered security shield
    const arr = Array(GRID_SIZE * GRID_SIZE).fill(0);
    // Draw shield pattern
    for (let y = 2; y <= 13; y++) {
      const halfWidth = y <= 8 ? Math.min(5, y - 1) : Math.max(1, 13 - y);
      for (let x = 8 - halfWidth; x <= 8 + halfWidth; x++) {
        arr[y * GRID_SIZE + x] = 1;
      }
    }
    return arr;
  });

  const [activeMode, setActiveMode] = useState<'ECB' | 'CBC'>('ECB');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render original pattern vs simulated cipher entropy
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeMode === 'ECB') {
      // ECB mode: Identical plaintext blocks encrypt to identical ciphertext blocks!
      // Therefore, background pixels (0) get one deterministic pseudo-random shade,
      // and foreground pixels (1) get another deterministic shade!
      // Silhouette remains 100% visible!
      pixels.forEach((val, idx) => {
        const x = (idx % GRID_SIZE) * cellSize;
        const y = Math.floor(idx / GRID_SIZE) * cellSize;

        if (val === 1) {
          // Foreground encrypted block: high-contrast pattern
          ctx.fillStyle = '#06b6d4'; // Cyan
        } else {
          // Background encrypted block: constant dark tone
          ctx.fillStyle = '#0f172a'; // Deep slate
        }
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(x, y, cellSize, cellSize);
      });
    } else {
      // CBC / GCM mode: IV chaining destroys spatial correlation.
      // Every single block produces pseudo-random white-noise output!
      pixels.forEach((_, idx) => {
        const x = (idx % GRID_SIZE) * cellSize;
        const y = Math.floor(idx / GRID_SIZE) * cellSize;

        // Pseudo-random noise derived from PRNG
        const noise = (Math.sin(idx * 9999 + 42) * 10000) % 1;
        const intensity = Math.floor(Math.abs(noise) * 200) + 30;
        ctx.fillStyle = `rgb(${intensity * 0.4}, ${intensity * 0.7}, ${intensity * 0.9})`;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(x, y, cellSize, cellSize);
      });
    }
  }, [pixels, activeMode]);

  const handlePixelToggle = (index: number) => {
    setPixels(prev => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
  };

  const clearCanvas = () => {
    setPixels(Array(GRID_SIZE * GRID_SIZE).fill(0));
  };

  const loadTuxPenguinPreset = () => {
    const arr = Array(GRID_SIZE * GRID_SIZE).fill(0);
    // Draw Tux Penguin outline
    const penguinCoords = [
      [2, 7], [2, 8],
      [3, 6], [3, 7], [3, 8], [3, 9],
      [4, 6], [4, 7], [4, 8], [4, 9],
      [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10],
      [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11],
      [7, 4], [7, 5], [7, 10], [7, 11],
      [8, 4], [8, 5], [8, 10], [8, 11],
      [9, 4], [9, 5], [9, 10], [9, 11],
      [10, 5], [10, 6], [10, 7], [10, 8], [10, 9], [10, 10],
      [11, 4], [11, 5], [11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11],
      [12, 3], [12, 4], [12, 11], [12, 12],
    ];
    penguinCoords.forEach(([y, x]) => {
      arr[y * GRID_SIZE + x] = 1;
    });
    setPixels(arr);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>ECB Mode Structural Pattern Leakage (Tux Penguin Experiment)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Draw on the bitmap or load presets to inspect deterministic cipher correlation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadTuxPenguinPreset}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tux Penguin Preset</span>
          </button>
          <button
            onClick={clearCanvas}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200"
            title="Clear Canvas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Interactive Plaintext Bitmap Editor */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-mono font-semibold text-slate-300">
              Interactive Plaintext Bitmap (16 × 16)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Click pixels to toggle
            </span>
          </div>

          <div
            className="grid grid-cols-16 gap-0.5 bg-slate-900 p-2 rounded-lg border border-slate-800 select-none cursor-pointer"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
          >
            {pixels.map((val, idx) => (
              <div
                key={idx}
                onClick={() => handlePixelToggle(idx)}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs transition-colors ${
                  val === 1
                    ? 'bg-cyan-400 border border-cyan-300'
                    : 'bg-slate-950 border border-slate-800/80 hover:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Ciphertext Output Comparison */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-mono font-semibold text-slate-300">
              Simulated Ciphertext Output
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveMode('ECB')}
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all ${
                  activeMode === 'ECB'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-sm'
                    : 'text-slate-400 bg-slate-900 hover:bg-slate-800'
                }`}
              >
                ECB Mode (Vulnerable)
              </button>
              <button
                onClick={() => setActiveMode('CBC')}
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all ${
                  activeMode === 'CBC'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-sm'
                    : 'text-slate-400 bg-slate-900 hover:bg-slate-800'
                }`}
              >
                CBC / GCM Mode (Secure)
              </button>
            </div>
          </div>

          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              className="w-64 h-64 rounded bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Security Analysis Banner */}
      <div
        className={`p-3 rounded-lg border text-xs font-mono flex items-start space-x-2.5 ${
          activeMode === 'ECB'
            ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
        }`}
      >
        <Eye className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            {activeMode === 'ECB'
              ? 'ECB Deterministic Vulnerability Confirmed:'
              : 'Chaining & Nonce Randomization Verified:'}
          </span>{' '}
          {activeMode === 'ECB'
            ? 'Because ECB encrypts identical 128-bit blocks independently with the same key (Ci = E_K(Pi)), identical background bytes yield identical cipher bytes. An attacker visually reconstructs data patterns without decrypting the key!'
            : 'CBC chains the previous ciphertext block (C0 = E_K(P0 ⊕ IV), Ci = E_K(Pi ⊕ Ci-1)). This eliminates data correlation, ensuring the output achieves maximum Shannon entropy.'}
        </div>
      </div>
    </div>
  );
};
