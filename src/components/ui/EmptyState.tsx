import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="muted max-w-sm">{children}</div>}
    </div>
  );
}
