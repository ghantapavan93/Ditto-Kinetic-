import type { MetadataRoute } from 'next';

/**
 * Web app manifest.
 *
 * Ditto's site is installable, and this is a full-viewport, chrome-less,
 * single-surface experience — which is exactly the shape a manifest is for.
 * `fullscreen` rather than `standalone`: the stage assumes it owns the whole
 * viewport, and a status bar over the top of it costs a visible band of the
 * composition on every phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FIRST SCENE — same two people, six ways to meet',
    short_name: 'First Scene',
    description:
      'An unofficial Ditto interaction concept. The right person can still get the wrong first date.',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#08090C',
    theme_color: '#08090C',
    categories: ['lifestyle', 'social'],
  };
}
