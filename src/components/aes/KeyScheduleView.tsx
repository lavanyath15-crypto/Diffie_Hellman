import React from 'react';
import { expandKey, bytesToHex } from '../../core/aes/aesCore';
import { Key, ArrowRight } from 'lucide-react';

interface KeyScheduleViewProps {
  masterKeyBytes: number[];
  activeRound: number;
  onSelectRound: (round: number) => void;
}

export const KeyScheduleView: React.FC<KeyScheduleViewProps> = ({
  masterKeyBytes,
  activeRound,
  onSelectRound,
}) => {
  const roundKeys = expandKey(masterKeyBytes);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
            AES-128 Key Expansion Schedule
          </h3>
        </div>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded">
          11 ROUND KEYS (44 WORDS)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {roundKeys.map((keyState, round) => {
          // Flatten column major
          const flatBytes: number[] = [];
          for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
              flatBytes.push(keyState[r][c]);
            }
          }

          const isActive = round === activeRound;

          return (
            <button
              key={round}
              onClick={() => onSelectRound(round)}
              className={`text-left p-3 rounded-lg border transition-all font-mono text-xs ${
                isActive
                  ? 'border-amber-500/80 bg-amber-950/40 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                  : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] text-amber-400 flex items-center space-x-1">
                  <span>Round Key {round}</span>
                  {isActive && <ArrowRight className="w-3 h-3 text-amber-400 inline" />}
                </span>
                <span className="text-[9px] text-slate-500">
                  W[{round * 4}..{round * 4 + 3}]
                </span>
              </div>

              {/* 4x4 mini hex display */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center bg-slate-950/70 p-1.5 rounded border border-slate-800">
                {keyState.map((row, r) =>
                  row.map((byte, c) => (
                    <span
                      key={`${r}-${c}`}
                      className={isActive ? 'text-amber-300 font-bold' : 'text-slate-400'}
                    >
                      {byte.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  ))
                )}
              </div>

              <p className="text-[9px] text-slate-500 mt-1 truncate">
                {bytesToHex(flatBytes, '')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
