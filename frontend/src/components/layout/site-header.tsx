import Link from "next/link";

const navigationLinks = [
  { href: "/", label: "Analises" },
  { href: "/analysis/new", label: "Nova analise" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--cp-border)] bg-[rgba(50,50,50,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--cp-accent)] text-sm font-black text-[var(--cp-accent-ink)]">
              CP
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cp-accent)]">
                Copy&amp;Paste
              </p>
              <p className="text-sm text-[var(--cp-muted)]">
                Auditoria documental
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[var(--cp-border)] px-4 py-2 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
