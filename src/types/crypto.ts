// Core Cryptographic Types & Interfaces

export type ModuleId = 'aes' | 'des' | 'modes' | 'ecc' | 'sha256' | 'zkp';

export interface AesRoundStep {
  stepName: 'Initial Key Addition' | 'SubBytes' | 'ShiftRows' | 'MixColumns' | 'AddRoundKey';
  state: number[][]; // 4x4 matrix of byte values (0-255)
  description: string;
  formula?: string;
  highlightIndices?: [number, number][]; // row, col
  roundKey?: number[][];
}

export interface AesRoundData {
  roundNumber: number;
  steps: AesRoundStep[];
}

export type BlockCipherMode = 'ECB' | 'CBC' | 'CTR' | 'GCM';

export interface BlockTrace {
  blockIndex: number;
  plaintextHex: string;
  ivHex?: string;
  preCipherHex?: string;
  ciphertextHex: string;
  isTampered?: boolean;
}

export interface ModesSimulationResult {
  mode: BlockCipherMode;
  blocks: BlockTrace[];
  authTag?: string;
  tagValid?: boolean;
  aadHex?: string;
}

export interface EccPoint {
  x: number;
  y: number;
  isInfinity: boolean;
}

export interface EccCalculationStep {
  description: string;
  type: 'add' | 'double' | 'scalar';
  pointP: EccPoint;
  pointQ?: EccPoint;
  result: EccPoint;
  slope?: number;
  formula: string;
}

export interface Sha256StepState {
  step: number; // 0 to 63
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  W_t: number;
  K_t: number;
  T1: number;
  T2: number;
  ch: number;
  maj: number;
  sigma0: number;
  sigma1: number;
}

export interface AvalancheComparison {
  input1: string;
  input2: string;
  hash1Hex: string;
  hash2Hex: string;
  hash1Bin: string;
  hash2Bin: string;
  bitDifferences: number; // count of flipped bits
  flipPercentage: number;
  flippedBitIndices: number[]; // indices 0..255
}

export interface SchnorrProofState {
  p: number; // Prime modulus
  g: number; // Generator
  x: number; // Prover's secret key
  y: number; // Prover's public key (g^x mod p)
  v: number; // Random ephemeral commitment factor
  t: number; // Commitment (g^v mod p)
  c: number; // Verifier's challenge
  r: number; // Prover's response: (v - c * x) mod (p - 1)
  verificationLeft: number; // (g^r * y^c) mod p
  verificationRight: number; // t mod p
  isValid: boolean;
  isImpostor: boolean;
  impostorGuess?: number;
  roundHistory: {
    round: number;
    challenge: number;
    response: number;
    success: boolean;
  }[];
}
