import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FeedbackInterpretation, interpretLocally } from '@/lib/feedbackSchema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Optional model-backed interpretation of post-date feedback.
 *
 * Design constraints, in priority order:
 *  1. The route may never be the reason the interface breaks. Every failure
 *     path — missing key, timeout, refusal, malformed JSON, schema violation —
 *     returns the deterministic local interpretation with HTTP 200.
 *  2. Only the sentence the user typed is sent. No names, no ages, no campus,
 *     no scene metrics, no identifiers beyond opaque ids the model never sees.
 *  3. The output is validated against the same Zod schema the local reader
 *     satisfies, so the client cannot tell them apart structurally.
 *
 * With no ANTHROPIC_API_KEY configured — the default — this route is a
 * deterministic function and the demo is fully offline.
 */

const RequestBody = z.object({
  text: z.string().min(1).max(600),
  pairId: z.string().max(64).optional(),
  sceneId: z.string().max(64).optional(),
});

const SYSTEM_PROMPT = `You read one sentence of feedback that someone wrote after a first date, and you extract what a matchmaking system should tentatively adjust.

Rules:
- You are reading a single data point. Never express certainty about a person.
- Distinguish the setting from the people. Most bad first dates are badly staged, not badly matched.
- Every hypothesis needs evidence quoted or paraphrased from the sentence itself.
- If the sentence carries little signal, say so in the hypothesis rather than inventing one.
- Keep every string under 120 characters, lowercase, plain, no marketing tone.

Respond with JSON only, matching exactly:
{"preserve":string[],"increase":string[],"decrease":string[],"inferredHypotheses":[{"hypothesis":string,"evidence":string,"confidence":"low"|"medium"|"high"}],"uncertainty":string[]}`;

export async function POST(request: Request) {
  let text = '';
  try {
    const parsed = RequestBody.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
    }
    text = parsed.data.text;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const fallback = () =>
    NextResponse.json({ ok: true, data: { ...interpretLocally(text), source: 'fallback' } });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        // Only the sentence crosses the boundary.
        messages: [{ role: 'user', content: text }],
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) return fallback();

    const payload = (await response.json()) as { content?: { type: string; text?: string }[] };
    const raw = payload.content?.find((block) => block.type === 'text')?.text ?? '';
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);

    const validated = FeedbackInterpretation.safeParse(JSON.parse(json));
    if (!validated.success) return fallback();

    return NextResponse.json({ ok: true, data: { ...validated.data, source: 'model' } });
  } catch {
    return fallback();
  }
}
