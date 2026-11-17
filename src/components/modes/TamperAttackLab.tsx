import React, { useState } from 'react';
import { simulateBlockCipherMode } from '../../core/modes/blockModes';
import { parseInputTo16Bytes, bytesToHex } from '../../core/aes/aesCore';
import { ShieldCheck, ShieldAlert, Bug, RefreshCw } from 'lucide-react';

export const TamperAttackLab: React.FC = () => {
  const [plaintext, setPlaintext] = useState<string>('');
  const [keyText, setKeyText] = useState<string>('');
  const [ivText, setIvText] = useState<string>('');
  const [selectedTamperByte, setSelectedTamperByte] = useState<{ block: number; byte: number } | null>(null);

  const keyBytes = parseInputTo16Bytes(keyText, false);
  const ivBytes = parseInputTo16Bytes(ivText, false);
  const plainBytes = Array.from(new TextEncoder().encode(plaintext));
  const canRun = /^[\x00-\x7f]{16}$/.test(keyText) && /^[\x00-\x7f]{16}$/.test(ivText) && plaintext.length > 0;

  // Run simulation for CBC and GCM
  const cbcResult = canRun ? simulateBlockCipherMode(
    'CBC',
    plainBytes,
    keyBytes,
    ivBytes,
    selectedTamperByte?.block ?? null,
    selectedTamperByte?.byte ?? null
  ) : null;

  const gcmResult = canRun ? simulateBlockCipherMode(
    'GCM',
    plainBytes,
    keyBytes,
    ivBytes,
    selectedTamperByte?.block ?? null,
    selectedTamperByte?.byte ?? null
  ) : null;

  const resetAttack = () => {
    setSelectedTamperByte(null);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center space-x-2">
            <Bug className="w-4 h-4 text-rose-400" />
            <span>Adversary Bit-Flipping & AEAD Tamper Lab</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Simulate active ciphertext tampering: CBC malleability vs GCM GHASH cryptographic authentication
          </p>
        </div>

        <button
          onClick={resetAttack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Tampering</span>
        </button>
      </div>

      {/* Target Message Input */}
      <div>
        <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
          Message to use in the tampering demonstration:
        </label>
        <input
          type="text"
          value={plaintext}
          onChange={e => setPlaintext(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs font-mono font-semibold text-slate-300">AES key (16 ASCII characters)
          <input value={keyText} onChange={e => setKeyText(e.target.value)} maxLength={16} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Enter 16 characters" />
        </label>
        <label className="block text-xs font-mono font-semibold text-slate-300">Initialization value (16 ASCII characters)
          <input value={ivText} onChange={e => setIvText(e.target.value)} maxLength={16} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Enter 16 characters" />
        </label>
      </div>
      {!canRun && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Enter a message, a 16-character key, and a 16-character initialization value to start.</p>}

      {/* Ciphertext Stream with Click-to-Tamper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-slate-300">
            Encrypted Ciphertext Stream (Click any byte to inject a bit flip C ⊕ 0x01):
          </span>
          {selectedTamperByte ? (
            <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              Tampered: Block {selectedTamperByte.block}, Byte {selectedTamperByte.byte}
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Unmodified Ciphertext (Integrity Clean)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cbcResult?.blocks.map(block => (
            <div
              key={block.blockIndex}
              className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs font-mono"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold text-slate-200">
                  Block #{block.blockIndex} (16 Bytes)
                </span>
                <span className="text-[10px] text-slate-500">
                  Plain: {block.plaintextHex.slice(0, 14)}...
                </span>
              </div>

              {/* Bytes grid for clicking */}
              <div className="grid grid-cols-8 gap-1.5">
                {block.ciphertextHex.split(' ').map((byteHex, bIdx) => {
                  const isTampered =
                    selectedTamperByte?.block === block.blockIndex &&
                    selectedTamperByte?.byte === bIdx;

                  return (
                    <button
                      key={bIdx}
                      onClick={() =>
                        setSelectedTamperByte(
                          isTampered ? null : { block: block.blockIndex, byte: bIdx }
                        )
                      }
                      className={`p-1 rounded text-center font-bold text-[11px] transition-all ${
                        isTampered
                          ? 'bg-rose-500 text-slate-950 ring-2 ring-rose-400'
                          : 'bg-slate-950 text-cyan-300 border border-slate-800 hover:border-cyan-500/60'
                      }`}
                      title={`Click to flip bit in Block ${block.blockIndex}, Byte ${bIdx}`}
                    >
                      {byteHex}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison: Decryption Outcome in CBC vs GCM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* CBC Outcome */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-200">
                CBC Mode Decryption Result
              </span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded">
                Unauthenticated Mode
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <p className="text-slate-500 text-[10px]">DECRYPTED PAYLOAD AT RECEIVER:</p>
              {selectedTamperByte ? (
                <p className="text-rose-400 font-bold break-all">
                  A ciphertext byte was changed. CBC does not verify integrity, so the receiver may get corrupted message data.
                </p>
              ) : (
                <p className="text-emerald-400 font-semibold break-all">{plaintext}</p>
              )}
            </div>
          </div>

          <div className="mt-3 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              <strong>Vulnerability:</strong> CBC lacks cryptographic integrity. Flipping bit <em>i</em> in ciphertext block <em>Cₖ</em> completely flips bit <em>i</em> in plaintext block <em>Pₖ₊₁</em>, allowing controlled transaction tampering!
            </p>
          </div>
        </div>

        {/* GCM Outcome */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-200">
                GCM (AEAD) Decryption Result
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  (gcmResult?.tagValid ?? true)
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                    : 'text-rose-400 bg-rose-950/60 border-rose-800/50'
                }`}
              >
                {!gcmResult ? 'WAITING FOR INPUT' : gcmResult.tagValid ? 'TAG_VERIFIED' : 'AUTH_FAILED'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
              <p className="text-slate-500 text-[10px]">128-BIT GHASH AUTHENTICATION TAG:</p>
              <p className="text-amber-400 font-mono text-xs break-all">
                {gcmResult ? `0x${gcmResult.authTag}` : 'Enter message, key, and initialization value above.'}
              </p>
              <div className="pt-1">
                {!gcmResult || gcmResult.tagValid ? (
                  <p className="text-emerald-400 font-bold">
                    STATUS: 200 OK — Tag matches GHASH polynomial. Message decrypted safely.
                  </p>
                ) : (
                  <p className="text-rose-400 font-bold">
                    SECURITY EXCEPTION: 400 INTEGRITY_VIOLATION — GHASH Tag mismatch! Payload dropped before processing.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Defense Architecture:</strong> GCM provides Authenticated Encryption with Associated Data (AEAD). Any alteration in ciphertext or headers invalidates the GHASH Galois field tag, defeating malleability attacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
