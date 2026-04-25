"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { cancelAnalysis, getAnalysis, startAnalysis } from "@/lib/api/analysis";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun } from "@/lib/types/analysis";

type ProcessingMonitorProps = {
  initialAnalysis: AnalysisRun;
};

const STEPS = [
  {
    description: "Analise criada e arquivos recebidos pelo backend.",
    key: "created",
    title: "Preparacao",
  },
  {
    description: "Leitura das paginas, extracao de texto e normalizacao.",
    key: "processing",
    title: "Processamento",
  },
  {
    description: "Regras aplicadas e resultado tecnico liberado.",
    key: "completed",
    title: "Resultado",
  },
];

export function ProcessingMonitor({ initialAnalysis }: ProcessingMonitorProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function refresh() {
      try {
        const nextAnalysis = await getAnalysis(initialAnalysis.id);
        if (isMounted) {
          setAnalysis(nextAnalysis);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            extractApiErrorMessage(
              error,
              "Nao foi possivel atualizar o status da analise agora.",
            ),
          );
        }
      }
    }

    async function start() {
      if (hasStarted.current) {
        return;
      }
      hasStarted.current = true;

      if (initialAnalysis.status === "created") {
        setStartedAt(new Date());
        setAnalysis({ ...initialAnalysis, status: "processing" });
        try {
          const startedAnalysis = await startAnalysis(initialAnalysis.id);
          if (isMounted) {
            setAnalysis(startedAnalysis);
          }
        } catch (error) {
          if (isMounted) {
            setErrorMessage(
              extractApiErrorMessage(
                error,
                "Nao foi possivel iniciar o processamento desta analise.",
              ),
            );
            await refresh();
          }
        }
      }
    }

    void start();
    intervalId = setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [initialAnalysis]);

  const currentStatus = errorMessage ? "failed" : analysis.status;
  const isFinished =
    analysis.status === "completed" ||
    analysis.status === "failed" ||
    analysis.status === "cancelled";

  async function handleCancel() {
    if (isFinished || isCancelling) {
      return;
    }

    setIsCancelling(true);
    try {
      const cancelledAnalysis = await cancelAnalysis(analysis.id);
      setAnalysis(cancelledAnalysis);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        extractApiErrorMessage(
          error,
          "Nao foi possivel solicitar o cancelamento agora.",
        ),
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
              >
                Voltar
              </Link>
              <AnalysisModeBadge mode={analysis.analysis_mode} />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[var(--cp-accent)]">
              Analise #{analysis.id.toString().padStart(4, "0")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
              Acompanhamento do processamento.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
              Esta tela acompanha a criacao, leitura dos PDFs, aplicacao das
              regras e liberacao do resultado tecnico.
            </p>
          </div>
          <AnalysisStatusBadge status={currentStatus} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-[var(--cp-border)] bg-black/12 p-5">
          <div className="grid gap-3">
            {STEPS.map((step, index) => (
              <ProcessingStep
                key={step.key}
                description={step.description}
                index={index + 1}
                state={getStepState(step.key, analysis.status, errorMessage)}
                title={step.title}
              />
            ))}
          </div>
        </div>

        <aside className="grid gap-4 self-start">
          <InfoCard label="Criada em" value={formatAnalysisDate(analysis.created_at)} />
          <InfoCard
            label="Tempo em tela"
            value={startedAt ? formatElapsed(startedAt) : "Aguardando"}
          />
          <InfoCard label="Status atual" value={currentStatus} />
        </aside>
      </section>

      {analysis.status === "cancelled" ? (
        <div className="rounded-lg border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 p-4 text-sm leading-6 text-[var(--cp-text)]">
          Processamento cancelado. Nenhum resultado tecnico foi liberado para
          esta analise.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm leading-6 text-[var(--cp-text)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--cp-border)] bg-black/12 p-4">
        {!isFinished ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="rounded-lg border border-[var(--cp-error)]/40 px-4 py-3 text-sm font-semibold text-[var(--cp-error)] transition-colors hover:bg-[var(--cp-error)]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling ? "Cancelando..." : "Parar processamento"}
          </button>
        ) : null}
        {analysis.status === "completed" ? (
          <Link
            href={`/analysis/${analysis.id}`}
            className="rounded-lg bg-[var(--cp-accent)] px-4 py-3 text-sm font-semibold text-[var(--cp-accent-ink)]"
          >
            Abrir resultado
          </Link>
        ) : null}
        {analysis.status === "failed" || analysis.status === "cancelled" ? (
          <Link
            href="/"
            className="rounded-lg border border-[var(--cp-border)] px-4 py-3 text-sm font-medium text-[var(--cp-text)]"
          >
            Voltar para analises
          </Link>
        ) : null}
        {!isFinished ? (
          <p className="text-sm text-[var(--cp-muted)]">
            A pagina atualiza o status automaticamente a cada poucos segundos.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProcessingStep({
  description,
  index,
  state,
  title,
}: {
  description: string;
  index: number;
  state: "done" | "failed" | "pending" | "running";
  title: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel-soft)] p-4 sm:grid-cols-[44px_minmax(0,1fr)_110px] sm:items-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm ${getStepMarkerClass(state)}`}>
        {index.toString().padStart(2, "0")}
      </span>
      <div>
        <p className="font-medium text-[var(--cp-text)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--cp-muted)]">
          {description}
        </p>
      </div>
      <span className={`w-fit rounded-none border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStepPillClass(state)}`}>
        {getStepLabel(state)}
      </span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/12 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
        {value}
      </p>
    </div>
  );
}

function getStepState(
  stepKey: string,
  status: string,
  errorMessage: string | null,
): "done" | "failed" | "pending" | "running" {
  if (errorMessage || status === "failed") {
    return stepKey === "completed" ? "failed" : "done";
  }
  if (status === "cancelled") {
    return stepKey === "completed" ? "failed" : "done";
  }
  if (status === "completed") {
    return "done";
  }
  if (status === "processing") {
    return stepKey === "created" ? "done" : stepKey === "processing" ? "running" : "pending";
  }
  return stepKey === "created" ? "running" : "pending";
}

function getStepMarkerClass(state: "done" | "failed" | "pending" | "running") {
  const map = {
    done: "border-[var(--cp-success)]/40 bg-[var(--cp-success)]/10 text-[var(--cp-success)]",
    failed: "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 text-[var(--cp-error)]",
    pending: "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)]",
    running: "border-[var(--cp-accent)]/40 bg-[var(--cp-accent)]/10 text-[var(--cp-accent)]",
  };
  return map[state];
}

function getStepPillClass(state: "done" | "failed" | "pending" | "running") {
  return getStepMarkerClass(state);
}

function getStepLabel(state: "done" | "failed" | "pending" | "running") {
  const labels = {
    done: "ok",
    failed: "falha",
    pending: "aguarda",
    running: "em curso",
  };
  return labels[state];
}

function formatElapsed(startedAt: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
