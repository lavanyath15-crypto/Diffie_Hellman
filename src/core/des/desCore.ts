const IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
const FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
const E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
const P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
const PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
const PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
const SBOX = [
  [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
  [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
  [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
  [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
  [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
  [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
  [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
  [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
];

function permute(value: bigint, inputBits: number, table: number[]): bigint {
  let out = 0n;
  for (const position of table) out = (out << 1n) | ((value >> BigInt(inputBits - position)) & 1n);
  return out;
}

function makeSubkeys(key: Uint8Array): bigint[] {
  if (key.length !== 8) throw new Error('DES needs exactly 8 key bytes. Enter 8 characters or 16 hexadecimal digits.');
  const raw = key.reduce((n, b) => (n << 8n) | BigInt(b), 0n);
  const selected = permute(raw, 64, PC1);
  let c = Number((selected >> 28n) & 0xfffffffn);
  let d = Number(selected & 0xfffffffn);
  return SHIFTS.map(shift => {
    c = ((c << shift) | (c >>> (28 - shift))) & 0x0fffffff;
    d = ((d << shift) | (d >>> (28 - shift))) & 0x0fffffff;
    return permute((BigInt(c) << 28n) | BigInt(d), 56, PC2);
  });
}

function feistel(right: number, subkey: bigint): number {
  const expanded = permute(BigInt(right), 32, E) ^ subkey;
  let sOutput = 0;
  for (let box = 0; box < 8; box++) {
    const six = Number((expanded >> BigInt((7 - box) * 6)) & 0x3fn);
    const row = ((six & 0x20) >> 4) | (six & 1);
    const col = (six >> 1) & 0xf;
    sOutput = (sOutput << 4) | SBOX[box][row * 16 + col];
  }
  return Number(permute(BigInt(sOutput), 32, P));
}

export function desBlock(input: Uint8Array, key: Uint8Array, decrypt = false): Uint8Array {
  if (input.length !== 8) throw new Error('DES processes 8-byte blocks.');
  const subkeys = makeSubkeys(key);
  const raw = input.reduce((n, b) => (n << 8n) | BigInt(b), 0n);
  const state = permute(raw, 64, IP);
  let left = Number((state >> 32n) & 0xffffffffn);
  let right = Number(state & 0xffffffffn);
  const keys = decrypt ? [...subkeys].reverse() : subkeys;
  for (const subkey of keys) [left, right] = [right, (left ^ feistel(right, subkey)) >>> 0];
  const result = permute((BigInt(right) << 32n) | BigInt(left), 64, FP);
  return Uint8Array.from({ length: 8 }, (_, i) => Number((result >> BigInt((7 - i) * 8)) & 0xffn));
}

export function desCbc(input: Uint8Array, key: Uint8Array, iv: Uint8Array, decrypt = false): Uint8Array {
  if (iv.length !== 8) throw new Error('DES CBC needs an 8-byte initialization value.');
  if (key.length !== 8) throw new Error('DES needs exactly 8 key bytes.');
  if (decrypt && (input.length === 0 || input.length % 8 !== 0)) throw new Error('Encrypted DES data must be a non-empty multiple of 8 bytes.');
  const data = decrypt ? input : (() => {
    const pad = 8 - (input.length % 8);
    const padded = new Uint8Array(input.length + pad);
    padded.set(input); padded.fill(pad, input.length); return padded;
  })();
  const output = new Uint8Array(data.length);
  let previous = iv;
  for (let offset = 0; offset < data.length; offset += 8) {
    const block = data.slice(offset, offset + 8);
    const transformed = desBlock(decrypt ? block : Uint8Array.from(block, (b, i) => b ^ previous[i]), key, decrypt);
    output.set(decrypt ? Uint8Array.from(transformed, (b, i) => b ^ previous[i]) : transformed, offset);
    previous = decrypt ? block : transformed;
  }
  if (!decrypt) return output;
  const pad = output[output.length - 1];
  if (pad < 1 || pad > 8 || output.slice(-pad).some(b => b !== pad)) throw new Error('Wrong key or damaged data: padding check failed.');
  return output.slice(0, -pad);
}
