import type { Metadata } from 'next';
import { ZoomStage } from '@/components/zoom/ZoomStage';

export const metadata: Metadata = {
  title: 'ONE CAMERA — from ninety-six people to one of them',
  description:
    'Three scales in one scene. Scroll from a campus of 96 down to the fragments one person carries, without a page transition.',
};

/**
 * The journey between the two ends of this project.
 *
 * The stage and the constellation were two pages, which made the relationship
 * between them a claim rather than something visible. This is one camera moving
 * through real distance between them, and the levels are nested rather than
 * cross-faded — the two cards sit on the thread between two specific dots.
 */
export default function ZoomPage() {
  return (
    <main>
      <ZoomStage />
    </main>
  );
}
