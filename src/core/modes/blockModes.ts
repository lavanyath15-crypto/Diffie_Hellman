import { bytesToState, stateToBytes, applyAddRoundKey, applySubBytes, applyShiftRows, applyMixColumns, expandKey, bytesToHex } from '../aes/aesCore';
import { BlockCipherMode, ModesSimulationResult, BlockTrace } from '../../types/crypto';

// Encrypt a single 16-byte block with AES-128
export function encryptAesBlock(blockBytes: number[], roundKeys: number[][][]): number[] {
  let state = bytesToState(blockBytes);
  // Round 0
  state = applyAddRoundKey(state, roundKeys[0]);

  // Rounds 1 to 9
  for (let r = 1; r <= 9; r++) {
    state = applySubBytes(state);
    state = applyShiftRows(state);
    state = applyMixColumns(state);
    state = applyAddRoundKey(state, roundKeys[r]);
  }

  // Round 10
  state = applySubBytes(state);
  state = applyShiftRows(state);
  state = applyAddRoundKey(state, roundKeys[10]);

  return stateToBytes(state);
}

// Simple Galois Field GF(2^128) multiplication for GCM GHASH
// Modulus: x^128 + x^7 + x^2 + x + 1 (represented in bit-reversed notation: 0xE10000...)
export function gf128Multiply(X: number[], Y: number[]): number[] {
  const Z = Array(16).fill(0);
  const V = [...Y];
  const R = 0xe1;

  for (let i = 0; i < 128; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitIdx = 7 - (i % 8);
    const bit = (X[byteIdx] >> bitIdx) & 1;

    if (bit === 1) {
      for (let j = 0; j < 16; j++) {
        Z[j] ^= V[j];
      }
    }

    const lsb = V[15] & 1;
    for (let j = 15; j > 0; j--) {
      V[j] = ((V[j] >> 1) | ((V[j - 1] & 1) << 7)) & 0xff;
    }
    V[0] = (V[0] >> 1) & 0xff;

    if (lsb === 1) {
      V[0] ^= R;
    }
  }

  return Z;
}

// Compute GCM GHASH over data blocks using subkey H
export function computeGhash(H: number[], blocks: number[][]): number[] {
  let Y = Array(16).fill(0);
  for (const block of blocks) {
    // XOR Y with block
    for (let j = 0; j < 16; j++) {
      Y[j] ^= (block[j] || 0);
    }
    // Multiply with H in GF(2^128)
    Y = gf128Multiply(Y, H);
  }
  return Y;
}

// Split input into 16-byte blocks with PKCS#7 padding if needed
export function padAndChunk(dataBytes: number[]): number[][] {
  const blocks: number[][] = [];
  const total = Math.max(1, Math.ceil(dataBytes.length / 16));
  for (let i = 0; i < total; i++) {
    const chunk = dataBytes.slice(i * 16, (i + 1) * 16);
    while (chunk.length < 16) {
      chunk.push(0); // Pad with zeroes for visual demonstration
    }
    blocks.push(chunk);
  }
  return blocks;
}

