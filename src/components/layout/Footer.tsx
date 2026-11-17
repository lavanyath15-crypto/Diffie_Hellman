import React from 'react';
import { ShieldCheck, Terminal, BookOpen, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-12 py-8 text-xs font-mono text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-bold tracking-wider">
                CIPHER-CORE // Cryptography & Information Security Simulator
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              An interactive guide to everyday ideas behind information security
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] text-cyan-300">
              AES message encryption
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] text-emerald-300">
              Ways to protect messages
            </span>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] text-amber-300">
              Sharing a secret key
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Examples run in your browser. The sample messages stay on this device.</span>
          </div>
          <div>
            Presentation Dates: <strong className="text-slate-300">17th & 18th November 2026</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
