import { CheckCircle2, Clock, Cpu, Sparkles } from 'lucide-react';

interface PredictionCardProps {
  predictedClass: string;
  confidence: number;
  modelVersion: string;
  processingTimeMs: number;
}

const CLASS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  glioma: {
    label: 'Glioma',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  meningioma: {
    label: 'Meningioma',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  notumor: {
    label: 'No Tumor Detected',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  pituitary: {
    label: 'Pituitary Tumor',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
};

export default function PredictionCard({
  predictedClass,
  confidence,
  modelVersion,
  processingTimeMs,
}: PredictionCardProps) {
  const badge = CLASS_BADGES[predictedClass.toLowerCase()] || {
    label: predictedClass,
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Primary Prediction
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-500" /> {modelVersion}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {processingTimeMs.toFixed(0)} ms
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Classification Result</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight capitalize">
            {badge.label}
          </h2>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`px-4 py-2 rounded-xl border ${badge.bg} ${badge.border} ${badge.text} flex flex-col items-end`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Model Confidence</span>
            <span className="text-xl sm:text-2xl font-black font-mono">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
