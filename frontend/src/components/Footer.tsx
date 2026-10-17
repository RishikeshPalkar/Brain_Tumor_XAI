import Link from 'next/link';
import { ShieldCheck, HeartHandshake, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            NeuroScan XAI — Educational Medical AI Research
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/" className="hover:text-slate-200 transition-colors">Detection</Link>
            <Link href="/history" className="hover:text-slate-200 transition-colors">History</Link>
            <Link href="/about" className="hover:text-slate-200 transition-colors">Architecture & Model</Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-slate-500">
            Built with Next.js, Spring Boot 3, FastAPI, Custom CNN (TensorFlow/Keras), and MySQL 8.4 LTS.
          </p>
          <p className="text-[11px] text-slate-500">
            Not for diagnostic use. All patient-identifying data must be de-identified prior to analysis.
          </p>
        </div>
      </div>
    </footer>
  );
}
