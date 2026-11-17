import React, { useState } from 'react';
import { LockKeyhole, UnlockKeyhole, Copy, Check, Info } from 'lucide-react';
import { desCbc } from '../core/des/desCore';

type Cipher = 'AES' | 'DES';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const toHex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error('Encrypted data is not valid hexadecimal text.');
  return Uint8Array.from(value.match(/.{2}/g) ?? [], byte => parseInt(byte, 16));
};

async function deriveAesKey(passphrase: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function parseDesKey(value: string): Uint8Array {
  if (value.startsWith('hex:')) return fromHex(value.slice(4));
  return encoder.encode(value);
}

export const CipherWorkbench: React.FC<{ initialCipher?: Cipher }> = ({ initialCipher = 'AES' }) => {
  const [cipher, setCipher] = useState<Cipher>(initialCipher);
  const [action, setAction] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [message, setMessage] = useState('');
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setError(''); setResult(''); setHasResult(false); setBusy(true);
    try {
      if (!secret) throw new Error('Enter a secret key or passphrase first.');
      if (cipher === 'AES') {
        if (action === 'encrypt') {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const key = await deriveAesKey(secret, salt);
          const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message));
          setResult(`AESGCM1.${toHex(salt)}.${toHex(iv)}.${toHex(new Uint8Array(encrypted))}`);
        } else {
          const [version, saltHex, ivHex, dataHex, ...extra] = message.trim().split('.');
          if (version !== 'AESGCM1' || !saltHex || !ivHex || !dataHex || extra.length) throw new Error('Paste the complete AESGCM1 encrypted result into the message box.');
          const salt = fromHex(saltHex), iv = fromHex(ivHex), data = fromHex(dataHex);
          if (salt.length !== 16 || iv.length !== 12 || data.length < 16) throw new Error('Encrypted result is incomplete or has been changed.');
          const key = await deriveAesKey(secret, salt);
          const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
          setResult(decoder.decode(plain));
        }
      } else {
        const key = parseDesKey(secret);
        if (key.length !== 8) throw new Error(`DES needs exactly 8 key bytes; this key has ${key.length}. Use 8 text characters or hex: followed by 16 hex digits.`);
        if (action === 'encrypt') {
          const iv = crypto.getRandomValues(new Uint8Array(8));
          const encrypted = desCbc(encoder.encode(message), key, iv);
          setResult(`DESCBC1.${toHex(iv)}.${toHex(encrypted)}`);
        } else {
          const [version, ivHex, dataHex, ...extra] = message.trim().split('.');
          if (version !== 'DESCBC1' || !ivHex || !dataHex || extra.length) throw new Error('Paste the complete DESCBC1 encrypted result into the message box.');
          const iv = fromHex(ivHex), data = fromHex(dataHex);
          if (iv.length !== 8) throw new Error('Encrypted result has an invalid initialization value.');
          setResult(decoder.decode(desCbc(data, key, iv, true)));
        }
      }
      setHasResult(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete the operation. Check your inputs and try again.');
    } finally { setBusy(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  };

  const useResultForDecryption = () => {
    setMessage(result);
    setAction('decrypt');
    setHasResult(false);
    setError('');
  };

  return <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-base font-bold text-slate-800">Encrypt or decrypt a message</h3>
        <p className="text-sm text-slate-600 mt-1">Enter your own message and secret. Your values update the result each time you run it.</p></div>
      <div className="flex gap-2">
        {(['AES', 'DES'] as Cipher[]).map(name => <button key={name} onClick={() => { setCipher(name); setResult(''); setHasResult(false); setError(''); }} className={`px-3 py-2 rounded-lg text-sm font-semibold ${cipher === name ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-slate-50 text-slate-600'}`}>{name}</button>)}
      </div>
    </div>
    <div className="flex gap-2" role="group" aria-label="Choose encryption or decryption">
      {(['encrypt', 'decrypt'] as const).map(mode => <button key={mode} onClick={() => { setAction(mode); setResult(''); setHasResult(false); setError(''); }} className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize ${action === mode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600'}`}>{mode}</button>)}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">{action === 'encrypt' ? 'Message to encrypt' : 'Encrypted result to decrypt'}
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800" placeholder={action === 'encrypt' ? 'Type or paste any message' : `Paste an encrypted ${cipher} result here`} />
      </label>
      <label className="block text-sm font-semibold text-slate-700">{cipher === 'AES' ? 'Secret passphrase' : 'DES key (8 bytes)'}
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800" placeholder={cipher === 'AES' ? 'Enter any passphrase' : '8 text characters or hex:0123456789abcdef'} />
        <span className="mt-1 block text-xs font-normal text-slate-500">{cipher === 'AES' ? 'AES-GCM uses a fresh random salt and initialization value; the encrypted result contains both.' : 'DES only accepts an 8-byte key and is obsolete. Use AES for real secrets.'}</span>
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-60">
        {action === 'encrypt' ? <LockKeyhole className="w-4 h-4" /> : <UnlockKeyhole className="w-4 h-4" />}{busy ? 'Working…' : `${action === 'encrypt' ? 'Encrypt' : 'Decrypt'} with ${cipher}`}
      </button>
      {cipher === 'DES' && <span className="inline-flex items-center gap-1 text-xs text-amber-800"><Info className="h-4 w-4" />Learning use only; DES is not secure for real data.</span>}
    </div>
    {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {hasResult && <label className="block text-sm font-semibold text-slate-700">{action === 'encrypt' ? 'Encrypted result (save this to decrypt later)' : 'Decrypted message'}
      <div className="mt-1 flex flex-wrap items-start gap-2"><textarea readOnly value={result} rows={4} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-800" />
        <div className="flex gap-2">
          {action === 'encrypt' && <button onClick={useResultForDecryption} className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">Use result to decrypt</button>}
          <button onClick={copy} title="Copy result" className="self-start rounded-lg bg-white p-3 text-slate-700" aria-label="Copy result">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
        </div></div>
    </label>}
  </section>;
};
