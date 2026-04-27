import Image from "next/image";
import Link from "next/link";

const navigationLinks = [
  { href: "/", label: "Analises" },
  { href: "/analysis/new", label: "Nova analise" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--cp-border)] bg-[rgba(31,31,31,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo-symbol.svg"
              alt="Copy&Paste"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)]">
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
              className="rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm font-medium text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
