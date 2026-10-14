'use client';

import { useEffect, useState } from 'react';
import { fetchAnalysisHistory, deleteAnalysisRecord } from '@/lib/api';
import { AnalysisHistoryItem } from '@/types';
import { History, Trash2, Clock, Cpu, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Disclaimer from '@/components/Disclaimer';

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalysisHistory();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis record?')) return;
    setDeletingId(id);
    try {
      await deleteAnalysisRecord(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" /> Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Persisted metadata records in MySQL database. Raw MRI scans and personal identifiers are never stored.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
        </button>
      </div>

      <Disclaimer />

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p className="text-sm">Fetching analysis records from database...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Past Analyses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Uploaded scan predictions will automatically record non-sensitive metadata here once executed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 font-mono font-medium">
                    {item.id.slice(0, 8)}...
                  </span>
                  <span className="text-lg font-bold text-white capitalize">
                    {item.predictedClass === 'notumor' ? 'No Tumor' : item.predictedClass}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold font-mono">
                    {(item.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors disabled:opacity-50"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Class scores distribution breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                {Object.entries(item.classScores).map(([cls, score]) => (
                  <div key={cls} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                    <span className="text-[10px] text-slate-400 block capitalize">{cls}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {(score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Model: {item.modelVersion}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-500" /> Grad-CAM: {item.gradcamAvailable ? 'Available' : 'N/A'}
                </span>
                <span>Latency: {item.processingTimeMs?.toFixed(0)} ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
