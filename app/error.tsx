"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[RECAST] UI boundary captured an error", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="failure-screen" role="alert">
      <span>RECOVERY MODE</span>
      <h1>The studio hit an unexpected state.</h1>
      <p>Your browser session has not been uploaded. Try rendering the workspace again; if the issue continues, reset the local demo data from the header.</p>
      <button onClick={reset}>Try again</button>
      {error.digest ? <code>Incident {error.digest}</code> : null}
    </main>
  );
}
