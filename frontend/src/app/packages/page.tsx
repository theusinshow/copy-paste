import type { Metadata } from "next";

import { PackageList } from "@/components/packages/package-list";
import { getPackageHistory } from "@/lib/api/analysis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pacotes" };

export default async function PackagesPage() {
  const packages = await getPackageHistory().catch(() => []);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
          Historico
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Pacotes
        </h1>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          Analises agrupadas por codigo de projeto detectado.
        </p>
      </div>

      <PackageList packages={packages} />
    </div>
  );
}
