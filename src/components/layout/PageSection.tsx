import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageSectionProps {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** skip the entrance transition (reduced motion / simple mode) */
  still?: boolean;
}

/**
 * In-flow content panel for a journey stop. It slides/fades in as the
 * camera reaches the destination (and out again when scrolling back).
 * Desktop: a right-hand content column. Mobile: a bottom sheet that starts
 * below the visible scene.
 */
export function PageSection({ id, title, subtitle, children, still = false }: PageSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative min-h-svh flex flex-col justify-end md:flex-row md:justify-end pointer-events-none"
    >
      <motion.div
        initial={still ? false : { opacity: 0, x: 40 }}
        whileInView={still ? undefined : { opacity: 1, x: 0 }}
        viewport={{ once: false, amount: 0.12, margin: '0px 0px -12% 0px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        data-section-panel
        className="pointer-events-auto w-full md:w-[620px] lg:w-[680px] mt-[44svh] md:mt-0 min-h-[56svh] md:min-h-svh bg-[#F8F5EF]/95 backdrop-blur-xl rounded-t-3xl md:rounded-none md:border-l border-[#C99B9B]/25 shadow-2xl flex flex-col"
      >
        <div className="px-6 pt-7 pb-5 md:px-8 md:pt-28 md:pb-6 border-b border-[#C99B9B]/20 bg-[#F8F5EF]/60 rounded-t-3xl md:rounded-none">
          <div className="text-[11px] uppercase tracking-widest font-semibold text-[#613F4D]">{subtitle}</div>
          <h2
            id={`${id}-title`}
            className="font-serif text-2xl md:text-3xl font-medium text-[#292827] mt-0.5 tracking-tight"
          >
            {title}
          </h2>
        </div>
        <div className="flex-1 px-6 pt-6 pb-28 md:px-8 md:pt-8 md:pb-16 space-y-8">{children}</div>
      </motion.div>
    </section>
  );
}
