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
  const token = options.token !== undefined ? options.token : localStorage.getItem('ltv_admin_token');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
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
    const errorMsg = responseData?.message || responseData?.error || `Lỗi máy chủ (${response.status})`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData as T;
}
