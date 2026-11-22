'use client';

interface ScoreChartProps {
  scores: {
    glioma: number;
    meningioma: number;
    notumor: number;
    pituitary: number;
    [key: string]: number;
  };
  predictedClass: string;
}

const CLASS_METADATA: Record<string, { label: string; desc: string; color: string }> = {
  glioma: {
    label: 'Glioma',
    desc: 'Primary brain tumor originating from glial cells',
    color: 'bg-rose-500',
  },
  meningioma: {
    label: 'Meningioma',
    desc: 'Tumor arising from the meninges surrounding brain/spinal cord',
    color: 'bg-amber-500',
  },
  notumor: {
    label: 'No Tumor',
    desc: 'No detectable neoplastic lesion within MRI scan slice',
    color: 'bg-emerald-500',
  },
  pituitary: {
    label: 'Pituitary',
    desc: 'Tumor developing in the pituitary gland at skull base',
    color: 'bg-purple-500',
  },
};

export default function ScoreChart({ scores, predictedClass }: ScoreChartProps) {
  const classes = ['glioma', 'meningioma', 'notumor', 'pituitary'];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100">Model Output Distribution</h3>
        <span className="text-xs text-slate-400">Softmax Score (0.0 - 1.0)</span>
      </div>

      <div className="space-y-3">
        {classes.map((clsKey) => {
          const score = scores[clsKey] ?? 0;
          const percentage = (score * 100).toFixed(1);
          const meta = CLASS_METADATA[clsKey] || {
            label: clsKey,
            desc: '',
            color: 'bg-cyan-500',
          };
          const isWinner = clsKey.toLowerCase() === predictedClass.toLowerCase();

          return (
            <div
              key={clsKey}
              className={`p-3 rounded-lg border transition-all ${
                isWinner
                  ? 'bg-slate-800/90 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{meta.label}</span>
                  {isWinner && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-semibold uppercase tracking-wider">
                      Predicted
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {percentage}% ({score.toFixed(4)})
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isWinner ? 'bg-cyan-400 shadow-md shadow-cyan-500/50' : meta.color
                  }`}
                  style={{ width: `${Math.max(score * 100, 1.5)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
