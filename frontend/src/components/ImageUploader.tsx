'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  onAnalyze: (file: File, generateGradcam: boolean, alpha: number) => Promise<void>;
  isLoading: boolean;
}

const SAMPLE_MRIS = [
  { name: 'Sample Glioma', label: 'Glioma Scan', file: '/samples/sample_glioma.jpg' },
  { name: 'Sample Meningioma', label: 'Meningioma Scan', file: '/samples/sample_meningioma.jpg' },
  { name: 'Sample No Tumor', label: 'Healthy MRI Scan', file: '/samples/sample_notumor.jpg' },
  { name: 'Sample Pituitary', label: 'Pituitary Scan', file: '/samples/sample_pituitary.jpg' },
];

export default function ImageUploader({ onAnalyze, isLoading }: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateGradcam, setGenerateGradcam] = useState(true);
  const [alpha, setAlpha] = useState(0.45);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async (samplePath: string, sampleName: string) => {
    try {
      handleClear();
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], `${sampleName.toLowerCase().replace(/\s+/g, '_')}.jpg`, {
        type: 'image/jpeg',
      });
      validateAndSetFile(file);
    } catch (err) {
      setError('Unable to load sample scan.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || isLoading) return;
    await onAnalyze(selectedFile, generateGradcam, alpha);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" /> Upload Brain MRI Scan
        </h3>
        <span className="text-xs text-slate-400">Max size: 10 MB (JPEG, PNG, WebP)</span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-cyan-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Click to upload or drag & drop brain MRI scan here
          </p>
          <p className="text-xs text-slate-400 mt-1">Axial or sagittal MRI slices recommended</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 truncate max-w-xs">{selectedFile?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB • {selectedFile?.type}
                </p>
              </div>
            </div>

            <button
              onClick={handleClear}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls: Grad-CAM toggle & Alpha slider */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gradcam-toggle"
                checked={generateGradcam}
                onChange={(e) => setGenerateGradcam(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="gradcam-toggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                Generate Grad-CAM Explainability Heatmap
              </label>
            </div>

            {generateGradcam && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="shrink-0">Overlay Blend:</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono text-cyan-300 w-8 text-right font-medium">
                  {Math.round(alpha * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Sample MRIs */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Or select a verified sample MRI scan:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_MRIS.map((sample) => (
            <button
              key={sample.name}
              onClick={() => handleLoadSample(sample.file, sample.name)}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs text-left transition-colors truncate disabled:opacity-50"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
          selectedFile && !isLoading
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-[0.99]'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Analyzing Scan & Generating Grad-CAM...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Run Tumor Classification & Explainability
          </>
        )}
      </button>
    </div>
  );
}
