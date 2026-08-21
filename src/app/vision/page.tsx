import type { Metadata } from 'next';
import { VisionStage } from '@/components/vision/VisionStage';

export const metadata: Metadata = {
  title: 'THE FUTURE VISION — tonight to 2030, one camera',
  description:
    'Five stations flown through, not paginated: tonight, the campus, every kind of meeting, the city, and the quiet. A continuation of their own stated direction, made of the site\u2019s own parts.',
};

/**
 * The future, earned rather than rendered.
 *
 * Every station reuses an act that already exists and is separately asserted;
 * the direction is Ditto's founder's own stated trajectory, not an invention;
 * and the ending is the same ending every argument here has pointed at — the
 * interface getting out of the way.
 */
export default function VisionPage() {
  return (
    <main>
      <VisionStage />
    </main>
  );
}
