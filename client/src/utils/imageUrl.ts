const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:4000/api').replace('/api', '');

export function getImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE}${url}`;
}

/** Extract the first usable image URL from either string[] (new backend) or ClothingImage[] (old). */
export function getFirstImage(images: (string | { url: string; isMain?: boolean })[] | undefined): string {
  if (!images || images.length === 0) return '';
  const first = images[0];
  return typeof first === 'string' ? getImageUrl(first) : getImageUrl(first.url);
}

export function getMainImage(images: (string | { url: string; isMain?: boolean })[] | undefined): string {
  if (!images || images.length === 0) return '';
  const main = images.find((img) => typeof img !== 'string' && img.isMain) ?? images[0];
  return typeof main === 'string' ? getImageUrl(main) : getImageUrl(main.url);
}
