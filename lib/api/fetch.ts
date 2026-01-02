/**
 * API fetch utility that includes authentication token
 */

interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  })

  // Add authorization header if authentication is required
  if (requireAuth) {
    const token = localStorage.getItem('nexuschess_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  return response
}
