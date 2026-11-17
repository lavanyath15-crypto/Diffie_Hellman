import { SBOX, RCON, gfMultiply } from './aesConstants';
import { AesRoundData, AesRoundStep } from '../../types/crypto';

// Creates a 4x4 matrix from a 16-byte array (Column-Major order as per FIPS 197)
export function bytesToState(bytes: number[]): number[][] {
  const state: number[][] = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      state[r][c] = bytes[c * 4 + r] || 0;
    }
  }
  return state;
}

// Converts a 4x4 state matrix back to 16-byte array
export function stateToBytes(state: number[][]): number[] {
  const bytes: number[] = [];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      bytes.push(state[r][c]);
    }
  }
  return bytes;
}

// Deep clone a 4x4 matrix
export function cloneState(state: number[][]): number[][] {
  return state.map(row => [...row]);
}

// 1. SubBytes Transformation (non-linear byte substitution using Rijndael S-Box)
export function applySubBytes(state: number[][]): number[][] {
  const result = cloneState(state);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      result[r][c] = SBOX[result[r][c]];
    }
  }
  return result;
}

// 2. ShiftRows Transformation (cyclic left shift of row r by r positions)
export function applyShiftRows(state: number[][]): number[][] {
  const result = cloneState(state);
  // Row 0: no shift
  // Row 1: left shift 1
  const r1 = [result[1][1], result[1][2], result[1][3], result[1][0]];
  // Row 2: left shift 2
  const r2 = [result[2][2], result[2][3], result[2][0], result[2][1]];
  // Row 3: left shift 3
  const r3 = [result[3][3], result[3][0], result[3][1], result[3][2]];

  result[1] = r1;
  result[2] = r2;
  result[3] = r3;
  return result;
}

// 3. MixColumns Transformation (polynomial multiplication in GF(2^8))
// Each column is multiplied by the fixed matrix:
// [ 02 03 01 01 ]
// [ 01 02 03 01 ]
// [ 01 01 02 03 ]
// [ 03 01 01 02 ]
export function applyMixColumns(state: number[][]): number[][] {
  const result = cloneState(state);
  for (let c = 0; c < 4; c++) {
    const s0 = state[0][c];
    const s1 = state[1][c];
    const s2 = state[2][c];
    const s3 = state[3][c];

    result[0][c] = gfMultiply(0x02, s0) ^ gfMultiply(0x03, s1) ^ s2 ^ s3;
    result[1][c] = s0 ^ gfMultiply(0x02, s1) ^ gfMultiply(0x03, s2) ^ s3;
    result[2][c] = s0 ^ s1 ^ gfMultiply(0x02, s2) ^ gfMultiply(0x03, s3);
    result[3][c] = gfMultiply(0x03, s0) ^ s1 ^ s2 ^ gfMultiply(0x02, s3);
  }
  return result;
}

// 4. AddRoundKey Transformation (XOR state with 128-bit round key)
export function applyAddRoundKey(state: number[][], roundKey: number[][]): number[][] {
  const result = cloneState(state);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      result[r][c] ^= roundKey[r][c];
    }
  }
  return result;
}

// Key Expansion Algorithm for 128-bit AES Key -> 11 Round Keys (44 32-bit words)
export function expandKey(masterKeyBytes: number[]): number[][][] {
  const words: number[][] = []; // 44 words, each 4 bytes
  
  // First 4 words are the master key
  for (let i = 0; i < 4; i++) {
    words.push([
      masterKeyBytes[4 * i] || 0,
      masterKeyBytes[4 * i + 1] || 0,
      masterKeyBytes[4 * i + 2] || 0,
      masterKeyBytes[4 * i + 3] || 0,
    ]);
  }

  // Generate words 4 through 43
  for (let i = 4; i < 44; i++) {
    let temp = [...words[i - 1]];
    if (i % 4 === 0) {
      // RotWord: cyclic left shift of 4-byte word
      temp = [temp[1], temp[2], temp[3], temp[0]];
      // SubWord: S-Box substitution on each byte
      temp = temp.map(b => SBOX[b]);
      // XOR with Rcon
      temp[0] ^= RCON[i / 4];
    }
    // XOR with word (i - 4)
    const prev = words[i - 4];
    words.push([
      prev[0] ^ temp[0],
      prev[1] ^ temp[1],
      prev[2] ^ temp[2],
      prev[3] ^ temp[3],
    ]);
  }

  // Group 44 words into 11 round keys of 4x4 state matrices
  const roundKeys: number[][][] = [];
  for (let r = 0; r < 11; r++) {
    const keyState: number[][] = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let c = 0; c < 4; c++) {
      for (let row = 0; row < 4; row++) {
        keyState[row][c] = words[r * 4 + c][row];
      }
    }
    roundKeys.push(keyState);
  }

  return roundKeys;
}

