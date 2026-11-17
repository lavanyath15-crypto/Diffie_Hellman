import React, { useState } from 'react';
import { EcbCanvasTamper } from './EcbCanvasTamper';
import { TamperAttackLab } from './TamperAttackLab';
import { BlockCipherMode } from '../../types/crypto';
import { simulateBlockCipherMode } from '../../core/modes/blockModes';
import { parseInputTo16Bytes } from '../../core/aes/aesCore';
import { Layers, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ModesVisualizer: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<BlockCipherMode>('GCM');
  const [inputText, setInputText] = useState<string>('');
  const [keyText, setKeyText] = useState<string>('');
  const [ivText, setIvText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tux' | 'attack'>('pipeline');

  const keyBytes = parseInputTo16Bytes(keyText, false);
  const ivBytes = parseInputTo16Bytes(ivText, false);
  const plainBytes = Array.from(new TextEncoder().encode(inputText));
  const hasValidKeyAndIv = /^[\x00-\x7f]{16}$/.test(keyText) && /^[\x00-\x7f]{16}$/.test(ivText);
  const canSimulate = hasValidKeyAndIv && inputText.length > 0;
  const simulation = canSimulate ? simulateBlockCipherMode(selectedMode, plainBytes, keyBytes, ivBytes) : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100 flex items-center space-x-2">
              <span className="text-cyan-400">#</span>
              <span>Compare ways to protect messages</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Choose a method to see how it protects a message and whether it can detect changes.
            </p>
          </div>

          {/* Mode Select Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(['ECB', 'CBC', 'CTR', 'GCM'] as BlockCipherMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                  selectedMode === mode
                    ? mode === 'ECB'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 mt-4 pt-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'pipeline'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            See each step
          </button>
          <button
            onClick={() => setActiveTab('tux')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'tux'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Why ECB can leak patterns
          </button>
          <button
            onClick={() => setActiveTab('attack')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'attack'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Try changing a message
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Message to explore
              <input value={inputText} onChange={e => setInputText(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-sm" placeholder="Type a message" />
            </label>
            <label className="text-sm font-semibold text-slate-700">AES key (16 characters)
              <input value={keyText} onChange={e => setKeyText(e.target.value)} maxLength={16} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-sm" placeholder="Enter exactly 16 characters" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Initialization value (16 characters)
              <input value={ivText} onChange={e => setIvText(e.target.value)} maxLength={16} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-sm" placeholder="Enter exactly 16 characters" />
            </label>
            {!canSimulate && <p className="text-sm text-amber-800 md:col-span-3">Enter a message and exactly 16 ASCII characters for both the key and initialization value to show the block trace.</p>}
            <p className="text-xs text-slate-500 md:col-span-3">This section shows a simplified learning trace. For real encryption and decryption, use the AES tool above, which uses the browser’s authenticated AES-GCM implementation.</p>
          </div>
          {/* Mode Summary Cards */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs font-mono">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-slate-400">Current Mode: </span>
                <span className="font-bold text-cyan-400 text-sm">{selectedMode} Mode</span>
                <p className="text-slate-400 text-xs mt-1">
                  {selectedMode === 'ECB' &&
                    'ECB encrypts each part of the message in the same way. Repeated parts look the same, which can reveal patterns. Avoid this method for real messages.'}
                  {selectedMode === 'CBC' &&
                    'CBC mixes each message part with the part before it. This hides repeated patterns, but it does not detect if someone changes the message.'}
                  {selectedMode === 'CTR' &&
                    'CTR turns the key into a stream of values and combines them with the message. It is fast, but by itself it cannot detect changes.'}
                  {selectedMode === 'GCM' &&
                    'GCM protects the message and adds a check that can reveal if it was changed. This is a common choice for modern secure connections.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                    selectedMode === 'GCM'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                      : selectedMode === 'ECB'
                      ? 'bg-rose-950 text-rose-300 border-rose-700/50'
                      : 'bg-amber-950 text-amber-300 border-amber-700/50'
                  }`}
                >
                  {selectedMode === 'GCM'
                    ? 'Protects message and checks for changes'
                    : selectedMode === 'ECB'
                    ? 'Can reveal repeated patterns'
                    : 'Protects message only'}
                </span>
              </div>
            </div>
          </div>

          {/* Block Pipeline Traces */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {simulation ? `Follow the message (${simulation.blocks.length} parts)` : 'Message steps'}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {simulation?.blocks.map(block => (
                <div
                  key={block.blockIndex}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md font-mono text-xs flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  {/* Plaintext Block */}
                  <div className="flex-1 w-full">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Plaintext Block #{block.blockIndex}
                    </span>
                    <p className="text-cyan-300 font-bold mt-0.5 truncate">
                      {block.plaintextHex}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block shrink-0" />

                  {/* Pre-cipher XOR / Keystream */}
                  {block.preCipherHex && (
                    <div className="flex-1 w-full bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {selectedMode === 'CBC' ? 'XOR with Prev Cipher' : 'CTR Keystream'}
                      </span>
                      <p className="text-amber-300 font-bold mt-0.5 truncate">
                        {block.preCipherHex}
                      </p>
                    </div>
                  )}

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block shrink-0" />

                  {/* Ciphertext Output */}
                  <div className="flex-1 w-full bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Ciphertext Block #{block.blockIndex}
                    </span>
                    <p className="text-emerald-400 font-bold mt-0.5 truncate">
                      {block.ciphertextHex}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* If GCM, show Authentication Tag */}
            {selectedMode === 'GCM' && simulation?.authTag && (
              <div className="bg-slate-950 border border-emerald-800/40 rounded-xl p-4 shadow-md font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-400" />
                    <span>128-Bit GCM Authentication Tag (GHASH)</span>
                  </span>
                  <p className="text-emerald-300 font-bold text-sm mt-1">
                    0x{simulation.authTag}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 rounded">
                  INTEGRITY VERIFIED
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tux' && <EcbCanvasTamper />}

      {activeTab === 'attack' && <TamperAttackLab />}
    </div>
  );
};
