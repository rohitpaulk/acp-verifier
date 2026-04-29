import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./styles/global.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-7 text-sm font-semibold tracking-wide text-text-muted uppercase">
      Loading ACP verifier...
    </div>
  );
}

export default function App() {
  return <Outlet />;
}
