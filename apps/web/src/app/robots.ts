import type { MetadataRoute } from 'next';

/** Pages personnelles et invitations non indexées. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: ['/$', '/support', '/confidentialite', '/conditions'], disallow: ['/'] }] };
}
