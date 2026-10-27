import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="glass max-w-md p-8">
        <p className="text-5xl" aria-hidden>🏜️</p>
        <h1 className="mt-3 font-display text-2xl font-bold">This page ran dry</h1>
        <p className="muted mt-2">We couldn&apos;t find what you were looking for.</p>
        <Link href="/dashboard" className="btn btn-primary mt-5">Back to today</Link>
      </div>
    </main>
  );
}
