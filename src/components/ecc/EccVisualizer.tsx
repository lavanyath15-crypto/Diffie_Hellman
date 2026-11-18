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
  const [activeVisualStep, setActiveVisualStep] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [error, setError] = useState('');

  const calculate = (): boolean => {
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
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Check the numbers and try again.'); return false; }
  };

  const field = (label: string, hint: string, value: string, change: (next: string) => void, privateValue = false) => <label className="block text-sm font-semibold text-slate-700">{label}
    <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>
    <input type={privateValue ? 'password' : 'text'} autoComplete={privateValue ? 'new-password' : 'off'} inputMode="numeric" value={value} onChange={e => { change(e.target.value); setExchange(null); setError(''); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-slate-800" placeholder={privateValue ? 'Enter private number (hidden)' : 'Enter a whole number'} aria-label={privateValue ? `${label}, hidden private value` : label} />
  </label>;

  const wizardTitles = ['Public settings', 'Private numbers', 'Create public values', 'Exchange public values', 'Compare shared secrets'];
  const advanceWizard = () => {
    setError('');
    if (wizardStep === 0) {
      if (!/^\d+$/.test(prime) || !/^\d+$/.test(generator)) { setError('Enter a whole-number prime and generator to continue.'); return; }
      const p = BigInt(prime), g = BigInt(generator);
      if (p.toString(2).length > 2048) { setError('For this learning tool, use a prime with at most 2,048 bits.'); return; }
      if (!isProbablePrime(p)) { setError('The modulus must be a prime number.'); return; }
      if (g <= 1n || g >= p) { setError('The generator must be greater than 1 and less than the prime.'); return; }
    }
    if (wizardStep === 1 && !calculate()) return;
    setWizardStep(step => Math.min(wizardTitles.length - 1, step + 1));
  };

  if (wizardOpen) return <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wide text-sky-700">Guided Diffie–Hellman simulation</p><h1 className="mt-1 text-xl font-bold text-slate-900">Step {wizardStep + 1} of {wizardTitles.length}: {wizardTitles[wizardStep]}</h1></div>
      <button onClick={() => { setWizardOpen(false); setError(''); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Exit simulation</button>
    </div>
    <div className="mt-5 flex gap-1" aria-label={`Step ${wizardStep + 1} of ${wizardTitles.length}`}>{wizardTitles.map((title, index) => <div key={title} className={`h-2 flex-1 rounded-full ${index <= wizardStep ? 'bg-sky-600' : 'bg-slate-200'}`} />)}</div>
    <p className="mt-4 text-sm text-slate-600">{wizardStep === 0 ? 'Alice and Bob first agree on two values that are safe to share openly.' : wizardStep === 1 ? 'Each person chooses a private number. The input is masked and stays out of the displayed public-value formulas.' : wizardStep === 2 ? 'Each person uses the public settings and their own private number to calculate a public value.' : wizardStep === 3 ? 'They send only their public values across the channel. An observer can see these values.' : 'Each person combines the other person’s public value with their own private number. Check that both calculations agree.'}</p>
    <div className="mt-6 min-h-56 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
      {wizardStep === 0 && <div className="grid gap-4 sm:grid-cols-2">{field('Public prime (p)', 'Shared openly by both people.', prime, setPrime)}{field('Public generator (g)', 'Shared openly; both calculations start here.', generator, setGenerator)}</div>}
      {wizardStep === 1 && <div className="grid gap-4 sm:grid-cols-2">{field('Alice’s private number (a)', 'Secret value. Only Alice should know it.', alicePrivate, setAlicePrivate, true)}{field('Bob’s private number (b)', 'Secret value. Only Bob should know it.', bobPrivate, setBobPrivate, true)}</div>}
      {wizardStep === 2 && exchange && <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-sky-200 bg-white p-5"><h2 className="font-bold text-slate-900">Alice creates her public value</h2><p className="mt-3 font-mono text-lg text-sky-800">A = gᵃ mod p = {exchange.publicAlice.toString()}</p><p className="mt-2 text-sm text-slate-600">Her private number is used in the calculation, but is not included in the value she sends.</p></div><div className="rounded-xl border border-emerald-200 bg-white p-5"><h2 className="font-bold text-slate-900">Bob creates his public value</h2><p className="mt-3 font-mono text-lg text-emerald-800">B = gᵇ mod p = {exchange.publicBob.toString()}</p><p className="mt-2 text-sm text-slate-600">Bob keeps his private number secret and shares only this result.</p></div></div>}
      {wizardStep === 3 && exchange && <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl border border-sky-200 bg-white p-5 text-center"><Users className="mx-auto h-7 w-7 text-sky-700"/><h2 className="mt-2 font-bold">Alice</h2><p className="mt-2 break-all font-mono text-sky-800">Sends A = {exchange.publicAlice.toString()}</p><p className="text-xs text-slate-500">Private number remains hidden</p></div><div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center"><p className="text-xs font-bold uppercase text-amber-900">Public channel</p><p className="my-2 flex items-center justify-center gap-2 text-sm"><span>A</span><ArrowRight className="h-4 w-4"/><span>Bob</span></p><p className="my-2 flex items-center justify-center gap-2 text-sm"><span>B</span><ArrowRight className="h-4 w-4"/><span>Alice</span></p><p className="text-xs text-amber-900">An observer can see A and B.</p></div><div className="rounded-xl border border-emerald-200 bg-white p-5 text-center"><Users className="mx-auto h-7 w-7 text-emerald-700"/><h2 className="mt-2 font-bold">Bob</h2><p className="mt-2 break-all font-mono text-emerald-800">Sends B = {exchange.publicBob.toString()}</p><p className="text-xs text-slate-500">Private number remains hidden</p></div></div>}
      {wizardStep === 4 && exchange && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-sky-200 bg-white p-5"><h2 className="font-bold">Alice calculates</h2><p className="mt-3 break-all font-mono text-sky-800">Bᵃ mod p = {exchange.secretAlice.toString()}</p></div><div className="rounded-xl border border-emerald-200 bg-white p-5"><h2 className="font-bold">Bob calculates</h2><p className="mt-3 break-all font-mono text-emerald-800">Aᵇ mod p = {exchange.secretBob.toString()}</p></div></div><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">{exchange.secretAlice === exchange.secretBob ? 'Success: both people derived the same shared secret.' : 'The results do not match. Review the values and try again.'}</div><p className="text-sm text-slate-600">In real software, this shared value is passed through a key-derivation function and used with authenticated encryption. Basic Diffie–Hellman alone does not authenticate the other person.</p></div>}
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <div className="mt-5 flex justify-between gap-3"><button onClick={() => { setError(''); setWizardStep(step => Math.max(0, step - 1)); }} disabled={wizardStep === 0} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Back</button>{wizardStep < wizardTitles.length - 1 ? <button onClick={advanceWizard} className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800">Next</button> : <button onClick={() => setWizardOpen(false)} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Finish simulation</button>}</div>
  </section>;

  return <div className="space-y-5">
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-800">First: the key exchange idea</p>
      <h1 className="mt-1 text-xl font-bold text-slate-900">Diffie–Hellman: agree on a secret in public</h1>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-700">Two people share public numbers, but each keeps a private number secret. They combine the other person’s public value with their own private value. Both sides arrive at the same shared secret without sending that secret across the network.</p>
      <button onClick={() => { setWizardStep(0); setWizardOpen(true); setError(''); }} className="mt-4 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800">Start guided simulation</button>
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
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="font-bold text-slate-900">Watch the exchange happen</h4><p className="text-sm text-slate-600">Select a step to follow the values from setup through the shared secret.</p></div>
          <div className="flex gap-2">
            <button onClick={() => setActiveVisualStep(s => Math.max(0, s - 1))} disabled={activeVisualStep === 0} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">Previous</button>
            <button onClick={() => setActiveVisualStep(s => Math.min(3, s + 1))} disabled={activeVisualStep === 3} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">Next step</button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {['Agree on public settings', 'Create public values', 'Exchange public values', 'Calculate shared secret'].map((title, index) => <button key={title} onClick={() => setActiveVisualStep(index)} aria-current={activeVisualStep === index ? 'step' : undefined} className={`rounded-lg border p-3 text-left text-sm font-semibold ${activeVisualStep === index ? 'border-sky-500 bg-white text-sky-900 ring-2 ring-sky-200' : 'border-sky-200 bg-sky-50 text-slate-600'}`}><span className="mb-1 block text-xs">STEP {index + 1}</span>{title}</button>)}
        </div>
        <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-sky-200 bg-white p-4"><p className="font-bold text-slate-900">Alice</p><p className="mt-2 text-sm text-slate-600">{activeVisualStep === 0 ? 'Receives the public settings p and g.' : activeVisualStep === 1 ? 'Uses her hidden private number to create her public value.' : activeVisualStep === 2 ? 'Sends her public value A to Bob.' : 'Combines Bob’s public value with her hidden private number.'}</p>{activeVisualStep >= 1 && <p className="mt-2 break-all font-mono text-sm text-sky-800">{activeVisualStep === 3 ? `Shared secret: ${exchange.secretAlice}` : `Public value A: ${exchange.publicAlice}`}</p>}</div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center"><span className="text-xs font-bold uppercase text-amber-900">{activeVisualStep === 0 ? 'Public settings' : activeVisualStep === 1 ? 'Private numbers stay local' : activeVisualStep === 2 ? 'Public channel' : 'Same result'}</span>{activeVisualStep === 2 ? <div className="space-y-1 text-sm font-mono text-amber-950"><p>A <ArrowRight className="inline h-4 w-4" /> Bob</p><p>B <ArrowRight className="inline h-4 w-4" /> Alice</p></div> : activeVisualStep === 3 ? <ShieldCheck className="h-6 w-6 text-emerald-700" /> : <span className="text-sm text-amber-950">{activeVisualStep === 0 ? `p = ${prime}, g = ${generator}` : 'Each private number is only used on its owner’s device.'}</span>}</div>
          <div className="rounded-lg border border-emerald-200 bg-white p-4"><p className="font-bold text-slate-900">Bob</p><p className="mt-2 text-sm text-slate-600">{activeVisualStep === 0 ? 'Receives the same public settings p and g.' : activeVisualStep === 1 ? 'Uses his hidden private number to create his public value.' : activeVisualStep === 2 ? 'Sends his public value B to Alice.' : 'Combines Alice’s public value with his hidden private number.'}</p>{activeVisualStep >= 1 && <p className="mt-2 break-all font-mono text-sm text-emerald-800">{activeVisualStep === 3 ? `Shared secret: ${exchange.secretBob}` : `Public value B: ${exchange.publicBob}`}</p>}</div>
        </div>
        <p className="text-sm text-slate-700">{activeVisualStep === 0 ? 'Both participants start with the same public prime and generator.' : activeVisualStep === 1 ? 'Each participant calculates a public value. The private numbers are hidden and are never sent.' : activeVisualStep === 2 ? 'The public values can be observed in transit. The private numbers remain with Alice and Bob.' : `Both calculations produce ${exchange.secretAlice === exchange.secretBob ? 'the same' : 'different'} result. This shared result can then be passed through a key-derivation function to create encryption keys.`}</p>
      </div>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Threat and defense</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">How an attacker can interfere—and how real systems stop it</h2>
        <p className="mt-1 text-sm text-slate-600">The simulator above shows an honest exchange. Basic Diffie–Hellman hides the shared secret from a passive listener, but it does not identify who sent each public value.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <h3 className="font-bold text-rose-950">Attack: man in the middle</h3>
          <ol className="mt-3 space-y-2 text-sm text-rose-950">
            <li className="rounded-md border border-rose-200 bg-white p-3"><strong>1.</strong> Alice sends her public value to Bob. Eve intercepts it.</li>
            <li className="rounded-md border border-rose-200 bg-white p-3"><strong>2.</strong> Eve sends her own public value to Bob, pretending it came from Alice.</li>
            <li className="rounded-md border border-rose-200 bg-white p-3"><strong>3.</strong> Bob replies. Eve intercepts Bob’s value and sends a different Eve value to Alice.</li>
            <li className="rounded-md border border-rose-200 bg-white p-3"><strong>4.</strong> Eve now shares one secret with Alice and another with Bob. She can relay, read, or alter messages between them.</li>
          </ol>
          <p className="mt-3 text-xs text-rose-900">Alice and Bob may each calculate a matching secret with Eve and still think they are talking directly to each other.</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-bold text-emerald-950">Protection: authenticate and verify</h3>
          <ol className="mt-3 space-y-2 text-sm text-emerald-950">
            <li className="rounded-md border border-emerald-200 bg-white p-3"><strong>1. Authenticate public values.</strong> Use a trusted certificate and digital signature to prove who owns the public key.</li>
            <li className="rounded-md border border-emerald-200 bg-white p-3"><strong>2. Verify before accepting.</strong> Check the certificate, signature, and exchange details. Reject changed or untrusted values.</li>
            <li className="rounded-md border border-emerald-200 bg-white p-3"><strong>3. Protect later messages.</strong> Derive session keys from the shared secret, then use authenticated encryption so tampering is detected.</li>
          </ol>
          <p className="mt-3 text-xs text-emerald-900">Modern secure protocols combine key exchange with authentication; Diffie–Hellman by itself is only the key agreement step.</p>
        </div>
      </div>
    </section>
  </div>;
};
