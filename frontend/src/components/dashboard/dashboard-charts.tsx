"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardStats } from "@/lib/api/analysis";

const ACCENT = "#C99A2E";
const MUTED = "#62605D";
const ERROR = "#E05252";
const SUCCESS = "#5C9E6E";
const WARNING = "#C99A2E";
const INFO = "#6E8EC9";

const STATUS_COLORS: Record<string, string> = {
  completed: SUCCESS,
  failed: ERROR,
  processing: INFO,
  cancelled: MUTED,
  created: "#888",
};

const SEVERITY_COLORS: Record<string, string> = {
  relevante: ERROR,
  atencao: WARNING,
  info: INFO,
};

const DECISION_COLORS: Record<string, string> = {
  pending: MUTED,
  resolved: SUCCESS,
  dismissed: "#888",
  inconclusive: WARNING,
  active: INFO,
};

type Props = { stats: DashboardStats };

export function DashboardCharts({ stats }: Props) {
  const { totals, analyses_by_status, analyses_by_mode, issues_by_severity,
    reviews_by_decision, top_issue_types, trend } = stats;

  const statusData = Object.entries(analyses_by_status).map(([name, value]) => ({ name, value }));
  const severityData = Object.entries(issues_by_severity).map(([name, value]) => ({ name, value }));
  const reviewData = Object.entries(reviews_by_decision).map(([name, value]) => ({ name, value }));
  const modeData = Object.entries(analyses_by_mode)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  const resolutionRate = totals.issues > 0
    ? Math.round(((totals.issues - totals.reviews_pending) / totals.issues) * 100)
    : 0;

  return (
    <div className="grid gap-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label="Análises" value={totals.analyses} />
        <MetricCard label="Documentos" value={totals.documents} />
        <MetricCard label="Pontos" value={totals.issues} />
      <MetricCard label="Revisão pendente" value={`${resolutionRate}% ok`} accent />
      </div>

      {/* Trend line */}
      {trend.length > 1 ? (
      <ChartPanel title="Análises ao longo do tempo">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} name="Análises" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Status bar */}
        {statusData.length > 0 ? (
      <ChartPanel title="Análises por status">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Análises" radius={[2, 2, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? MUTED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}

        {/* Severity pie */}
        {severityData.length > 0 ? (
          <ChartPanel title="Pontos por severidade">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? MUTED} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top issue types */}
        {top_issue_types.length > 0 ? (
          <ChartPanel title="Tipos de ponto mais frequentes">
            <ResponsiveContainer width="100%" height={Math.max(180, top_issue_types.length * 28)}>
              <BarChart
                layout="vertical"
                data={top_issue_types.map((d) => ({ ...d, type: d.type.replace(/_/g, " ") }))}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 9, fill: MUTED }} tickLine={false} width={160} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={ACCENT} name="Ocorrencias" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}

        <div className="grid gap-5">
          {/* Mode distribution */}
          {modeData.length > 0 ? (
      <ChartPanel title="Modos de análise">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={modeData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: MUTED }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" fill={INFO} name="Análises" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          ) : null}

          {/* Review decisions */}
          {reviewData.length > 0 ? (
      <ChartPanel title="Decisões de revisão humana">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={reviewData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: MUTED }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Pontos" radius={[2, 2, 0, 0]}>
                    {reviewData.map((entry) => (
                      <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? MUTED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--cp-muted)]">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${accent ? "text-[var(--cp-accent)]" : "text-[var(--cp-text)]"}`}>
        {value}
      </p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">{title}</p>
      {children}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#1f1f1f",
  border: "1px solid #333",
  borderRadius: 4,
  fontSize: 12,
  color: "#e0e0e0",
};
