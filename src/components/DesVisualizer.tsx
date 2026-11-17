import React from 'react';
import { CipherWorkbench } from './CipherWorkbench';

export const DesVisualizer: React.FC = () => <div className="space-y-4">
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
    <h2 className="text-lg font-bold text-slate-800">DES message encryption</h2>
    <p className="mt-1 text-sm text-slate-700">Try encrypting and decrypting messages of any length. DES requires an 8-byte key. It is included for learning; it is too weak for protecting real information.</p>
  </div>
  <CipherWorkbench initialCipher="DES" />
</div>;
