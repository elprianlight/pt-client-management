import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PT Client Management System',
    short_name: 'PT System',
    description: 'Platform manajemen Personal Trainer terpadu',
    start_url: '/',
    display: 'standalone',
    background_color: '#08090d',
    theme_color: '#08090d',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
