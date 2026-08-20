'use client';

/* eslint-disable react-hooks/immutability -- 
 * React Compiler's immutability rule assumes a declarative tree. react-three-fiber
 * is the opposite by design: `useFrame` runs once per rendered frame and mutates
 * the live scene graph in place — camera position, geometry attributes, material
 * uniforms. Allocating new objects here instead would produce garbage every frame
 * at 60-120Hz, which is precisely what the imperative loop exists to avoid.
 * Scoped to files that own frame callbacks; the React tree elsewhere is unaffected.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENE_ORDER } from '@/data/pairs';
import { usePrototype } from '@/store/prototypeStore';
import { play } from '@/components/shared/sound';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import type { Scene } from '@/lib/types';

const STEP = 360 / SCENE_ORDER.length;
const FRICTION = 0.93;
const SNAP_LAMBDA = 0.18;

/**
 * The scene dial.
 *
 * Built in DOM rather than WebGL, deliberately. Pointer capture, focus, arrow
 * keys, screen-reader semantics and 44px touch targets all come free here and
 * would all have to be reimplemented badly inside the canvas. The brief's
 * instruction was to pick the version with the better interaction stability,
 * and for a control the entire experience depends on, that is this one.
 *
 * Behaviour: free rotation with inertia, then a spring settle onto the nearest
 * detent. A tick fires as each detent passes under the indicator, so the
 * control has a *rate* you can feel, not just a result.
 */
