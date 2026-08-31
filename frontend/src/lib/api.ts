export function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  const authHeaders: Record<string, string> = { ...headers }
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`
  }
  return authHeaders
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders((options.headers as Record<string, string>) || {})
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(url, { ...options, headers })
}
