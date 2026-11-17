import React, { useState } from 'react';
import { SBOX } from '../../core/aes/aesConstants';
import { Search, Info } from 'lucide-react';

interface SBoxExplorerProps {
  initialByte?: number;
}

export const SBoxExplorer: React.FC<SBoxExplorerProps> = ({ initialByte = 0x53 }) => {
  const [selectedByte, setSelectedByte] = useState<number>(initialByte);
  const [inputHex, setInputHex] = useState<string>(
    initialByte.toString(16).padStart(2, '0').toUpperCase()
  );

  const row = (selectedByte >> 4) & 0x0f;
  const col = selectedByte & 0x0f;
  const substitutedByte = SBOX[selectedByte];
  const subHex = substitutedByte.toString(16).padStart(2, '0').toUpperCase();

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 2);
    setInputHex(val);
    if (val.length === 2) {
      setSelectedByte(parseInt(val, 16));
    }
  };

  const handleCellSelect = (r: number, c: number) => {
    const byteVal = (r << 4) | c;
    setSelectedByte(byteVal);
    setInputHex(byteVal.toString(16).padStart(2, '0').toUpperCase());
  };

  const hexHeaders = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center space-x-2">
            <span>Rijndael S-Box Substitution Engine</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded">
              16 × 16 GF(2⁸)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Non-linear byte substitution: Multiplicative inverse in GF(2⁸) + Affine Transformation
          </p>
        </div>

        {/* Byte selector input */}
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono text-slate-400">Byte: 0x</span>
          <input
            type="text"
            value={inputHex}
            onChange={handleHexChange}
            maxLength={2}
            className="w-8 bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none uppercase"
          />
        </div>
      </div>

      {/* Interactive lookup banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-slate-400">Input Byte (X):</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">
            0x{selectedByte.toString(16).padStart(2, '0').toUpperCase()}
          </p>
        </div>
        <div>
          <span className="text-slate-400">Matrix Coordinates:</span>
          <p className="text-sm font-bold text-cyan-400 mt-0.5">
            Row: 0x{row.toString(16).toUpperCase()}, Col: 0x{col.toString(16).toUpperCase()}
          </p>
        </div>
        <div>
          <span className="text-slate-400">S-Box Output S(X):</span>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">
            0x{subHex} ({substitutedByte})
          </p>
        </div>
        <div>
          <span className="text-slate-400">Bitwise Non-Linearity:</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Deg 7 algebraic complexity
          </p>
        </div>
      </div>

      {/* 16x16 Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse font-mono text-[10px]">
          <thead>
            <tr>
              <th className="p-1 text-slate-500 bg-slate-900 border border-slate-800">
                R \ C
              </th>
              {hexHeaders.map(h => (
                <th
                  key={h}
                  className={`p-1 border border-slate-800 ${
                    parseInt(h, 16) === col
                      ? 'bg-cyan-950/80 text-cyan-300 font-bold'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hexHeaders.map((rLabel, rIdx) => {
              const isSelectedRow = rIdx === row;
              return (
                <tr key={rLabel}>
                  <td
                    className={`p-1 font-bold border border-slate-800 ${
                      isSelectedRow
                        ? 'bg-cyan-950/80 text-cyan-300'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {rLabel}
                  </td>
                  {hexHeaders.map((cLabel, cIdx) => {
                    const byteVal = (rIdx << 4) | cIdx;
                    const subVal = SBOX[byteVal];
                    const isTarget = isSelectedRow && cIdx === col;
                    const isRowMatch = isSelectedRow;
                    const isColMatch = cIdx === col;

                    let bgClass = 'bg-slate-950 text-slate-400 hover:bg-slate-800';
                    if (isTarget) {
                      bgClass = 'bg-emerald-500 text-slate-950 font-extrabold ring-2 ring-emerald-400 z-10';
                    } else if (isRowMatch || isColMatch) {
                      bgClass = 'bg-cyan-950/40 text-cyan-300';
                    }

                    return (
                      <td
                        key={cLabel}
                        onClick={() => handleCellSelect(rIdx, cIdx)}
                        className={`p-1 border border-slate-800/60 cursor-pointer transition-colors ${bgClass}`}
                        title={`Input: 0x${byteVal.toString(16).padStart(2, '0').toUpperCase()} -> Output: 0x${subVal.toString(16).padStart(2, '0').toUpperCase()}`}
                      >
                        {subVal.toString(16).padStart(2, '0').toUpperCase()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start space-x-2 text-[11px] font-mono text-slate-400 bg-slate-900/40 p-2.5 rounded border border-slate-800">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Cryptographic Defense Principle:</strong> The Rijndael S-Box provides high non-linearity (strict avalanche criterion, differential uniformity of 4, no fixed points S(x)≠x and no opposite points S(x)≠x̄) making AES resistant against linear and differential cryptanalysis.
        </p>
      </div>
    </div>
  );
};
