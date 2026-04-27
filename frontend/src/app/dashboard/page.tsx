import type { Metadata } from "next";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { getDashboardStats } from "@/lib/api/analysis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const stats = await getDashboardStats().catch(() => null);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
          Visao geral
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          Metricas agregadas de todas as analises.
        </p>
      </div>

      {!stats ? (
        <div className="rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-5 text-sm text-[var(--cp-text)]">
          Nao foi possivel carregar os dados do dashboard.
        </div>
      ) : (
        <DashboardCharts stats={stats} />
      )}
    </div>
  );
}
