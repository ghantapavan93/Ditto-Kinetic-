/**
 * Local event model.
 *
 * There is no production analytics service wired up here and no data leaves the
 * page. The point of shipping this anyway is that the event names *are* the
 * product's funnel — anyone reading them can reconstruct what the experience is
 * supposed to make someone do, in order.
 *
 * Events are also exposed on `window.__firstScene` so the funnel can be read
 * from the console during a demo without opening a dashboard.
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
  | 'pair_swapped'
  | 'feedback_started'
  | 'feedback_submitted'
  | 'memory_update_viewed'
  | 'webgl_unavailable';

export type TrackedEvent = {
  name: EventName;
  at: number;
  props?: Record<string, unknown>;
};

const buffer: TrackedEvent[] = [];

/** Events that describe a session, not an action — fired at most once. */
const ONCE: ReadonlySet<EventName> = new Set<EventName>(['prototype_loaded', 'prototype_started']);

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

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(`[first-scene] ${name}`, props ?? '');
  }
}

export function events(): readonly TrackedEvent[] {
  return buffer;
}
