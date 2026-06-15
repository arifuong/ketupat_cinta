/**
 * Format image URL for both next/image and plain <img>.
 * Rules:
 * - If absolute http/https => return as-is
 * - If starts with /storage/ => return as-is
 * - If value is like products/xxx.jpg => /storage/products/xxx.jpg
 * - If null/empty => placeholder
 */
export function formatImageUrl(imageUrl: string | null | undefined, fallback = '/images/no-image.svg'): string {
  const value = imageUrl?.trim();

  if (!value) return fallback;

  // Already absolute URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Frontend assets
  if (value.startsWith('/images/')) {
    return value;
  }

  const baseUrl = getAssetBaseUrl();

  // Already public storage path
  if (value.startsWith('/storage/')) {
    return `${baseUrl}${value}`;
  }

  // If stored value is like products/xxx.jpg
  if (value.startsWith('products/')) {
    return `${baseUrl}/storage/${value}`;
  }

  // If stored value is like storage/products/xxx.jpg
  if (value.startsWith('storage/')) {
    return `${baseUrl}/${value}`;
  }

  // Fallback: if backend somehow returns a leading slash path
  if (value.startsWith('/')) {
    return `${baseUrl}${value}`;
  }

  // Generic fallback: treat as relative storage path
  return `${baseUrl}/storage/${value}`;
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

/**
 * Get base URL for backend assets (stripping /api if present)
 */
export function getAssetBaseUrl(): string {
  let apiUrl = getApiBaseUrl().trim();
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }
  if (apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.slice(0, -4);
  }
  return apiUrl;
}
