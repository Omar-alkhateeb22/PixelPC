import { API_BASE_URL } from '../config/api.config';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

/**
 * Product imageUrl values are inconsistent at the source: older records hold a
 * full absolute URL, while the upload endpoint returns a relative path. Prefix
 * only when it's actually relative, so neither shape ends up mangled.
 */
export function buildImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  return ABSOLUTE_URL_PATTERN.test(imageUrl) ? imageUrl : `${API_BASE_URL}${imageUrl}`;
}
