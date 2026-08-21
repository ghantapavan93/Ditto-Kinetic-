import type { Metadata } from 'next';
import { ProfileStage } from '@/components/profile/ProfileStage';

export const metadata: Metadata = {
  title: 'THE LIVING PROFILE — three questions, and the gaps left over',
  description:
    'Onboarding asks a lot of questions and shows you a finished person. This asks three and shows you what it still does not know.',
};

/**
 * The layer underneath every other surface.
 *
 * The stage argues that context decides the outcome. That argument only holds
 * if the reads on the two people are honest to begin with — a confident profile
 * built from a signup form would make the whole system confidently wrong. So
 * this is the same discipline applied one level down: few questions, visible
 * confidence, and the unknowns left on the page.
 */
export default function ProfilePage() {
  return (
    <main>
      <ProfileStage />
    </main>
  );
}
