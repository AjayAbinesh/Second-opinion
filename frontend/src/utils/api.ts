/**
 * Fetch wrapper with timeout and better error handling for production deployments.
 * Handles Render cold starts (30-50s) gracefully with user-friendly messages.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(
        'The server is waking up from sleep. This may take up to 60 seconds on the free tier. Please wait and try again.'
      );
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error(
        'Cannot reach the server. It may be waking up from sleep. Please wait a moment and try again.'
      );
    }
    throw err;
  }
}
