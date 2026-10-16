/**
 * Centralized API Client Service
 */

const BASE_URL = '';

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    token?: string | null;
  } = {}
): Promise<T> {
  const method = options.method || 'GET';
  const token = options.token !== undefined 
    ? options.token 
    : (typeof window !== 'undefined' ? localStorage.getItem('ltv_admin_token') : null);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  };

  if (options.data !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (options.data !== undefined && method !== 'GET') {
    config.body = JSON.stringify(options.data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  let responseData: any = {};
  const text = await response.text();
  if (text) {
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/api/admin/login' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    let errorMsg = `Lỗi máy chủ (${response.status})`;
    if (typeof responseData === 'string' && responseData.trim()) {
      errorMsg = responseData.trim();
    } else if (responseData && typeof responseData === 'object') {
      if (typeof responseData.message === 'string' && responseData.message.trim()) {
        errorMsg = responseData.message.trim();
      } else if (typeof responseData.error === 'string' && responseData.error.trim()) {
        errorMsg = responseData.error.trim();
      } else if (responseData.error && typeof responseData.error.message === 'string' && responseData.error.message.trim()) {
        errorMsg = responseData.error.message.trim();
      } else if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const first = responseData.errors[0];
        errorMsg = typeof first === 'string' ? first : (first?.message || `Lỗi máy chủ (${response.status})`);
      }
    }

    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData as T;
}
