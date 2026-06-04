const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:5001/api').replace('/api', '');

export function getImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;          // Cloudinary or any absolute URL
  return `${SERVER_BASE}${url}`;                   // legacy /uploads/... path
}