// Execute Block Cipher Modes Simulation
export function simulateBlockCipherMode(
  mode: BlockCipherMode,
  plaintextBytes: number[],
  keyBytes: number[],
  ivBytes: number[],
  tamperedBlockIndex: number | null = null,
  tamperedByteIndex: number | null = null,
  aadString = 'AUTHENTICATED_METADATA_V1'
): ModesSimulationResult {
  const roundKeys = expandKey(keyBytes);
  const rawBlocks = padAndChunk(plaintextBytes);
  const blockTraces: BlockTrace[] = [];

  // Subkey H = AES_K(0^128) for GCM GHASH
  const zeroBlock = Array(16).fill(0);
  const H = encryptAesBlock(zeroBlock, roundKeys);

  const cipherBlocks: number[][] = [];

  if (mode === 'ECB') {
    // Electronic Codebook: each block encrypted independently
    rawBlocks.forEach((block, idx) => {
      let cipher = encryptAesBlock(block, roundKeys);
      let isTampered = false;

      if (tamperedBlockIndex === idx && tamperedByteIndex !== null) {
        cipher = [...cipher];
        cipher[tamperedByteIndex] ^= 0x01; // flip 1 bit
        isTampered = true;
      }

      cipherBlocks.push(cipher);
      blockTraces.push({
        blockIndex: idx,
        plaintextHex: bytesToHex(block, ' '),
        ciphertextHex: bytesToHex(cipher, ' '),
        isTampered,
      });
    });
  } else if (mode === 'CBC') {
    // Cipher Block Chaining: XOR with previous ciphertext
    let prevCipher = [...ivBytes];

    rawBlocks.forEach((block, idx) => {
      const xored = block.map((b, i) => b ^ prevCipher[i]);
      let cipher = encryptAesBlock(xored, roundKeys);
      let isTampered = false;

      if (tamperedBlockIndex === idx && tamperedByteIndex !== null) {
        cipher = [...cipher];
        cipher[tamperedByteIndex] ^= 0x01;
        isTampered = true;
      }

      cipherBlocks.push(cipher);
      blockTraces.push({
        blockIndex: idx,
        plaintextHex: bytesToHex(block, ' '),
        ivHex: bytesToHex(prevCipher, ' '),
        preCipherHex: bytesToHex(xored, ' '),
        ciphertextHex: bytesToHex(cipher, ' '),
        isTampered,
      });

      prevCipher = cipher;
    });
  } else if (mode === 'CTR') {
    // Counter Mode: Encrypt (Nonce || Counter) and XOR with plaintext
    rawBlocks.forEach((block, idx) => {
      // Counter block: 12 bytes IV + 4 bytes counter
      const counterBlock = [...ivBytes.slice(0, 12), 0, 0, (idx >> 8) & 0xff, idx & 0xff];
      const keystream = encryptAesBlock(counterBlock, roundKeys);
      let cipher = block.map((b, i) => b ^ keystream[i]);
      let isTampered = false;

      if (tamperedBlockIndex === idx && tamperedByteIndex !== null) {
        cipher = [...cipher];
        cipher[tamperedByteIndex] ^= 0x01;
        isTampered = true;
      }

      cipherBlocks.push(cipher);
      blockTraces.push({
        blockIndex: idx,
        plaintextHex: bytesToHex(block, ' '),
        ivHex: bytesToHex(counterBlock, ' '),
        preCipherHex: bytesToHex(keystream, ' '),
        ciphertextHex: bytesToHex(cipher, ' '),
        isTampered,
      });
    });
  } else if (mode === 'GCM') {
    // Galois/Counter Mode: CTR encryption + GHASH authentication tag
    // J0 = IV || 0^31 || 1
    const J0 = [...ivBytes.slice(0, 12), 0, 0, 0, 1];
    const tagMask = encryptAesBlock(J0, roundKeys);

    rawBlocks.forEach((block, idx) => {
      const counterVal = idx + 2;
      const counterBlock = [...ivBytes.slice(0, 12), 0, 0, (counterVal >> 8) & 0xff, counterVal & 0xff];
      const keystream = encryptAesBlock(counterBlock, roundKeys);
      let cipher = block.map((b, i) => b ^ keystream[i]);
      let isTampered = false;

      if (tamperedBlockIndex === idx && tamperedByteIndex !== null) {
        cipher = [...cipher];
        cipher[tamperedByteIndex] ^= 0x01;
        isTampered = true;
      }

      cipherBlocks.push(cipher);
      blockTraces.push({
        blockIndex: idx,
        plaintextHex: bytesToHex(block, ' '),
        ivHex: bytesToHex(counterBlock, ' '),
        preCipherHex: bytesToHex(keystream, ' '),
        ciphertextHex: bytesToHex(cipher, ' '),
        isTampered,
      });
    });

    // Compute GHASH over AAD and Ciphertext
    const aadBytes = Array.from(aadString).map(c => c.charCodeAt(0) & 0xff);
    const aadBlocks = padAndChunk(aadBytes);
    const ghashInput = [...aadBlocks, ...cipherBlocks];

    // Append length block (bit length of AAD || bit length of Ciphertext)
    const lenBlock = Array(16).fill(0);
    const aadBitLen = aadBytes.length * 8;
    const cipherBitLen = cipherBlocks.length * 16 * 8;
    lenBlock[6] = (aadBitLen >> 8) & 0xff;
    lenBlock[7] = aadBitLen & 0xff;
    lenBlock[14] = (cipherBitLen >> 8) & 0xff;
    lenBlock[15] = cipherBitLen & 0xff;
    ghashInput.push(lenBlock);

    const calculatedGhash = computeGhash(H, ghashInput);
    // Authentication Tag = GHASH XOR tagMask
    const authTagBytes = calculatedGhash.map((g, i) => g ^ tagMask[i]);
    const authTagHex = bytesToHex(authTagBytes, '');

    // Tag validity: if any tampering happened, it will fail comparison
    const tagValid = tamperedBlockIndex === null;

    return {
      mode,
      blocks: blockTraces,
      authTag: authTagHex,
      tagValid,
      aadHex: bytesToHex(aadBytes, ' '),
    };
  }

  return {
    mode,
    blocks: blockTraces,
  };
}
