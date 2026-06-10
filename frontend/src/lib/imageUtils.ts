/**
 * Format image URL to ensure it's absolute
 * Handles relative paths and null values
 */
export function formatImageUrl(imageUrl: string | null | undefined, fallback = '/images/no-image.svg'): string {
  const value = imageUrl?.trim();

  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    const apiOrigin = getApiBaseUrl().replace(/\/api\/?$/, '').replace(/\/$/, '');
    const path = value.startsWith('/')
      ? value
      : `/storage/${value.replace(/^storage\//, '')}`;

    return `${apiOrigin}${path}`;
  }
}

/**
 * Get environment-aware API base URL
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  // Server-side
  return process.env.API_URL || 'http://localhost:8000';
}
