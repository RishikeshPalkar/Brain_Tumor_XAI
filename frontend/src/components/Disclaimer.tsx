import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-amber-200/90 text-sm flex items-start gap-3 shadow-sm">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-semibold text-amber-300 text-sm">Educational and Research Disclaimer</h4>
        <p className="text-xs leading-relaxed text-amber-200/80">
          This system is strictly developed for educational, technical demonstration, and research purposes. It is <strong>NOT a certified medical diagnostic device</strong>.
          Model output scores represent internal classification activations rather than calibrated diagnostic likelihoods.
          Grad-CAM heatmaps illustrate receptive field salience in the neural network and <strong>do not prove pathological tumor boundaries</strong>.
        </p>
      </div>
    </div>
  );
}
