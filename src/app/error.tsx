"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container page-section">
      <h1>Something interrupted this page.</h1>
      <p>
        Please try again. If the issue continues, contact the site
        administrator.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
