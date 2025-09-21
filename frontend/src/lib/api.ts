import axios from 'axios';

// Use the global axios instance which has auth interceptors configured
const api = axios;

// Types
export interface GeneratedImage {
  filename: string;
  url: string;
  style: string;
  description: string;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  url: string;
}

export interface GenerateResponse {
  file_id: string;
  generated_images: GeneratedImage[];
  credits?: number;
}

export interface Generation {
  generation_id: string;
  original_filename: string;
  created_at: string;
  generated_count: number;
  thumbnail_url: string | null;
  status: string;
}

export interface GenerationDetails {
  generation_id: string;
  original_filename: string;
  created_at: string;
  generated_images: GeneratedImage[];
}

// API Functions
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  console.log('Uploading image:', file.name, file.size, file.type);
  const formData = new FormData();
  formData.append('file', file);

  console.log('Making API call to /upload...');
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('Upload response:', response.data);
  return response.data;
};

export const generateImages = async (fileId: string): Promise<GenerateResponse> => {
  const response = await api.post<GenerateResponse>('/generate', null, {
    params: { file_id: fileId },
  });

  // Transform URLs to be absolute using configured base URL
  // Prefer VITE_API_BASE_URL, then axios.defaults.baseURL; otherwise leave as-is
  const configuredBase = (import.meta as any).env?.VITE_API_BASE_URL || axios.defaults.baseURL || '';
  const API_BASE_URL = (configuredBase || '').replace(/\/$/, '');
  const toAbsoluteUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : (API_BASE_URL ? `${API_BASE_URL}${u}` : u));
  const transformedResponse = {
    ...response.data,
    generated_images: response.data.generated_images.map(img => ({
      ...img,
      url: toAbsoluteUrl(img.url)
    }))
  };

  return transformedResponse;
};

// Combined function for full workflow
export const uploadAndGenerateImages = async (file: File): Promise<{ images: GeneratedImage[], credits?: number }> => {
  const uploadResult = await uploadImage(file);
  const generateResult = await generateImages(uploadResult.file_id);
  return {
    images: generateResult.generated_images,
    credits: generateResult.credits
  };
};

// Download helper
export const downloadImage = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Download failed. Please try again.');
  }
};

// Timeline/History API functions
export const getUserGenerations = async (): Promise<Generation[]> => {
  const response = await api.get<{ generations: Generation[] }>('/generations');

  // Transform URLs to be absolute
  const configuredBase = (import.meta as any).env?.VITE_API_BASE_URL || axios.defaults.baseURL || '';
  const API_BASE_URL = (configuredBase || '').replace(/\/$/, '');
  const toAbsoluteUrl = (u: string | null) => {
    if (!u) return null;
    return /^https?:\/\//i.test(u) ? u : (API_BASE_URL ? `${API_BASE_URL}${u}` : u);
  };

  return response.data.generations.map(gen => ({
    ...gen,
    thumbnail_url: toAbsoluteUrl(gen.thumbnail_url)
  }));
};

export const getGenerationDetails = async (generationId: string): Promise<GenerationDetails> => {
  const response = await api.get<GenerationDetails>(`/generation/${generationId}`);

  // Transform URLs to be absolute
  const configuredBase = (import.meta as any).env?.VITE_API_BASE_URL || axios.defaults.baseURL || '';
  const API_BASE_URL = (configuredBase || '').replace(/\/$/, '');
  const toAbsoluteUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : (API_BASE_URL ? `${API_BASE_URL}${u}` : u));

  return {
    ...response.data,
    generated_images: response.data.generated_images.map(img => ({
      ...img,
      url: toAbsoluteUrl(img.url)
    }))
  };
};
