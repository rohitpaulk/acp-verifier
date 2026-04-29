import { AnimatePresence, motion } from "motion/react";
import { Link, Outlet, useParams } from "react-router";

import StatusPill from "../components/StatusPill";
import mockData from "../data/mock-results.json";

const fadeTransition = { duration: 0.18, ease: "easeInOut" } as const;
const layoutTransition = { type: "spring", stiffness: 520, damping: 42 } as const;

function findAgent(slug = "") {
  return mockData.agents.find((candidate) => candidate.slug === slug);
}

function AnimatedHeadlineWord({ children, className }: { children: string; className?: string }) {
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

function QuestionHeadline({ agentName }: { agentName?: string }) {
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

function HomeHeaderDetails() {
  return (
    <p className="mt-8 text-base leading-relaxed text-text-muted">
      <span className="font-semibold text-green">Green</span> checks pass,{" "}
      <span className="font-semibold text-red">red</span> checks fail. <br />
      Hover to see details.
    </p>
  );
}

function TopRightLinks() {
  return (
    <div className="flex items-center justify-end gap-2">
      <a
        href="https://agentclientprotocol.com/"
        target="_blank"
        className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.34 1.69c0 1.67-1.68 2.18-1.84 3.31" />
          <path d="M12 17h.01" />
        </svg>
        What's this?
      </a>
      <a
        href="https://github.com/rohitpaulk/acp-verifier"
        target="_blank"
        className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        View on GitHub &rarr;
      </a>
    </div>
  );
}

function TopNav({ showBackLink }: { showBackLink: boolean }) {
  return (
    <div className="absolute top-7 right-7 left-7 flex items-start justify-between gap-4">
      {showBackLink ? (
        <Link
          to="/"
          className="inline-flex items-center gap-1 pt-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
        >
          &larr; All agents
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <TopRightLinks />
    </div>
  );
}

export default function AppLayout() {
  const { slug } = useParams();
  const agent = findAgent(slug);

  if (slug && !agent) {
    return <Outlet />;
  }

  return (
    <div className="relative mx-auto max-w-5xl px-7">
      <TopNav showBackLink={Boolean(agent)} />

      <header className="pt-24 pb-12 text-center">
        {agent ? (
          <Link to="/">
            <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
          </Link>
        ) : (
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        )}
        <QuestionHeadline agentName={agent?.name} />
        <StatusPill />
        {agent ? null : <HomeHeaderDetails />}
      </header>

      <Outlet />
    </div>
  );
}
