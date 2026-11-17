import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StateMatrixGrid } from './StateMatrixGrid';
import { SBoxExplorer } from './SBoxExplorer';
import { KeyScheduleView } from './KeyScheduleView';
import {
  parseInputTo16Bytes,
  generateAesSimulation,
  bytesToHex,
  cloneState,
} from '../../core/aes/aesCore';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  Info,
  Code2,
} from 'lucide-react';
import { CipherWorkbench } from '../CipherWorkbench';

export const AesVisualizer: React.FC = () => {
  // NIST FIPS 197 Standard Test Vector: Plaintext "00112233445566778899aabbccddeeff" & Key "000102030405060708090a0b0c0d0e0f"
  const [plaintextInput, setPlaintextInput] = useState<string>('00112233445566778899aabbccddeeff');
  const [keyInput, setKeyInput] = useState<string>('000102030405060708090a0b0c0d0e0f');
  const [isHexMode, setIsHexMode] = useState<boolean>(true);

  // Playback state
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  const [activeTab, setActiveTab] = useState<'matrix' | 'sbox' | 'keys'>('matrix');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plaintextBytes = useMemo(
    () => parseInputTo16Bytes(plaintextInput, isHexMode),
    [plaintextInput, isHexMode]
  );
  const keyBytes = useMemo(
    () => parseInputTo16Bytes(keyInput, isHexMode),
    [keyInput, isHexMode]
  );

  const simulation = useMemo(
    () => generateAesSimulation(plaintextBytes, keyBytes),
    [plaintextBytes, keyBytes]
  );
  const isBlockInputValid = isHexMode
    ? /^[0-9a-fA-F]{32}$/.test(plaintextInput) && /^[0-9a-fA-F]{32}$/.test(keyInput)
    : new TextEncoder().encode(plaintextInput).length === 16 && new TextEncoder().encode(keyInput).length === 16;

  const activeRoundData = simulation[currentRound] || simulation[0];
  const activeStep = activeRoundData.steps[currentStepIndex] || activeRoundData.steps[0];

  // Derive previous state for side-by-side comparison
  const previousState = useMemo(() => {
    if (currentStepIndex > 0) {
      return activeRoundData.steps[currentStepIndex - 1].state;
    }
    if (currentRound > 0) {
      const prevRound = simulation[currentRound - 1];
      return prevRound.steps[prevRound.steps.length - 1].state;
    }
    return activeStep.state;
  }, [simulation, currentRound, currentStepIndex, activeRoundData, activeStep]);

  // Step advancement
  const stepNext = () => {
    if (currentStepIndex < activeRoundData.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentRound < 10) {
      setCurrentRound(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      setIsPlaying(false);
    }
  };

  const stepPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (currentRound > 0) {
      const prevR = currentRound - 1;
      setCurrentRound(prevR);
      setCurrentStepIndex(simulation[prevR].steps.length - 1);
    }
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentRound(0);
    setCurrentStepIndex(0);
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        stepNext();
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, currentRound, currentStepIndex, activeRoundData]);

  // Preset NIST Vectors
  const loadNistVector = () => {
    setIsHexMode(true);
    setPlaintextInput('00112233445566778899aabbccddeeff');
    setKeyInput('000102030405060708090a0b0c0d0e0f');
    resetSimulation();
  };

  const loadAsciiSample = () => {
    setIsHexMode(false);
    setPlaintextInput('CYBER_DEFENSE_26');
    setKeyInput('SECURE_KEY_128BI');
    resetSimulation();
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration & Control Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100 flex items-center space-x-2">
              <span className="text-cyan-400">#</span>
              <span>See how AES locks a message</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Encrypt any length message, then explore how AES processes one 16-byte block.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadNistVector}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>NIST FIPS 197 Vector</span>
            </button>
            <button
              onClick={loadAsciiSample}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>ASCII Text Sample</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300">
                Message to protect
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {isHexMode ? '32 Hex Characters' : '16 ASCII Characters'}
              </span>
            </div>
            <input
              type="text"
              value={plaintextInput}
              onChange={e => {
                setPlaintextInput(e.target.value);
                resetSimulation();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              placeholder={isHexMode ? 'Hex 32 chars' : '16-char ASCII string'}
            />
            <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
              Hex: {bytesToHex(plaintextBytes, ' ')}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300">
                Secret key
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {isHexMode ? '32 Hex Characters' : '16 ASCII Characters'}
              </span>
            </div>
            <input
              type="text"
              value={keyInput}
              onChange={e => {
                setKeyInput(e.target.value);
                resetSimulation();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              placeholder={isHexMode ? 'Hex 32 chars' : '16-char ASCII key'}
            />
            <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
              Hex: {bytesToHex(keyBytes, ' ')}
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Round Transformations
          </button>
          <button
            onClick={() => setActiveTab('sbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'sbox'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Byte lookup table
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'keys'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            How the key changes
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'matrix' && !isBlockInputValid && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">The AES round-by-round view works on one 16-byte block. Enter exactly 32 hexadecimal digits in Hex mode, or exactly 16 single-byte characters in text mode. Use the AES tool above for messages of any length.</p>}

      {activeTab === 'matrix' && isBlockInputValid && (
        <div className="space-y-6">
      <CipherWorkbench initialCipher="AES" />
          {/* Step Timeline & Playback Controller */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Play/Pause & Step Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'PAUSE' : 'SIMULATE'}</span>
              </button>

              <button
                onClick={stepPrev}
                disabled={currentRound === 0 && currentStepIndex === 0}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                title="Step Backward"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={stepNext}
                disabled={currentRound === 10 && currentStepIndex === activeRoundData.steps.length - 1}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                title="Step Forward"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={resetSimulation}
                className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800"
                title="Reset to Round 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed Controller */}
              <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-800 text-xs font-mono text-slate-400">
                <span>Speed:</span>
                {[
                  { label: '0.5x', ms: 1500 },
                  { label: '1x', ms: 1000 },
                  { label: '2x', ms: 500 },
                ].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setPlaybackSpeed(s.ms)}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      playbackSpeed === s.ms
                        ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Buttons (0 to 10) */}
            <div className="flex items-center space-x-1 overflow-x-auto py-1">
              {simulation.map((rnd, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => {
                    setCurrentRound(rIdx);
                    setCurrentStepIndex(0);
                    setIsPlaying(false);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                    currentRound === rIdx
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  R{rIdx}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Step Navigation Pills within Current Round */}
          <div className="flex flex-wrap items-center gap-2">
            {activeRoundData.steps.map((st, sIdx) => {
              const isCurrentStep = currentStepIndex === sIdx;
              return (
                <button
                  key={sIdx}
                  onClick={() => {
                    setCurrentStepIndex(sIdx);
                    setIsPlaying(false);
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isCurrentStep
                      ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span className="font-semibold">{st.stepName}</span>
                </button>
              );
            })}
          </div>

          {/* Step Formula & Explanation Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-xs font-mono">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">
                    Round {currentRound} — {activeStep.stepName}
                  </h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    {activeStep.description}
                  </p>
                </div>
              </div>
              {activeStep.formula && (
                <div className="shrink-0 bg-slate-950 px-3 py-1.5 rounded border border-slate-700/80 text-cyan-300 font-semibold">
                  {activeStep.formula}
                </div>
              )}
            </div>
          </div>

          {/* Side-by-Side State Matrix Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StateMatrixGrid
              state={previousState}
              title="Pre-Transformation State"
              subtitle="State entering current operation"
              accentColor="cyan"
            />

            <StateMatrixGrid
              state={activeStep.state}
              title={`Post-${activeStep.stepName} State`}
              subtitle={`State after Round ${currentRound} ${activeStep.stepName}`}
              accentColor="emerald"
            />

            {activeStep.roundKey ? (
              <StateMatrixGrid
                state={activeStep.roundKey}
                title={`Round ${currentRound} Key Matrix`}
                subtitle={`Derived key W[${currentRound * 4}..${currentRound * 4 + 3}]`}
                accentColor="amber"
              />
            ) : (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                  <Code2 className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-mono font-bold text-slate-300">
                  Galois Field Diffusion
                </h5>
                <p className="text-[11px] font-mono text-slate-400 mt-1 max-w-[220px]">
                  {activeStep.stepName === 'MixColumns'
                    ? 'Multiplying state columns with constant matrix over GF(2^8) modulo x^8+x^4+x^3+x+1'
                    : 'Applying high non-linear permutation across state bytes'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sbox' && <SBoxExplorer initialByte={0x53} />}

      {activeTab === 'keys' && (
        <KeyScheduleView
          masterKeyBytes={keyBytes}
          activeRound={currentRound}
          onSelectRound={round => {
            setCurrentRound(round);
            setCurrentStepIndex(0);
            setActiveTab('matrix');
          }}
        />
      )}
    </div>
  );
};
