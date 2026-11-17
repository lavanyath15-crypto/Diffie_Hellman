import React from 'react';

interface StateMatrixGridProps {
  state: number[][];
  title: string;
  subtitle?: string;
  highlightIndices?: [number, number][];
  onCellClick?: (row: number, col: number, byte: number) => void;
  selectedCell?: [number, number] | null;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'crimson';
}

export const StateMatrixGrid: React.FC<StateMatrixGridProps> = ({
  state,
  title,
  subtitle,
  highlightIndices = [],
  onCellClick,
  selectedCell,
  accentColor = 'cyan',
}) => {
  const getCellBorder = (r: number, c: number) => {
    const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
    if (isSelected) return 'ring-2 ring-amber-400 bg-amber-950/60 text-amber-200';

    const isHighlighted = highlightIndices.some(([hr, hc]) => hr === r && hc === c);
    if (isHighlighted) {
      if (accentColor === 'emerald') return 'border-emerald-500/80 bg-emerald-950/50 text-emerald-300';
      if (accentColor === 'amber') return 'border-amber-500/80 bg-amber-950/50 text-amber-300';
      if (accentColor === 'crimson') return 'border-rose-500/80 bg-rose-950/50 text-rose-300';
      return 'border-cyan-500/80 bg-cyan-950/50 text-cyan-300';
    }

    return 'border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700 hover:bg-slate-850';
  };

  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] font-mono text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          4 × 4 STATE (128-bit)
        </div>
      </div>

      {/* Grid: 4 rows x 4 columns */}
      <div className="grid grid-cols-4 gap-2">
        {state.map((row, r) =>
          row.map((byte, c) => {
            const hex = byte.toString(16).padStart(2, '0').toUpperCase();
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => onCellClick?.(r, c, byte)}
                className={`relative group flex flex-col items-center justify-center p-2.5 rounded-lg border font-mono transition-all duration-150 ${getCellBorder(
                  r,
                  c
                )}`}
              >
                <span className="text-xs font-bold tracking-wider">{hex}</span>
                <span className="text-[9px] text-slate-500 mt-0.5">
                  [{r},{c}]
                </span>

                {/* Hover Tooltip showing Decimal & Binary */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                  <div className="bg-slate-900 text-slate-100 text-[10px] rounded px-2.5 py-1.5 border border-slate-700 shadow-xl whitespace-nowrap">
                    <p className="font-semibold text-cyan-400">Byte S[{r},{c}]</p>
                    <p>Hex: 0x{hex}</p>
                    <p>Dec: {byte}</p>
                    <p className="text-slate-400">Bin: {byte.toString(2).padStart(8, '0')}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Column labels (Column-major standard in FIPS 197) */}
      <div className="grid grid-cols-4 gap-2 mt-2 text-center">
        {['Word 0', 'Word 1', 'Word 2', 'Word 3'].map((w, idx) => (
          <span key={idx} className="text-[10px] font-mono text-slate-500">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};
