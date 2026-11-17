import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AesVisualizer } from './components/aes/AesVisualizer';
import { ModesVisualizer } from './components/modes/ModesVisualizer';
import { EccVisualizer } from './components/ecc/EccVisualizer';
import { ProjectDossierModal } from './components/dossier/ProjectDossierModal';
import { DesVisualizer } from './components/DesVisualizer';
import { ModuleId } from './types/crypto';

export function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('aes');
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Header */}
      <Header
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenDossier={() => setIsDossierOpen(true)}
      />

      {/* Main Interactive Station Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeModule === 'aes' && <AesVisualizer />}
        {activeModule === 'des' && <DesVisualizer />}
        {activeModule === 'modes' && <ModesVisualizer />}
        {activeModule === 'ecc' && <EccVisualizer />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Presentation Dossier Modal */}
      <ProjectDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />
    </div>
  );
}

export default App;
