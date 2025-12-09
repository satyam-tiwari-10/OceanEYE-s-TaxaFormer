/**
 * API Configuration
 * 
 * Centralized configuration for backend API endpoints.
 * Switch between local, Docker, and production environments.
 */

export const API_ENDPOINTS = {
  // Docker backend (default for local development)
  docker: 'http://localhost:8000',
  
  // Local Python backend (if running main_new.py directly)
  local: 'http://localhost:8000',
  
  // Production (update with your deployed backend URL)
  production: 'https://your-backend.com',
  
  // Kaggle ngrok (if using ngrok tunnel)
  ngrok: '', // Set this when you get ngrok URL
} as const;

// Current environment - change this to switch backends
const CURRENT_ENV: keyof typeof API_ENDPOINTS = 'docker';

// Export the active API URL
export const API_URL = API_ENDPOINTS[CURRENT_ENV];

// API endpoints
export const API = {
  // Base URL
  baseUrl: API_URL,
  
  // Endpoints
  analyze: `${API_URL}/analyse`,
  health: `${API_URL}/health`,
  root: `${API_URL}/`,
} as const;

// Helper function to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(API.health, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// Helper function to upload and analyze file
export async function analyzeFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(API.analyze, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Export environment info for debugging
export const ENV_INFO = {
  current: CURRENT_ENV,
  apiUrl: API_URL,
  endpoints: API,
} as const;
