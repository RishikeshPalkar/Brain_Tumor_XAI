import { Brain, Layers, ShieldCheck, Database, Server, Cpu, CheckCircle } from 'lucide-react';
import Disclaimer from '@/components/Disclaimer';

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">About NeuroScan XAI</h1>
        <p className="text-sm text-slate-400 mt-1">
          Technical specifications, architecture details, and explainability limitations.
        </p>
      </div>

      <Disclaimer />

      {/* Target Architecture */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" /> System Architecture & Separation of Concerns
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The system strictly decouples the client interface, orchestration layer, and deep learning runtime:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-400 text-sm block">1. Next.js Frontend</span>
            <p className="text-slate-400">
              React 18 + TypeScript + Tailwind CSS. Provides image preview, client-side validation, score charts, and interactive side-by-side Grad-CAM visualizations.
            </p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-blue-400 text-sm block">2. Spring Boot 3 Backend</span>
            <p className="text-slate-400">
              Java 21 REST API. Enforces request validation, security headers, rate/size limits, coordinates with internal AI microservices via reactive WebClient, and manages Flyway migrations.
            </p>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 text-sm block">3. Python FastAPI AI Service</span>
            <p className="text-slate-400">
              High-performance inference microservice with pinned TensorFlow/Keras runtime. Serves the trained EfficientNet-B4 model and generates Grad-CAM heatmaps on request.
            </p>
          </div>
        </div>
      </section>

      {/* Explainable AI Details */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" /> How Grad-CAM Works & Scientific Limitations
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            <strong>Gradient-weighted Class Activation Mapping (Grad-CAM)</strong> computes the gradients of the predicted class score with respect to the feature activation maps of the final convolutional layer (<code>top_conv</code> in EfficientNet-B4).
          </p>
          <p>
            These gradients are pooled across spatial dimensions to yield importance weights for each feature map. A rectified linear activation (ReLU) is then applied to isolate features that have a positive influence on the target class.
          </p>
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200">Limitations to note:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Grad-CAM displays neural network focus, NOT biological tumor margins.</li>
              <li>A coarse 7×7 feature map is upsampled to the original image dimensions using bicubic interpolation.</li>
              <li>Saliency should never be mistaken for clinical confirmation of tumor presence or absence.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Model Specifications */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" /> Model Specifications
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Base Architecture</span>
            <span className="text-sm font-bold text-slate-200">EfficientNet-B4</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Input Dimensions</span>
            <span className="text-sm font-bold text-slate-200">224 × 224 × 3 RGB</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Parameters</span>
            <span className="text-sm font-bold text-slate-200">18.1 Million</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Artifact Format</span>
            <span className="text-sm font-bold text-slate-200">Keras 3 (.keras)</span>
          </div>
        </div>
      </section>

      {/* Security & Data Privacy */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Security & Privacy Posture
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>No Image Retention:</strong> Raw MRI scans and patient images are never written to MySQL or stored persistently on disk.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Ephemeral Memory Processing:</strong> Images are processed in memory and immediately discarded after Grad-CAM generation.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Least-Privilege Database Access:</strong> The application connects using a restricted user account with permissions limited to required tables.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Input Sanitization:</strong> Magic byte validation, decompression bomb guards, dimension caps, and strict size constraints prevent payload injection.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
