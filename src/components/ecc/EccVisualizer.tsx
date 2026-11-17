import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Users } from 'lucide-react';

const modPow = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
  let result = 1n;
  let b = ((base % modulus) + modulus) % modulus;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
};

function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  const small = [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
  for (const p of small) { if (n === p) return true; if (n % p === 0n) return false; }
  let d = n - 1n, s = 0;
  while ((d & 1n) === 0n) { d >>= 1n; s++; }
  for (const a of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n,41n,43n,47n,53n]) {
    if (a >= n - 1n) continue;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let r = 1; r < s; r++) { x = (x * x) % n; if (x === n - 1n) { witness = false; break; } }
    if (witness) return false;
  }
  return true;
}

interface Exchange { publicAlice: bigint; publicBob: bigint; secretAlice: bigint; secretBob: bigint; }

export const EccVisualizer: React.FC = () => {
  const [prime, setPrime] = useState('');
  const [generator, setGenerator] = useState('');
  const [alicePrivate, setAlicePrivate] = useState('');
  const [bobPrivate, setBobPrivate] = useState('');
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError(''); setExchange(null);
    try {
      if (![prime, generator, alicePrivate, bobPrivate].every(v => /^\d+$/.test(v))) throw new Error('Fill in all four boxes with whole numbers.');
      const p = BigInt(prime), g = BigInt(generator), a = BigInt(alicePrivate), b = BigInt(bobPrivate);
      if (p.toString(2).length > 2048) throw new Error('For this learning tool, use a prime with at most 2,048 bits.');
      if (!isProbablePrime(p)) throw new Error('The modulus must be a prime number.');
      if (g <= 1n || g >= p) throw new Error('The generator must be greater than 1 and less than the prime.');
      if (a <= 0n || a >= p - 1n || b <= 0n || b >= p - 1n) throw new Error('Each private number must be between 1 and the prime minus 2.');
      const publicAlice = modPow(g, a, p), publicBob = modPow(g, b, p);
      setExchange({ publicAlice, publicBob, secretAlice: modPow(publicBob, a, p), secretBob: modPow(publicAlice, b, p) });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Check the numbers and try again.'); }
  };

  const field = (label: string, hint: string, value: string, change: (next: string) => void, privateValue = false) => <label className="block text-sm font-semibold text-slate-700">{label}
    <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>
    <input type={privateValue ? 'password' : 'text'} autoComplete={privateValue ? 'new-password' : 'off'} inputMode="numeric" value={value} onChange={e => change(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-slate-800" placeholder={privateValue ? 'Enter private number (hidden)' : 'Enter a whole number'} aria-label={privateValue ? `${label}, hidden private value` : label} />
  </label>;

  return <div className="space-y-5">
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-800">First: the key exchange idea</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Diffie–Hellman: agree on a secret in public</h1>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-700">Two people share public numbers, but each keeps a private number secret. They combine the other person’s public value with their own private value. Both sides arrive at the same shared secret without sending that secret across the network.</p>
      <ol className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
        <li className="rounded-lg border border-sky-200 bg-white p-3"><strong>1. Agree:</strong> enter the same prime and generator.</li>
        <li className="rounded-lg border border-sky-200 bg-white p-3"><strong>2. Keep private:</strong> each person enters their own secret number.</li>
        <li className="rounded-lg border border-sky-200 bg-white p-3"><strong>3. Share:</strong> exchange the public values shown below.</li>
        <li className="rounded-lg border border-sky-200 bg-white p-3"><strong>4. Compare:</strong> both calculate the same shared secret.</li>
      </ol>
      <h2 className="mt-5 text-base font-bold text-slate-900">What the numbers mean</h2>
      <div className="mt-2 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-sky-200 bg-white p-3"><strong className="text-slate-900">Prime (p)</strong><p className="mt-1 text-sm text-slate-600">A public prime number. All calculations wrap around at this number, keeping results within a known range.</p></div>
        <div className="rounded-lg border border-sky-200 bg-white p-3"><strong className="text-slate-900">Generator (g)</strong><p className="mt-1 text-sm text-slate-600">A public starting number used by both people to create their public values.</p></div>
        <div className="rounded-lg border border-sky-200 bg-white p-3"><strong className="text-slate-900">Private numbers (a and b)</strong><p className="mt-1 text-sm text-slate-600">Secret values known only to Alice and Bob. They must never be sent to the other person.</p></div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-sky-200 bg-white p-3"><strong className="text-slate-900">Why do both sides match?</strong><p className="mt-1 font-mono text-sm text-sky-900">(gᵇ)ᵃ mod p = gᵃᵇ mod p = (gᵃ)ᵇ mod p</p><p className="mt-1 text-sm text-slate-600">Both sides effectively raise the same public generator to the product of the two private numbers. The private numbers themselves are not exchanged.</p></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><strong className="text-amber-950">Important security limit</strong><p className="mt-1 text-sm text-amber-900">Basic Diffie–Hellman does not prove who sent a public value. An attacker could replace values in transit. Real protocols authenticate the exchange, for example with digital signatures and certificates.</p></div>
      </div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3"><Users className="mt-1 h-5 w-5 text-sky-700" /><div>
        <h2 className="text-lg font-bold text-slate-800">Full key exchange simulator</h2>
        <p className="mt-1 text-sm text-slate-600">Enter the four values to calculate both public keys, both shared-secret calculations, and whether the results match.</p>
      </div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {field('Public prime (p)', 'Shared openly. Every calculation uses the remainder after division by p.', prime, setPrime)}
        {field('Public generator (g)', 'Shared openly. Both people start their calculations with this number.', generator, setGenerator)}
        {field('Alice’s private number (a)', 'Hidden while typing. Only Alice should know this value.', alicePrivate, setAlicePrivate, true)}
        {field('Bob’s private number (b)', 'Hidden while typing. Only Bob should know this value.', bobPrivate, setBobPrivate, true)}
      </div>
      <button onClick={calculate} className="mt-5 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800">Calculate shared secret</button>
      <p className="mt-3 text-xs text-slate-500">The prime is checked with a probabilistic primality test. This classroom calculator is for learning; production key exchange needs vetted libraries and authenticated public keys.</p>
      {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </section>
    {exchange && <section className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-800">Your results</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">Alice shares this public value</p><p className="mt-1 break-all font-mono text-sm text-sky-800">gᵃ mod p = {exchange.publicAlice.toString()}</p></div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">Bob shares this public value</p><p className="mt-1 break-all font-mono text-sm text-sky-800">gᵇ mod p = {exchange.publicBob.toString()}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><ShieldCheck className="h-5 w-5" /><span className="font-bold">{exchange.secretAlice === exchange.secretBob ? 'Both people calculated the same shared secret.' : 'The shared values do not match. Check the inputs.'}</span></div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-700">Alice calculates the shared secret</p><p className="mt-1 break-all font-mono text-sm">Bᵃ mod p = {exchange.secretAlice.toString()}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500">Alice uses her hidden private number with Bob’s public value <ArrowRight className="h-3 w-3" /></p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-700">Bob calculates the shared secret</p><p className="mt-1 break-all font-mono text-sm">Aᵇ mod p = {exchange.secretBob.toString()}</p><p className="mt-1 text-xs text-slate-500">Bob uses his hidden private number with Alice’s public value</p></div>
      </div>
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">An observer can see the prime, generator, and both public values. The observer does not see Alice’s or Bob’s private number. With properly chosen large parameters, working backward from a public value to its private number is computationally difficult.</p>
    </section>}
  </div>;
};
