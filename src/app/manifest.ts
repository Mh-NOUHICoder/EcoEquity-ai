import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EcoEquity AI',
    short_name: 'EcoEquity',
    description: 'AI-Driven Environmental Justice & Heat Risk Tactical Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#05080D',
    theme_color: '#10b981',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/ecoequity-ai.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/ecoequity-ai.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