export function SceneDial({ scenes }: { scenes: Scene[] }) {
  const sceneId = usePrototype((s) => s.sceneId);
  const goToScene = usePrototype((s) => s.goToScene);
  const soundOn = usePrototype((s) => s.soundOn);
  const reduced = useReducedMotion();

  const ref = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);

  const state = useRef({
    angle: 0,
    velocity: 0,
    pointerAngle: 0,
    grabAngle: 0,
    dragging: false,
    lastDetent: 0,
    raf: 0,
  });

  const indexFromAngle = useCallback((a: number) => {
    const wrapped = ((-a / STEP) % SCENE_ORDER.length + SCENE_ORDER.length) % SCENE_ORDER.length;
    return Math.round(wrapped) % SCENE_ORDER.length;
  }, []);

  /** Keep the dial in sync when the scene changes from anywhere else. */
  useEffect(() => {
    if (state.current.dragging) return;
    const target = SCENE_ORDER.indexOf(sceneId as (typeof SCENE_ORDER)[number]);
    if (target < 0) return;
    // Choose the rotation direction that travels the shorter way round.
    const current = state.current.angle;
    const desired = -target * STEP;
    const delta = ((desired - current + 540) % 360) - 180;
    state.current.angle = current + delta;
    state.current.velocity = 0;
    setAngle(state.current.angle);
  }, [sceneId]);

  const tickIfCrossed = useCallback(() => {
    const detent = Math.round(state.current.angle / STEP);
    if (detent !== state.current.lastDetent) {
      state.current.lastDetent = detent;
      play('tick', soundOn);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(6);
    }
  }, [soundOn]);

  const loop = useCallback(() => {
    const s = state.current;

    if (!s.dragging) {
      s.velocity *= FRICTION;
      s.angle += s.velocity;

      // Once inertia has mostly died, spring onto the nearest detent.
      if (Math.abs(s.velocity) < 0.6) {
        const nearest = Math.round(s.angle / STEP) * STEP;
        const gap = nearest - s.angle;
        s.angle += gap * (reduced ? 1 : SNAP_LAMBDA);
        if (Math.abs(gap) < 0.05 && Math.abs(s.velocity) < 0.05) {
          s.angle = nearest;
          s.velocity = 0;
          setAngle(s.angle);
          s.raf = 0;
          const next = SCENE_ORDER[indexFromAngle(s.angle)];
          if (next !== usePrototype.getState().sceneId) goToScene(next, 'dial');
          return;
        }
      }
    }

    tickIfCrossed();
    setAngle(s.angle);

    // Commit the scene as soon as the detent is the closest one, so the copy
    // changes while the dial is still moving — the control has to feel like it
    // is driving the world, not reporting to it afterwards.
    const candidate = SCENE_ORDER[indexFromAngle(s.angle)];
    if (candidate !== usePrototype.getState().sceneId) goToScene(candidate, 'dial');

    s.raf = requestAnimationFrame(loop);
  }, [goToScene, indexFromAngle, reduced, tickIfCrossed]);

  const kick = useCallback(() => {
    if (!state.current.raf) state.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);

  const angleAt = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const a = angleAt(e.clientX, e.clientY);
    state.current.dragging = true;
    state.current.grabAngle = a - state.current.angle;
    state.current.velocity = 0;
    setDragging(true);
    kick();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!state.current.dragging) return;
    const a = angleAt(e.clientX, e.clientY);
    const next = a - state.current.grabAngle;
    // Unwrap so a drag across the -180/180 seam does not jump a full turn.
    const delta = ((next - state.current.angle + 540) % 360) - 180;
    state.current.angle += delta;
    state.current.velocity = delta;
  };

  const onPointerUp = () => {
    if (!state.current.dragging) return;
    state.current.dragging = false;
    setDragging(false);
    kick();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const index = SCENE_ORDER.indexOf(usePrototype.getState().sceneId as (typeof SCENE_ORDER)[number]);
    const next = SCENE_ORDER[(index + dir + SCENE_ORDER.length) % SCENE_ORDER.length];
    play('tick', soundOn);
    goToScene(next, 'keyboard');
  };

  const activeIndex = SCENE_ORDER.indexOf(sceneId as (typeof SCENE_ORDER)[number]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="First scene selector"
        data-cursor="change the night"
        aria-valuemin={1}
        aria-valuemax={SCENE_ORDER.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`${scenes[activeIndex]?.label ?? ''}, ${scenes[activeIndex]?.time ?? ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={`relative aspect-square w-[clamp(112px,17vw,168px)] cursor-grab touch-none select-none rounded-full
          ${dragging ? 'cursor-grabbing' : ''}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* body */}
        <div
          className="absolute inset-0 rounded-full border border-paper/15 transition-shadow duration-settle"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 22%, rgba(255,255,255,0.09) 48%, rgba(255,255,255,0.02) 72%, rgba(255,255,255,0.10))',
            boxShadow: dragging
              ? '0 0 0 1px rgba(255,255,255,0.16), 0 18px 50px -22px rgba(0,0,0,0.9)'
              : '0 14px 40px -26px rgba(0,0,0,0.9)',
          }}
        />

        {/* rotating detent ring */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: reduced && !dragging ? 'transform 120ms linear' : undefined,
          }}
        >
          {SCENE_ORDER.map((id, i) => (
            <div
              key={id}
              className="absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom"
              style={{ transform: `translate(-50%,-100%) rotate(${i * STEP}deg)` }}
            >
              <span
                className={`absolute left-1/2 top-[7px] h-2.5 w-[2px] -translate-x-1/2 rounded-full transition-colors duration-tick
                  ${i === activeIndex ? 'bg-acid' : 'bg-paper/30'}`}
              />
            </div>
          ))}
        </div>

        {/* fixed indicator */}
        <span className="absolute left-1/2 top-[-9px] h-3 w-[3px] -translate-x-1/2 rounded-full bg-paper" />

        {/* hub */}
        <div className="absolute inset-[30%] rounded-full border border-paper/10 bg-ink-soft/70 backdrop-blur-sm">
          <span className="absolute inset-0 grid place-items-center font-mono text-micro uppercase text-paper/45">
            {activeIndex + 1}/{SCENE_ORDER.length}
          </span>
        </div>
      </div>

      <p className="u-micro text-center">
        <span className="hidden sm:inline">drag the first scene</span>
        <span className="sm:hidden">swipe the dial</span>
        <span className="mx-2 text-paper/20">·</span>
        <span aria-hidden>← →</span>
      </p>
    </div>
  );
}
