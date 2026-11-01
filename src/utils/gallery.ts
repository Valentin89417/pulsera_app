import { GalleryImage } from '../types/content';

// Набор фото, который видит пользователь: обычный или платный
export type GalleryScope = 'public' | 'premium';

export interface VisibleGallery {
  images: GalleryImage[];
  scope: GalleryScope;
}

// Разбор массива фото из content_data (терпим к строкам и битым данным)
export const parseGalleryImages = (raw: unknown): GalleryImage[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): GalleryImage | null => {
      if (typeof item === 'string') {
        const url = item.trim();
        return url ? { url } : null;
      }

      if (item && typeof item === 'object') {
        const obj = item as { url?: unknown; filename?: unknown };
        if (typeof obj.url === 'string' && obj.url.trim()) {
          return {
            url: obj.url.trim(),
            ...(typeof obj.filename === 'string' && obj.filename
              ? { filename: obj.filename }
              : {}),
          };
        }
      }

      return null;
    })
    .filter((item): item is GalleryImage => item !== null);
};

// Что видит пользователь: с доступом — платный набор (если есть), иначе обычный
export const getVisibleGallery = (
  contentData: Record<string, unknown> | null | undefined,
  hasPremiumAccess: boolean
): VisibleGallery => {
  if (hasPremiumAccess) {
    const premiumImages = parseGalleryImages(contentData?.premium_images);
    if (premiumImages.length > 0) {
      return { images: premiumImages, scope: 'premium' };
    }
  }

  return { images: parseGalleryImages(contentData?.images), scope: 'public' };
};

// Приведение фото к виду для сохранения в content_data
export const toStoredGallery = (images: GalleryImage[]): GalleryImage[] =>
  images.map((image) => ({
    url: image.url,
    ...(image.filename ? { filename: image.filename } : {}),
  }));
