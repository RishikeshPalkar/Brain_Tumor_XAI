'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import PredictionCard from '@/components/PredictionCard';
import ScoreChart from '@/components/ScoreChart';
import GradCamViewer from '@/components/GradCamViewer';
import Disclaimer from '@/components/Disclaimer';
import { analyzeMriImage } from '@/lib/api';
import { AnalysisResult } from '@/types';
import { Brain, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (file: File, generateGradcam: boolean, alpha: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const origUrl = URL.createObjectURL(file);
      setOriginalImageSrc(origUrl);

      const res = await analyzeMriImage(file, generateGradcam, alpha);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during MRI scan analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOriginalImageSrc(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>EfficientNet-B4 Deep Learning & Grad-CAM Interpretability</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Brain Tumor Detection with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Explainable AI</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Upload a brain MRI scan to predict neoplastic tissue categories and visualize the salient anatomical regions influencing the convolutional neural network.
        </p>
      </section>

      {/* Mandatory Disclaimer */}
      <Disclaimer />

      {/* Supported Categories Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Supported Categories:</span>
        <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
          Glioma
        </span>
        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
          Meningioma
        </span>
        <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
          Pituitary
        </span>
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
          No Tumor (Healthy)
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-300">Analysis Error</h4>
            <p className="text-xs text-rose-200/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Interface (shown when no result or when requested) */}
      {!result ? (
        <div className="max-w-4xl mx-auto">
          <ImageUploader onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>
      ) : (
        /* Results Dashboard */
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Analysis Results Dashboard
            </h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Analyze Another Scan
            </button>
          </div>

          {/* Primary Prediction */}
          <PredictionCard
            predictedClass={result.predictedClass}
            confidence={result.confidence}
            modelVersion={result.modelVersion}
            processingTimeMs={result.processingTimeMs}
          />

          {/* Side by side: Scores and Explainability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScoreChart
              scores={result.classScores}
              predictedClass={result.predictedClass}
            />

            {originalImageSrc && (
              <GradCamViewer
                originalImageSrc={originalImageSrc}
                gradcamOverlaySrc={result.gradcamOverlayBase64}
                predictedClass={result.predictedClass}
                dimensions={result.imageDimensions}
              />
            )}
          </div>

          {/* Warnings if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-1">
              <span className="font-semibold">Pipeline Notices:</span>
              <ul className="list-disc list-inside">
                {result.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
