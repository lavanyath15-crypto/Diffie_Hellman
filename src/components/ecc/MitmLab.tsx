import React, { useState } from 'react';
import {
  DEFAULT_CURVE,
  scalarMultiply,
  isOnCurve,
} from '../../core/ecc/curveMath';
import { ShieldCheck, ShieldAlert, Users, Radio, Lock, Unlock, ArrowRight } from 'lucide-react';

export const MitmLab: React.FC = () => {
  // Alice & Bob private keys
  const [alicePriv, setAlicePriv] = useState<number>(7);
  const [bobPriv, setBobPriv] = useState<number>(11);

  // Eve (Adversary) active injection toggle & private keys
  const [isMitmActive, setIsMitmActive] = useState<boolean>(false);
  const [evePrivAlice, setEvePrivAlice] = useState<number>(5);
  const [evePrivBob, setEvePrivBob] = useState<number>(13);

  const curve = DEFAULT_CURVE;
  const G = curve.G;

  // Alice computes A = a * G
  const alicePub = scalarMultiply(alicePriv, G, curve).result;
  // Bob computes B = b * G
  const bobPub = scalarMultiply(bobPriv, G, curve).result;

  // Eve computes fake public keys
  const evePubForAlice = scalarMultiply(evePrivAlice, G, curve).result; // sent to Alice pretending to be Bob
  const evePubForBob = scalarMultiply(evePrivBob, G, curve).result; // sent to Bob pretending to be Alice

  // Derived Shared Secrets
  let aliceSecretPoint = { x: 0, y: 0 };
  let bobSecretPoint = { x: 0, y: 0 };
  let eveSecretWithAlice = { x: 0, y: 0 };
  let eveSecretWithBob = { x: 0, y: 0 };

  if (!isMitmActive) {
    // Normal Secure ECDH:
    // Alice computes K = a * B
    aliceSecretPoint = scalarMultiply(alicePriv, bobPub, curve).result;
    // Bob computes K = b * A
    bobSecretPoint = scalarMultiply(bobPriv, alicePub, curve).result;
  } else {
    // Eve Man-in-the-Middle Attack:
    // Alice receives Eve's fake Bob key and computes K_AE = a * E_A
    aliceSecretPoint = scalarMultiply(alicePriv, evePubForAlice, curve).result;
    // Bob receives Eve's fake Alice key and computes K_BE = b * E_B
    bobSecretPoint = scalarMultiply(bobPriv, evePubForBob, curve).result;

    // Eve computes both secrets!
    eveSecretWithAlice = scalarMultiply(evePrivAlice, alicePub, curve).result;
    eveSecretWithBob = scalarMultiply(evePrivBob, bobPub, curve).result;
  }

  const isSharedSecretIdentical =
    !isMitmActive &&
    aliceSecretPoint.x === bobSecretPoint.x &&
    aliceSecretPoint.y === bobSecretPoint.y;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>ECDH Protocol & Active Man-in-the-Middle (MitM) Lab</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Diffie-Hellman Key Exchange over Elliptic Curves with active adversary packet interception
          </p>
        </div>

        {/* MITM Attack Activation Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMitmActive(!isMitmActive)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              isMitmActive
                ? 'bg-rose-500 text-slate-950 ring-2 ring-rose-400'
                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-850'
            }`}
          >
            {isMitmActive ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>ADVERSARY EVE ACTIVE (MITM INJECTED)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>INJECT EVE MITM INTERCEPTION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Protocol Network Topology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Alice Node */}
        <div className="bg-slate-900/80 border border-cyan-500/40 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Alice (Client Node)</span>
            </span>
            <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800/40">
              INITIATOR
            </span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400">Private Scalar (a):</label>
            <input
              type="number"
              min={2}
              max={25}
              value={alicePriv}
              onChange={e => setAlicePriv(parseInt(e.target.value) || 2)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-cyan-300 font-bold text-xs mt-1"
            />
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500">PUBLIC KEY A = a · G:</p>
            <p className="text-cyan-300 font-bold">
              ({alicePub.x}, {alicePub.y})
            </p>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500">COMPUTED SHARED SECRET:</p>
            <p
              className={`font-bold text-sm ${
                isMitmActive ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              K_Alice = ({aliceSecretPoint.x}, {aliceSecretPoint.y})
            </p>
          </div>
        </div>

        {/* Center: Insecure Public Channel (Or Eve Interceptor) */}
        <div
          className={`rounded-xl p-4 space-y-3 font-mono text-xs border flex flex-col justify-between ${
            isMitmActive
              ? 'bg-rose-950/30 border-rose-500/50 shadow-lg'
              : 'bg-slate-900/40 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span
              className={`font-bold flex items-center space-x-1.5 ${
                isMitmActive ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {isMitmActive ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Adversary Eve (Man-in-the-Middle)</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-slate-500" />
                  <span>Public Insecure Channel</span>
                </>
              )}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                isMitmActive
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-950 text-slate-500'
              }`}
            >
              {isMitmActive ? 'INTERCEPTING & SPOOFING' : 'PASSIVE WIRETAP'}
            </span>
          </div>

          {isMitmActive ? (
            <div className="space-y-3">
              <p className="text-[11px] text-rose-300">
                Eve intercepts public keys in transit and substitutes forged parameters:
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-950 p-2 rounded border border-rose-900/50">
                  <span className="text-slate-500">Eve's Secret with Alice:</span>
                  <p className="text-rose-400 font-bold mt-0.5">
                    ({eveSecretWithAlice.x}, {eveSecretWithAlice.y})
                  </p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-rose-900/50">
                  <span className="text-slate-500">Eve's Secret with Bob:</span>
                  <p className="text-rose-400 font-bold mt-0.5">
                    ({eveSecretWithBob.x}, {eveSecretWithBob.y})
                  </p>
                </div>
              </div>

              <div className="bg-rose-950/60 p-2 rounded border border-rose-800/80 text-[11px] text-rose-200">
                <strong>Exploit Result:</strong> Eve decrypts Alice's messages using K_Alice, modifies content, and re-encrypts for Bob using K_Bob. Total confidentiality collapse!
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
                <span>Alice: A ({alicePub.x}, {alicePub.y})</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>Bob: B ({bobPub.x}, {bobPub.y})</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto">
                Public keys are exchanged openly. An eavesdropper observing A and B cannot compute the shared secret without solving the Elliptic Curve Discrete Logarithm Problem (ECDLP).
              </p>
            </div>
          )}

          <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-2">
            Base Point G = ({G.x}, {G.y}) over F_{curve.p}
          </div>
        </div>

        {/* Bob Node */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Bob (Server Node)</span>
            </span>
            <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 border border-emerald-800/40">
              RESPONDER
            </span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400">Private Scalar (b):</label>
            <input
              type="number"
              min={2}
              max={25}
              value={bobPriv}
              onChange={e => setBobPriv(parseInt(e.target.value) || 2)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-emerald-300 font-bold text-xs mt-1"
            />
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500">PUBLIC KEY B = b · G:</p>
            <p className="text-emerald-300 font-bold">
              ({bobPub.x}, {bobPub.y})
            </p>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500">COMPUTED SHARED SECRET:</p>
            <p
              className={`font-bold text-sm ${
                isMitmActive ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              K_Bob = ({bobSecretPoint.x}, {bobSecretPoint.y})
            </p>
          </div>
        </div>
      </div>

      {/* Security Proof Summary Banner */}
      <div
        className={`p-4 rounded-xl border text-xs font-mono flex items-start space-x-3 ${
          isSharedSecretIdentical
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
        }`}
      >
        {isSharedSecretIdentical ? (
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <p className="font-bold text-sm">
            {isSharedSecretIdentical
              ? 'Diffie-Hellman Shared Secret Successfully Established'
              : 'CRITICAL WARNING: Man-in-the-Middle Compromise In Effect'}
          </p>
          <p className="leading-relaxed">
            {isSharedSecretIdentical
              ? `Both Alice and Bob converged to the identical point (${aliceSecretPoint.x}, ${aliceSecretPoint.y}) because K = a · (b · G) = b · (a · G) = (ab) · G. Even if an attacker records public keys A and B, calculating the scalar secret requires solving the discrete logarithm, which is computationally intractable for 256-bit curves (e.g. secp256k1 / Curve25519).`
              : `Alice computed K_Alice=(${aliceSecretPoint.x}, ${aliceSecretPoint.y}) while Bob computed K_Bob=(${bobSecretPoint.x}, ${bobSecretPoint.y}). Because raw Diffie-Hellman provides no entity authentication, Eve successfully impersonated both parties! Defense: In modern TLS 1.3, public keys are signed using ECDSA or RSA signatures backed by a trusted Certificate Authority (PKI).`}
          </p>
        </div>
      </div>
    </div>
  );
};
