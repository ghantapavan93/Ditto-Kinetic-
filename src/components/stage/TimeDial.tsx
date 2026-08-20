'use client';

import { usePrototype, useTimeShift } from '@/store/prototypeStore';
import { play } from '@/components/shared/sound';

/**
 * Time, as a dimmer rather than a scheduler.
 *
 * Three detents on a short travel: earlier, as planned, later. It does not
 * pretend to negotiate calendars — the plan already has a time. What it does is
 * let you see the same two people in the same room under a different hour, and
 * watch the light do the arguing.
 *
 * Golden hour and 9:15 are not the same evening even when everything else is
 * identical, and that is a real product observation, not a lighting demo: it is
 * the reason `scheduleFit` and `attendanceLikelihood` are separate fields.
 */

const STOPS: { value: -1 | 0 | 1; label: string; hint: string }[] = [
  { value: -1, label: 'earlier', hint: 'more daylight left' },
  { value: 0, label: 'as planned', hint: '' },
  { value: 1, label: 'later', hint: 'the night has set in' },
];

/** Shifts a `h:mm AM/PM` label by roughly two hours in either direction. */
export function shiftClock(time: string, shift: -1 | 0 | 1): string {
  if (shift === 0) return time;
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return time;

  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === 'PM') hour += 12;

  const shifted = Math.min(23, Math.max(0, hour + shift * 2));
  const suffix = shifted >= 12 ? 'PM' : 'AM';
  const display = shifted % 12 === 0 ? 12 : shifted % 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function TimeDial() {
  const shift = useTimeShift();
  const setTimeShift = usePrototype((s) => s.setTimeShift);
  const soundOn = usePrototype((s) => s.soundOn);

  return (
    <div
      role="radiogroup"
      aria-label="Time of evening"
      data-cursor="change the hour"
      className="flex items-center gap-0.5 rounded-full border border-paper/12 bg-ink-soft/50 p-0.5 backdrop-blur-sm"
    >
      {STOPS.map((stop) => {
        const active = shift === stop.value;
        return (
          <button
            key={stop.value}
            role="radio"
            aria-checked={active}
            title={stop.hint}
            onClick={() => {
              setTimeShift(stop.value);
              play('tick', soundOn);
            }}
            className={`min-h-[36px] rounded-full px-3 py-1.5 text-[0.72rem] transition-colors
              ${
                active
                  ? 'bg-paper/90 font-editorial font-medium text-ink'
                  : 'font-editorial text-paper/45 hover:text-paper/80'
              }`}
          >
            {stop.label}
          </button>
        );
      })}
    </div>
  );
}
