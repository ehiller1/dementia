/**
 * Stub functions for backend API calls
 * Used in frontend-only builds where backend endpoints are not available
 */

export async function stubFetch(url: string, options?: RequestInit): Promise<Response> {
  console.warn(`[API Stub] Backend API call disabled: ${options?.method || 'GET'} ${url}`);
  console.warn('[API Stub] This is a frontend-only build. Backend endpoints are not available.');
  
  // Return a rejected promise to prevent code from trying to use the response
  return Promise.reject(new Error(`Backend API disabled: ${url}`));
}

export function stubWebSocket(url: string): WebSocket {
  console.warn(`[WebSocket Stub] WebSocket connection disabled: ${url}`);
  console.warn('[WebSocket Stub] This is a frontend-only build. WebSocket connections are not available.');
  
  // Return a mock WebSocket that's immediately closed
  const mockWs = {
    readyState: WebSocket.CLOSED,
    send: () => {},
    close: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  } as unknown as WebSocket;
  
  return mockWs;
}

