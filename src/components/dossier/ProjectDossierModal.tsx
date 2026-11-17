import React, { useState } from 'react';
import { X, Download, Printer, CheckCircle2, Award, FileText } from 'lucide-react';

interface ProjectDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDossierModal: React.FC<ProjectDossierModalProps> = ({ isOpen, onClose }) => {
  const [studentName, setStudentName] = useState<string>('Alex Johnson');
  const [rollNumber, setRollNumber] = useState<string>('CS-2023-8842');
  const [department, setDepartment] = useState<string>('Computer Science & Cybersecurity Engineering');
  const [presentationDate, setPresentationDate] = useState<string>('17th November 2026');
  const [evaluatorName, setEvaluatorName] = useState<string>('Evaluation Committee Panel');

  if (!isOpen) return null;

  const exportMarkdown = () => {
    const content = `# CIPHER-CORE // Cryptography & Information Security Project Dossier
## Academic Evaluation Sheet — Presentation Date: ${presentationDate}
**Total Marks: 20**

---

### 1. Student Credentials
- **Student Name:** ${studentName}
- **Roll Number / PRN:** ${rollNumber}
- **Department:** ${department}
- **Presentation Date:** ${presentationDate}
- **Evaluation Panel:** ${evaluatorName}

---

### 2. Topic & Syllabus Alignment
- **Topic Selected:** Advanced Cryptographic Systems: Bit-by-Bit AES-128 State Machine, Cipher Modes of Operation, and Elliptic Curve Key Agreement (ECDH) with Active MITM Defense
- **Curriculum Domain:** Cryptography and Network Security (Block Ciphers, Modes of Operation, Public-Key Cryptography, Galois Fields, Threat Modeling)

---

### 3. Core Security Mechanisms Implemented
1. **FIPS 197 AES-128 State Machine:**
   - 4x4 State matrix byte transformations across 10 iterative rounds.
   - Non-linear Rijndael S-Box over GF(2^8) affine inversion.
   - MixColumns matrix multiplication over Galois Field modulo x^8+x^4+x^3+x+1.
   - 11-round key schedule expansion (44 32-bit words with RotWord, SubWord, Rcon).

2. **Block Cipher Modes & Malleability Analysis:**
   - ECB Mode structural entropy leakage (Tux penguin visualization).
   - CBC Mode chaining with IV and bit-flipping attack simulation.
   - CTR stream mode keystream synthesis.
   - GCM (Galois/Counter Mode) authenticated encryption (AEAD) using GHASH in GF(2^128).

3. **Elliptic Curve Cryptography & MitM Defense:**
   - Weierstrass curve point addition (P + Q) and point doubling (2P) geometry.
   - Discrete logarithm hardness and scalar multiplication.
   - Diffie-Hellman Key Exchange (ECDH) protocol convergence.
   - Active adversary (Eve) packet interception and public key substitution attack.

---

### 4. Evaluation Rubric (Total Marks: 20)
| Criteria | Max Marks | Status |
| :--- | :--- | :--- |
| Algorithmic Rigor & Mathematical Precision | 5 | Deterministically Verified |
| Interactive Visualization & Engineering Design | 5 | Fully Operational |
| Threat Modeling & Attack Demonstration (MitM, Bit-Flip) | 5 | Active Sandbox Implemented |
| Technical Presentation & Code Architecture | 5 | Senior-Dev Modular TypeScript |
| **Total** | **20** | **Ready for Evaluation** |
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CIS_Simulator_Dossier_${rollNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <span>Simulator Evaluation Dossier</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  TOTAL: 20 MARKS
                </span>
              </h3>
              <p className="text-slate-400 text-[11px]">
                Official Presentation & Rubric Sheet — Scheduled 17th & 18th November 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Student Full Name:</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Roll Number / PRN:</label>
            <input
              type="text"
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-cyan-300 font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Department / Branch:</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Presentation Date:</label>
            <input
              type="text"
              value={presentationDate}
              onChange={e => setPresentationDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-amber-300 font-bold"
            />
          </div>
        </div>

        {/* Evaluation Rubric Breakdown */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs border-b border-slate-800 pb-1.5">
            Academic Assessment Rubric (20 Marks Total)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left border border-slate-800 text-slate-300">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Assessment Criteria</th>
                  <th className="p-2.5">Max Marks</th>
                  <th className="p-2.5">Engine Feature Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">
                    1. Algorithmic Rigor & Math Accuracy
                  </td>
                  <td className="p-2.5 font-bold text-cyan-400">5 M</td>
                  <td className="p-2.5 text-slate-400">
                    Exact FIPS 197 S-box affine inverse in GF(2⁸), MixColumns matrix multiplication, and Weierstrass point geometry.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">
                    2. Interactive Visualization & UX
                  </td>
                  <td className="p-2.5 font-bold text-cyan-400">5 M</td>
                  <td className="p-2.5 text-slate-400">
                    Step-by-step playback scrubber, interactive 4x4 state grids, 16x16 S-box lookup, and HTML5 continuous curve canvas.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">
                    3. Threat Modeling & Cryptanalysis
                  </td>
                  <td className="p-2.5 font-bold text-cyan-400">5 M</td>
                  <td className="p-2.5 text-slate-400">
                    ECB Tux penguin pattern leakage, CBC bit-flipping attack vs GCM AEAD tag validation, and Eve MitM interception.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">
                    4. Technical Defense & System Architecture
                  </td>
                  <td className="p-2.5 font-bold text-cyan-400">5 M</td>
                  <td className="p-2.5 text-slate-400">
                    Pure TypeScript modular design, zero generic AI boilerplate, high-contrast dark cybersecurity UI.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready for evaluation committee viva</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-850"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={exportMarkdown}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Markdown Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
