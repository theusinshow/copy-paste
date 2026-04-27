"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { IssueBatchReviewPanel } from "@/components/analysis/issue-batch-review-panel";
import { IssueCard } from "@/components/analysis/issue-card";
import { reviewAnalysisIssuesBatch } from "@/lib/api/issues";
import type { AnalysisIssue } from "@/lib/types/issue";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "pending_review", label: "Pendentes" },
  { id: "active", label: "Ativas" },
  { id: "resolved", label: "Resolvidas" },
  { id: "dismissed", label: "Descartadas" },
  { id: "inconclusive", label: "Inconclusivas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

type IssueListProps = {
  analysisId: number;
  issues: AnalysisIssue[];
  loadError?: string | null;
  onOpenPdf?: (documentId: number | null, page: number) => void;
  status: string;
};

export function IssueList({
  analysisId,
  issues,
  loadError,
  onOpenPdf,
  status,
}: IssueListProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [focusedIssueId, setFocusedIssueId] = useState<number | null>(null);
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const focusedIssueIdRef = useRef(focusedIssueId);
  const visibleIssuesRef = useRef<AnalysisIssue[]>([]);
  const sortedIssues = [...issues].sort(compareIssuesForReview);
  const visibleIssues =
    activeFilter === "all"
      ? sortedIssues
      : sortedIssues.filter((issue) => issue.review_status === activeFilter);
  const activeFilterLabel =
    FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "Todas";
  const visibleIssueIds = visibleIssues.map((issue) => issue.id);
  const existingIssueIds = new Set(issues.map((issue) => issue.id));
  const validSelectedIssueIds = selectedIssueIds.filter((issueId) =>
    existingIssueIds.has(issueId),
  );
  const effectiveFocusedIssueId =
    visibleIssues.length === 0
      ? null
      : focusedIssueId !== null &&
          visibleIssues.some((issue) => issue.id === focusedIssueId)
        ? focusedIssueId
        : visibleIssues[0].id;
  const visibleSelectedCount = visibleIssueIds.filter((issueId) =>
    validSelectedIssueIds.includes(issueId),
  ).length;

  const filterCounts = {
    active: issues.filter((issue) => issue.review_status === "active").length,
    all: issues.length,
    dismissed: issues.filter((issue) => issue.review_status === "dismissed").length,
    inconclusive: issues.filter((issue) => issue.review_status === "inconclusive")
      .length,
    pending_review: issues.filter(
      (issue) => issue.review_status === "pending_review",
    ).length,
    resolved: issues.filter((issue) => issue.review_status === "resolved").length,
  };

  useEffect(() => {
    focusedIssueIdRef.current = effectiveFocusedIssueId;
  }, [effectiveFocusedIssueId]);

  useEffect(() => {
    visibleIssuesRef.current = visibleIssues;
  }, [visibleIssues]);

  useEffect(() => {
    if (effectiveFocusedIssueId === null) {
      return;
    }

    const element = document.getElementById(`issue-card-${effectiveFocusedIssueId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [effectiveFocusedIssueId]);

  const handleQuickReview = useCallback(
    async (decision: string) => {
      const id = focusedIssueIdRef.current;
      if (id === null) return;
      try {
        await reviewAnalysisIssuesBatch(analysisId, {
          decision,
          issue_ids: [id],
        });
        router.refresh();
      } catch {
        // silently fail for keyboard shortcuts
      }
    },
    [analysisId, router],
  );

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      ) {
        return;
      }

      const issues = visibleIssuesRef.current;
      const currentId = focusedIssueIdRef.current;

      if (event.key === "j") {
        if (currentId === null) return;
        const idx = issues.findIndex((i) => i.id === currentId);
        if (idx !== -1 && issues[idx + 1]) {
          setFocusedIssueId(issues[idx + 1].id);
        }
      } else if (event.key === "k") {
        if (currentId === null) return;
        const idx = issues.findIndex((i) => i.id === currentId);
        if (idx > 0) {
          setFocusedIssueId(issues[idx - 1].id);
        }
      } else if (event.key === "f") {
        const pending = issues.find((i) => i.review_status === "pending_review");
        if (pending) setFocusedIssueId(pending.id);
      } else if (event.key === "r") {
        void handleQuickReview("resolved");
      } else if (event.key === "d") {
        void handleQuickReview("dismissed");
      } else if (event.key === "a") {
        void handleQuickReview("active");
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [handleQuickReview]);

  function handleToggleSelection(issueId: number) {
    setSelectedIssueIds((currentIds) =>
      currentIds.includes(issueId)
        ? currentIds.filter((currentId) => currentId !== issueId)
        : [...currentIds, issueId].sort((left, right) => left - right),
    );
  }

  function handleSelectVisible() {
    setSelectedIssueIds((currentIds) => {
      const nextIds = new Set(currentIds);
      for (const issueId of visibleIssueIds) {
        nextIds.add(issueId);
      }
      return Array.from(nextIds).sort((left, right) => left - right);
    });
  }

  function handleClearSelection() {
    setSelectedIssueIds([]);
  }

  function handleMoveFocus(direction: -1 | 1) {
    if (effectiveFocusedIssueId === null) {
      return;
    }

    const currentIndex = visibleIssues.findIndex(
      (issue) => issue.id === effectiveFocusedIssueId,
    );
    if (currentIndex === -1) {
      return;
    }

    const nextIssue = visibleIssues[currentIndex + direction];
    if (nextIssue) {
      setFocusedIssueId(nextIssue.id);
    }
  }

  function handleFocusFirstPending() {
    const pendingIssue = visibleIssues.find(
      (issue) => issue.review_status === "pending_review",
    );
    if (pendingIssue) {
      setFocusedIssueId(pendingIssue.id);
    }
  }

  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="border-b border-[var(--cp-border)] pb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Pontos encontrados
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Itens que merecem atencao na revisao.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
          Cada card mostra o que foi encontrado, a evidencia principal e a
          decisao humana registrada ate agora.
        </p>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-2xl border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && issues.length > 0 ? (
        <div className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-none border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    isActive
                      ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/12 text-[var(--cp-accent)]"
                      : "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
                  }`}
                >
                  {filter.label} ({filterCounts[filter.id].toString().padStart(2, "0")})
                </button>
              );
            })}
          </div>

          <p className="text-sm text-[var(--cp-muted)]">
            Exibindo {visibleIssues.length} de {issues.length} item(ns)
            encontrados na revisao automatica.
          </p>

          <div className="flex flex-wrap items-center gap-2 rounded-none border border-[var(--cp-border)] bg-black/10 p-3">
            <button
              type="button"
              onClick={() => handleMoveFocus(-1)}
              disabled={
                visibleIssues.length === 0 ||
                effectiveFocusedIssueId === visibleIssues[0]?.id
              }
              className="rounded-none border border-[var(--cp-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => handleMoveFocus(1)}
              disabled={
                visibleIssues.length === 0 ||
                effectiveFocusedIssueId === visibleIssues[visibleIssues.length - 1]?.id
              }
              className="rounded-none border border-[var(--cp-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proxima
            </button>
            <button
              type="button"
              onClick={handleFocusFirstPending}
              disabled={!visibleIssues.some((issue) => issue.review_status === "pending_review")}
              className="rounded-none border border-[var(--cp-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Primeira pendente
            </button>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              Foco:{" "}
              {effectiveFocusedIssueId !== null
                ? `#${effectiveFocusedIssueId.toString().padStart(3, "0")}`
                : "nenhum"}
            </span>
            <span className="ml-auto hidden text-xs text-[var(--cp-muted)] sm:block">
              j/k navegar · f pendente · r/d/a decidir
            </span>
          </div>

          <IssueBatchReviewPanel
            activeFilterLabel={activeFilterLabel}
            analysisId={analysisId}
            onClearSelection={handleClearSelection}
            onSelectVisible={handleSelectVisible}
            selectedCount={validSelectedIssueIds.length}
            selectedIssueIds={validSelectedIssueIds}
            visibleCount={visibleIssues.length}
          />

          <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            {visibleSelectedCount} selecionada(s) na fila visivel atual.
          </p>
        </div>
      ) : null}

      {!loadError && issues.length === 0 ? (
        <div className="mt-6 rounded-none border border-[var(--cp-border)] bg-black/15 p-6">
          <p className="text-sm font-medium text-[var(--cp-text)]">
            {status === "completed"
              ? "Nenhum ponto de atencao foi apontado nesta analise."
              : "Os pontos encontrados aparecerao aqui quando a analise terminar o processamento."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--cp-muted)]">
            Enquanto isso, voce ainda pode acompanhar o andamento e os demais
            blocos do resultado.
          </p>
        </div>
      ) : null}

      {!loadError && issues.length > 0 && visibleIssues.length === 0 ? (
        <div className="mt-6 rounded-none border border-[var(--cp-border)] bg-black/15 p-6">
          <p className="text-sm font-medium text-[var(--cp-text)]">
            Nenhum item corresponde ao filtro selecionado.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--cp-muted)]">
            Troque o filtro para revisar outra fila ou continue registrando
            decisoes humanas nos cards visiveis.
          </p>
        </div>
      ) : null}

      {visibleIssues.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {visibleIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              cardId={`issue-card-${issue.id}`}
              issue={issue}
              isFocused={effectiveFocusedIssueId === issue.id}
              isSelected={validSelectedIssueIds.includes(issue.id)}
              onOpenPdf={onOpenPdf}
              onToggleSelection={handleToggleSelection}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function compareIssuesForReview(left: AnalysisIssue, right: AnalysisIssue) {
  const leftScore =
    getReviewStatusPriority(left.review_status) * 10 + getSeverityPriority(left.severity);
  const rightScore =
    getReviewStatusPriority(right.review_status) * 10 + getSeverityPriority(right.severity);

  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  return left.id - right.id;
}

function getReviewStatusPriority(status: string) {
  const priorityMap: Record<string, number> = {
    active: 4,
    inconclusive: 3,
    pending_review: 5,
    resolved: 1,
    dismissed: 2,
  };

  return priorityMap[status] ?? 0;
}

function getSeverityPriority(severity: string) {
  const priorityMap: Record<string, number> = {
    relevante: 3,
    atencao: 2,
    info: 1,
  };

  return priorityMap[severity] ?? 0;
}