// Complete Full Simulation Generator: Executes all 10 rounds and records state snapshots
export function generateAesSimulation(plaintextBytes: number[], keyBytes: number[]): AesRoundData[] {
  const roundKeys = expandKey(keyBytes);
  const simulation: AesRoundData[] = [];

  let currentState = bytesToState(plaintextBytes);

  // Round 0: Pre-round transformation (AddRoundKey only)
  const round0Steps: AesRoundStep[] = [
    {
      stepName: 'Initial Key Addition',
      state: cloneState(currentState),
      description: 'Initial state populated from 16-byte plaintext input matrix.',
      formula: 'State = Plaintext',
      roundKey: cloneState(roundKeys[0]),
    }
  ];

  currentState = applyAddRoundKey(currentState, roundKeys[0]);
  round0Steps.push({
    stepName: 'AddRoundKey',
    state: cloneState(currentState),
    description: 'Pre-round transformation: Bitwise XOR of initial State with Round Key 0 (W[0..3]).',
    formula: 'State = State ⊕ RoundKey[0]',
    roundKey: cloneState(roundKeys[0]),
  });

  simulation.push({ roundNumber: 0, steps: round0Steps });

  // Rounds 1 to 9 (Standard Rounds: SubBytes -> ShiftRows -> MixColumns -> AddRoundKey)
  for (let r = 1; r <= 9; r++) {
    const steps: AesRoundStep[] = [];

    // SubBytes
    currentState = applySubBytes(currentState);
    steps.push({
      stepName: 'SubBytes',
      state: cloneState(currentState),
      description: `Non-linear substitution using the Rijndael S-Box over GF(2^8) affine inversion.`,
      formula: 'S\'[r,c] = SBox(S[r,c])',
    });

    // ShiftRows
    currentState = applyShiftRows(currentState);
    steps.push({
      stepName: 'ShiftRows',
      state: cloneState(currentState),
      description: `Cyclic left shifting: Row 0 shifted 0, Row 1 shifted 1, Row 2 shifted 2, Row 3 shifted 3.`,
      formula: 'S\'[r, c] = S[r, (c + r) mod 4]',
    });

    // MixColumns
    currentState = applyMixColumns(currentState);
    steps.push({
      stepName: 'MixColumns',
      state: cloneState(currentState),
      description: `Column matrix multiplication in GF(2^8) modulo x^8 + x^4 + x^3 + x + 1 for high diffusion.`,
      formula: 'S\'[0..3, c] = Matrix_MixCol ⊗ S[0..3, c]',
    });

    // AddRoundKey
    currentState = applyAddRoundKey(currentState, roundKeys[r]);
    steps.push({
      stepName: 'AddRoundKey',
      state: cloneState(currentState),
      description: `Round key addition: Bitwise XOR with derived 128-bit key schedule for Round ${r}.`,
      formula: `State = State ⊕ RoundKey[${r}]`,
      roundKey: cloneState(roundKeys[r]),
    });

    simulation.push({ roundNumber: r, steps });
  }

  // Round 10 (Final Round: SubBytes -> ShiftRows -> AddRoundKey, NO MixColumns)
  const round10Steps: AesRoundStep[] = [];

  currentState = applySubBytes(currentState);
  round10Steps.push({
    stepName: 'SubBytes',
    state: cloneState(currentState),
    description: 'Final Round: Byte substitution via S-Box.',
    formula: 'S\'[r,c] = SBox(S[r,c])',
  });

  currentState = applyShiftRows(currentState);
  round10Steps.push({
    stepName: 'ShiftRows',
    state: cloneState(currentState),
    description: 'Final Round: Cyclic row shifts.',
    formula: 'S\'[r, c] = S[r, (c + r) mod 4]',
  });

  currentState = applyAddRoundKey(currentState, roundKeys[10]);
  round10Steps.push({
    stepName: 'AddRoundKey',
    state: cloneState(currentState),
    description: 'Final Round Key XOR producing the final 128-bit ciphertext block.',
    formula: 'Ciphertext = State ⊕ RoundKey[10]',
    roundKey: cloneState(roundKeys[10]),
  });

  simulation.push({ roundNumber: 10, steps: round10Steps });

  return simulation;
}

// Helper: Convert string or hex to 16 bytes array
export function parseInputTo16Bytes(input: string, isHex = false): number[] {
  const result: number[] = Array(16).fill(0);
  if (isHex) {
    const cleaned = input.replace(/[^0-9a-fA-F]/g, '');
    for (let i = 0; i < 16; i++) {
      const byteStr = cleaned.slice(i * 2, i * 2 + 2);
      result[i] = byteStr ? parseInt(byteStr, 16) : 0;
    }
  } else {
    for (let i = 0; i < 16; i++) {
      result[i] = i < input.length ? input.charCodeAt(i) & 0xff : 0;
    }
  }
  return result;
}

// Convert byte array to formatted hex string
export function bytesToHex(bytes: number[], separator = ' '): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(separator);
}
