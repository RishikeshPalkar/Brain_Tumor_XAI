export interface AnalysisResult {
  id: string;
  predictedClass: 'glioma' | 'meningioma' | 'notumor' | 'pituitary' | string;
  confidence: number;
  classScores: {
    glioma: number;
    meningioma: number;
    notumor: number;
    pituitary: number;
    [key: string]: number;
  };
  modelVersion: string;
  imageDimensions?: [number, number];
  gradcamAvailable: boolean;
  gradcamOverlayBase64?: string;
  processingTimeMs: number;
  timestamp: string;
  warnings?: string[];
  disclaimer: string;
}

export interface AnalysisHistoryItem {
  id: string;
  predictedClass: string;
  confidence: number;
  classScores: {
    glioma: number;
    meningioma: number;
    notumor: number;
    pituitary: number;
  };
  modelVersion: string;
  gradcamAvailable: boolean;
  processingTimeMs: number;
  createdAt: string;
}

export interface BackendHealth {
  service: string;
  status: string;
  timestamp: string;
  database: {
    status: string;
    error?: string;
  };
  aiService: {
    status: string;
    service?: string;
    error?: string;
  };
}
