type ImageSize = {
  width: number;
  height?: number;
  quality?: number;
};

const DEFAULT_QUALITY = 72;

export function getThumbnailUrl(imageUrl: string | undefined | null, size: ImageSize): string {
  if (!imageUrl) return '';

  const rawUrl = imageUrl.trim();
  if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

  try {
    const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL(rawUrl, baseUrl);
    const width = Math.max(1, Math.round(size.width));
    const height = size.height ? Math.max(1, Math.round(size.height)) : undefined;
    const quality = size.quality ?? DEFAULT_QUALITY;

    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', String(quality));
      url.searchParams.set('w', String(width));
      if (height) url.searchParams.set('h', String(height));
      return url.toString();
    }

    if (url.hostname.includes('res.cloudinary.com') && url.pathname.includes('/upload/')) {
      const transform = `f_auto,q_${quality},c_fill,w_${width}${height ? `,h_${height}` : ''}`;
      url.pathname = url.pathname.replace('/upload/', `/upload/${transform}/`);
      return url.toString();
    }

    if (url.hostname.includes('picsum.photos')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        parts.splice(-2, 2, String(width), String(height ?? width));
        url.pathname = `/${parts.join('/')}`;
      } else {
        url.pathname = `/${width}/${height ?? width}`;
      }
      return url.toString();
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}
