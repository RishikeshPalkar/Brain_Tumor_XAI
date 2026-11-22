'use client';

import { useState } from 'react';
import { Eye, Layers, ZoomIn } from 'lucide-react';

interface GradCamViewerProps {
  originalImageSrc: string;
  gradcamOverlaySrc?: string;
  predictedClass: string;
  dimensions?: [number, number];
}

export default function GradCamViewer({
  originalImageSrc,
  gradcamOverlaySrc,
  predictedClass,
  dimensions,
}: GradCamViewerProps) {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'overlay-only' | 'original-only'>('side-by-side');

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Explainable AI: Grad-CAM Visualization
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target class: <strong className="text-cyan-300 capitalize">{predictedClass}</strong>
            {dimensions && ` • Input resolution: ${dimensions[0]}×${dimensions[1]}px`}
          </p>
        </div>

        <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'side-by-side' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('overlay-only')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'overlay-only' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grad-CAM Overlay
          </button>
          <button
            onClick={() => setActiveTab('original-only')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'original-only' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original MRI
          </button>
        </div>
      </div>

      {/* Image displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(activeTab === 'side-by-side' || activeTab === 'original-only') && (
          <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              Original Brain MRI Scan
            </div>
            <div className="relative w-full aspect-square max-w-[360px] rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
              <img
                src={originalImageSrc}
                alt="Original MRI"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Unmodified input image</span>
          </div>
        )}

        {(activeTab === 'side-by-side' || activeTab === 'overlay-only') && (
          <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Grad-CAM Heatmap Overlay
            </div>
            <div className="relative w-full aspect-square max-w-[360px] rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
              {gradcamOverlaySrc ? (
                <img
                  src={gradcamOverlaySrc}
                  alt="Grad-CAM Heatmap Overlay"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-slate-500 p-4 text-center">
                  Grad-CAM overlay not available for this analysis.
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Top convolutional layer feature saliency</span>
          </div>
        )}
      </div>

      {/* Colormap Legend and Explanation */}
      <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-300">Feature Importance Scale:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Low influence (0.0)</span>
            <div className="w-32 h-3 rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 via-green-400 via-yellow-400 to-red-600 border border-slate-700" />
            <span className="text-rose-400 text-[11px] font-semibold">High influence (1.0)</span>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          <strong>Interpretation:</strong> Warmer red and yellow regions represent spatial features in the MRI slice that contributed most positively to the model choosing <em>{predictedClass}</em>. Cool blue regions had negligible impact. This highlights model focus, not histological tumor margins.
        </p>
      </div>
    </div>
  );
}
