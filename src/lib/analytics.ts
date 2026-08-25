/**
 * Event model, shaped to drop into PostHog.
 *
 * Ditto's site loads PostHog, so this deliberately matches its client contract
 * — `capture(event, properties)` with snake_case event names — rather than
 * inventing a parallel one. If a `posthog` client is present on the page these
 * events flow straight into it with no adapter; if it is not, they stay local
 * and nothing leaves the page.
 *
 * No `posthog-js` dependency is added. A prototype should not ship a tracker,
 * and the integration surface here is one optional global rather than a
 * package — which is also the smallest possible diff for anyone wiring it into
 * a real app.
 *
 * The event names *are* the funnel: read them in order and you can reconstruct
 * what the experience is supposed to make someone do. They are also exposed on
 * `window.__firstScene` so the funnel can be read from the console during a
 * demo without opening a dashboard.
 */

export type EventName =
  | 'prototype_loaded'
  | 'prototype_started'
  | 'scene_changed'
  | 'scene_selected'
  | 'why_opened'
  | 'decision_view_opened'
  | 'hear_me_out_opened'
  | 'make_real_clicked'
  | 'handoff_completed'
  | 'venue_broken'
  | 'week_condition_changed'
  | 'conditions_reset'
  | 'tldr_opened'
  | 'time_shifted'
  | 'pass_captured'
  | 'first_fifteen_scrubbed'
  | 'drop_page_viewed'
  | 'drop_opened_early'
  | 'drop_handoff_clicked'
  | 'after_page_viewed'
  | 'after_feedback_submitted'
  | 'next_wednesday_viewed'
  | 'next_wednesday_counterfactual_opened'
  | 'fragment_read'
  | 'pair_swapped'
  | 'feedback_started'
  | 'feedback_submitted'
  | 'memory_update_viewed'
  | 'held_back_viewed'
  | 'double_date_viewed'
  | 'app_shell_viewed'
  | 'matchmaker_viewed'
  | 'matchmaker_flow_replayed'
  | 'matchmaker_question_answered'
  | 'matchmaker_xray_opened'
  | 'matchmaker_bridged'
  | 'reel_viewed'
  | 'film_viewed'
  | 'film_played'
  | 'film_finished'
  | 'next_viewed'
  | 'network_viewed'
  | 'zoom_viewed'
  | 'gravity_viewed'
  | 'weather_viewed'
  | 'attention_viewed'
  | 'index_viewed'
  | 'autonomy_viewed'
  | 'end_answered'
  | 'moments_viewed'
  | 'vision_viewed'
  | 'world_viewed'
  | 'mutual_scene_viewed'
  | 'start_viewed'
  | 'start_lane_taken'
  | 'thread_viewed'
  | 'thread_opened'
  | 'world_priced'
  | 'possibility_viewed'
  | 'possibility_opened'
  | 'possibility_locked'
  | 'possibility_handoff'
  | 'compiler_run'
  | 'compiler_quieted'
  | 'ending_viewed'
  | 'ending_message_shown'
  | 'odds_viewed'
  | 'odds_pulled'
  | 'odds_guarantee_attempted'
  | 'held_back_expanded'
  | 'profile_viewed'
  | 'profile_answered'
  | 'webgl_unavailable';

export type TrackedEvent = {
  name: EventName;
  at: number;
  props?: Record<string, unknown>;
};

const buffer: TrackedEvent[] = [];

/** Events that describe a session, not an action — fired at most once. */
const ONCE: ReadonlySet<EventName> = new Set<EventName>(['prototype_loaded', 'prototype_started']);

/** PostHog's client surface, as much of it as this file needs. */
type PostHogLike = { capture: (event: string, properties?: Record<string, unknown>) => void };

function client(): PostHogLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { posthog?: PostHogLike }).posthog;
}

export function track(name: EventName, props?: Record<string, unknown>) {
  // React's development double-invoked effects would otherwise report two
  // loads per session and quietly corrupt the funnel.
  if (ONCE.has(name) && buffer.some((e) => e.name === name)) return;

  const event: TrackedEvent = { name, at: Math.round(performance.now()), props };
  buffer.push(event);

  if (typeof window !== 'undefined') {
    (window as unknown as { __firstScene?: { events: TrackedEvent[] } }).__firstScene = {
      events: buffer,
    };
  }

  // Forward to PostHog when the host page provides it. Wrapped because an
  // analytics failure must never be able to break an interaction.
  try {
    client()?.capture(name, props);
  } catch {
    /* analytics is never load-bearing */
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[first-scene] ${name}`, props ?? '');
  }
}

export function events(): readonly TrackedEvent[] {
  return buffer;
}
