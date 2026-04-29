import { AnimatePresence, motion } from "motion/react";

const fadeTransition = { duration: 0.18, ease: "easeInOut" } as const;
const layoutTransition = { type: "spring", stiffness: 520, damping: 42 } as const;

function AnimatedHeadlineWord({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <motion.span layout="position" className="relative inline-block">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          className={className ? `inline-block ${className}` : "inline-block"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export default function QuestionHeadline({ agentName }: { agentName?: string }) {
  return (
    <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-5xl leading-none font-bold tracking-tighter text-text">
      <AnimatedHeadlineWord>{agentName ? "Is" : "Are"}</AnimatedHeadlineWord>
      <AnimatedHeadlineWord
        className={
          agentName
            ? "text-green underline decoration-green-border decoration-2 underline-offset-4"
            : undefined
        }
      >
        {agentName ?? "we"}
      </AnimatedHeadlineWord>
      <motion.span layout="position" transition={layoutTransition}>
        ACP yet?
      </motion.span>
    </h1>
  );
}
