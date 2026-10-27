'use client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center" role="alert">
      <div className="glass max-w-md p-8">
        <p className="text-5xl" aria-hidden>💦</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Something spilled</h1>
        <p className="muted mt-2">{error.message || 'An unexpected error happened.'} Your saved drinks are safe on this device.</p>
        <button className="btn btn-primary mt-5" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
