import React from 'react';
import { Shield, Cpu, Layers, GitBranch, FileText, CheckCircle2, KeyRound } from 'lucide-react';
import { ModuleId } from '../../types/crypto';

interface HeaderProps {
  activeModule: ModuleId;
  onSelectModule: (mod: ModuleId) => void;
  onOpenDossier: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onSelectModule,
  onOpenDossier,
}) => {
  const navItems: { id: ModuleId; label: string; icon: React.ReactNode; tag: string }[] = [
    {
      id: 'aes',
      label: 'AES basics',
      icon: <Cpu className="w-4 h-4" />,
      tag: 'FIPS 197',
    },
    {
      id: 'des',
      label: 'DES (learn)',
      icon: <KeyRound className="w-4 h-4" />,
      tag: '8-byte key',
    },
    {
      id: 'modes',
      label: 'Protect messages',
      icon: <Layers className="w-4 h-4" />,
      tag: 'NIST SP 800-38',
    },
    {
      id: 'ecc',
      label: 'Share secret keys',
      icon: <GitBranch className="w-4 h-4" />,
      tag: 'Diffie–Hellman',
    },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-base tracking-wider text-slate-100">
                  CIPHER<span className="text-cyan-700">CORE</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-semibold">
                  v2.4 SEC-STATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Explore how messages are protected, one step at a time
              </p>
            </div>
          </div>

          {/* Module Switcher Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            {navItems.map(item => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Presentation Dossier & Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to explore</span>
            </div>

            <button
              onClick={onOpenDossier}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-950/30 transition-all shadow-sm"
              title="Open Project Presentation & Evaluation Dossier (20 Marks)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Project guide</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1 rounded border border-amber-500/30">
                20M
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-200 bg-slate-50 space-x-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelectModule(item.id)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono whitespace-nowrap ${
              activeModule === item.id
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
