
export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string; // base64 data URL
  status: 'loading' | 'success' | 'error';
  error?: string;
  createdAt: number;
}

export interface GenerationRequest {
  id: string;
  prompt: string;
}
