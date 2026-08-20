'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { SPRING } from '@/lib/motion';

/**
 * Modal surface, on Radix.
 *
 * The hand-rolled versions of these worked, but only for the interactions I
 * happened to test. Radix brings the ones I hadn't: focus is trapped and
 * restored to the trigger on close, the rest of the page is `aria-hidden`,
 * background scroll is locked, escape and outside-click are handled once
 * instead of per-component, and the title is wired to `aria-labelledby` rather
 * than being a heading that happens to sit nearby.
 *
 * Radix is also what `shadcn/ui` is built on, which is what Ditto already ships
 * — so this is a primitive their codebase already has, not a new dependency
 * argument.
 *
 * Framer-motion still owns the animation; Radix owns the behaviour. `forceMount`
 * is what lets the two cooperate, since Radix would otherwise unmount before an
 * exit animation could run.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.24 }}
                className="fixed inset-0 z-sheet bg-ink/85 backdrop-blur-md"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, y: '3%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '3%', transition: { duration: 0.2 } }}
                transition={SPRING.copy}
                className={`fixed left-1/2 top-1/2 z-sheet w-[min(56rem,94vw)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sheet border border-paper/10 bg-ink-soft/95 p-gutter shadow-lift ${className}`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="font-display text-[clamp(1.5rem,3.6vw,2.4rem)] uppercase leading-none text-paper">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-2 max-w-[46ch] font-editorial text-[0.92rem] leading-snug text-paper/55">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    data-cursor="close"
                    className="shrink-0 rounded-artifact border border-paper/20 p-2 text-paper/70 transition-colors hover:border-paper/50 hover:text-paper"
                  >
                    <X size={14} strokeWidth={2} aria-hidden />
                  </Dialog.Close>
                </div>

                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
