import type { Metadata } from 'next';
import { MatchmakerStage } from '@/components/matchmaker/MatchmakerStage';

export const metadata: Metadata = {
  title: 'MATCHMAKER — who should meet, decided inspectably',
  description:
    'A reconstruction of the observed Ditto join flow, and a speculative engine underneath it: beliefs with sources and expiry, one adaptive question worth asking, two-directional fit, travel windows, held-back reasons, counterfactuals, and a Wednesday that is allowed to abstain. Everything synthetic.',
};

/**
 * The question upstream of FIRST SCENE. The stage handles WHO; the six-room
 * dial it bridges into handles UNDER WHAT CONDITIONS; /after handles what
 * should be learned. One system, three questions.
 */
export default function MatchmakerPage() {
  return (
    <main>
      <MatchmakerStage />
    </main>
  );
}
