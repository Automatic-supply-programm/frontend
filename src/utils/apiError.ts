export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      const msg = (data as { message?: string }).message;
      if (msg) return msg;
    }
  }
  return fallback;
}
