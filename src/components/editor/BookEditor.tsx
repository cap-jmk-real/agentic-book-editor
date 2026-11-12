"use client";

import {
  ClipboardCheck,
  Focus,
  Moon,
  MoreHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Tags,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { PaletteAction } from "@/components/ui/CommandPalette";
import { resolveFinding } from "@/lib/book/audit";
import {
  detectTermsHeuristic,
  parseDetectTermsJson,
  suggestionsToTerms,
} from "@/lib/book/detectTerms";
import { loadAudit, loadBook, saveAudit, saveBook } from "@/lib/book/storage";
import {
  createManualTerm,
  findTermRanges,
  mergeBookTerms,
  normalizeTerm,
  recomputeTermRanges,
} from "@/lib/book/terms";
import type { AuditFinding, AuditState, BookState, GoDeeperTerm } from "@/lib/book/types";
import { useAiProposal } from "@/hooks/useAiProposal";
import { useMunenoriStatus } from "@/hooks/useMunenoriStatus";
import { AuditPanel } from "./AuditPanel";
import { EditorPane, type EditorMode } from "./EditorPane";
import { EditorSkeleton } from "./EditorSkeleton";
import { MunenoriStatus } from "./MunenoriStatus";
import { PhoneModal } from "./PhoneModal";
import { TermsPanel } from "./TermsPanel";

type BookTheme = "light" | "dark";
type RailTab = "audit" | "terms";

export function BookEditor() {
  const [book, setBook] = useState<BookState | null>(null);
  const [audit, setAudit] = useState<AuditState | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("read");
  const [focusMode, setFocusMode] = useState(false);
  const [theme, setTheme] = useState<BookTheme>("light");
  const [tocSheetOpen, setTocSheetOpen] = useState(false);
  const [auditSheetOpen, setAuditSheetOpen] = useState(false);
  const [termsSheetOpen, setTermsSheetOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railTab, setRailTab] = useState<RailTab>("audit");
  const [proposalInstruction, setProposalInstruction] = useState("");
  const [busyFindingId, setBusyFindingId] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const showSuggestedInEdit = true;

  const { online: munenoriOnline } = useMunenoriStatus();
  const ai = useAiProposal();

  useEffect(() => {
    setBook(loadBook());
    setAudit(loadAudit());
    const stored = window.localStorage.getItem("agentic-book-editor:theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    if (book) saveBook(book);
  }, [book]);

  useEffect(() => {
    if (audit) saveAudit(audit);
  }, [audit]);

  useEffect(() => {
    window.localStorage.setItem("agentic-book-editor:theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "j")) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeChapter = book?.chapters.find((c) => c.id === book.activeChapterId);

  const setChapterBody = useCallback((chapterId: string, body: string) => {
    setBook((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        chapters: prev.chapters.map((c) => (c.id === chapterId ? { ...c, body } : c)),
      };
      return mergeBookTerms(next, chapterId, body);
    });
  }, []);

  const runContinue = useCallback(
    (instruction?: string) => {
      if (!book || !activeChapter || !munenoriOnline) return;
      setEditorMode("edit");
      void ai.start({
        mode: "continue",
        chapterId: activeChapter.id,
        instruction,
        payload: {
          mode: "continue",
          chapterTitle: activeChapter.title,
          body: activeChapter.body,
          instruction: instruction?.trim() || undefined,
        },
      });
    },
    [ai, activeChapter, book, munenoriOnline],
  );

  const runRewrite = useCallback(
    (start: number, end: number, text: string) => {
      if (!activeChapter || !munenoriOnline) return;
      setEditorMode("edit");
      void ai.start({
        mode: "rewrite-selection",
        chapterId: activeChapter.id,
        sourceRange: { start, end },
        instruction: proposalInstruction,
        payload: {
          mode: "rewrite-selection",
          chapterTitle: activeChapter.title,
          body: activeChapter.body,
          selectionText: text,
          instruction: proposalInstruction.trim() || undefined,
        },
      });
    },
    [activeChapter, ai, munenoriOnline, proposalInstruction],
  );

  const runAuditFix = useCallback(
    (finding: AuditFinding) => {
      if (!activeChapter || !munenoriOnline) return;
      setEditorMode("edit");
      setBusyFindingId(finding.id);
      void ai.start({
        mode: "audit-fix",
        chapterId: activeChapter.id,
        auditFindingId: finding.id,
        auditExcerpt: finding.excerpt,
        auditIssue: finding.issue,
        sourceRange: finding.excerpt
          ? (() => {
              const idx = activeChapter.body.indexOf(finding.excerpt);
              return idx >= 0
                ? { start: idx, end: idx + finding.excerpt.length }
                : undefined;
            })()
          : undefined,
        payload: {
          mode: "audit-fix",
          chapterTitle: activeChapter.title,
          body: activeChapter.body,
          auditIssue: finding.issue,
          auditExcerpt: finding.excerpt,
        },
      }).finally(() => setBusyFindingId(null));
    },
    [activeChapter, ai, munenoriOnline],
  );

  const acceptProposal = useCallback(
    (insertBelow?: boolean) => {
      if (!book || !activeChapter) return;
      const findingId = ai.proposal?.auditFindingId;
      const apply = (next: string) => setChapterBody(activeChapter.id, next);
      ai.accept(activeChapter.body, apply, { insertBelow });
      if (findingId && audit) {
        setAudit(resolveFinding(audit, findingId));
      }
    },
    [ai, activeChapter, audit, book, setChapterBody],
  );

  const retryProposal = useCallback(() => {
    if (!ai.proposal || !activeChapter) return;
    const p = ai.proposal;
    if (p.mode === "continue") runContinue(p.instruction);
    else if (p.mode === "rewrite-selection" && p.sourceRange) {
      runRewrite(p.sourceRange.start, p.sourceRange.end, activeChapter.body.slice(p.sourceRange.start, p.sourceRange.end));
    } else if (p.mode === "audit-fix" && audit) {
      const finding = audit.findings.find((f) => f.id === p.auditFindingId);
      if (finding) runAuditFix(finding);
    }
  }, [ai.proposal, activeChapter, audit, runContinue, runRewrite, runAuditFix]);

  const handleMarkTerm = useCallback(
    (term: string, explanation: string) => {
      if (!book || !activeChapter || !term.trim()) return;
      const record = createManualTerm(activeChapter.id, term, activeChapter.body, explanation || undefined);
      setBook({ ...book, terms: [...book.terms.filter((t) => !(t.chapterId === activeChapter.id && t.normalized === record.normalized)), record] });
    },
    [activeChapter, book],
  );

  const handleDetectTerms = useCallback(async () => {
    if (!book || !activeChapter) return;
    setDetectError(null);
    const acceptedElsewhere = book.terms
      .filter((t) => t.status === "accepted" && t.chapterId !== activeChapter.id)
      .map((t) => t.normalized);
    const heuristic = detectTermsHeuristic(
      activeChapter.body,
      activeChapter.id,
      book.terms,
      acceptedElsewhere,
    );
    let merged = [...book.terms];
    const fromHeuristic = suggestionsToTerms(heuristic, activeChapter.id, activeChapter.body);
    for (const t of fromHeuristic) {
      if (!merged.some((e) => e.chapterId === t.chapterId && e.normalized === t.normalized)) {
        merged.push(t);
      }
    }

    if (munenoriOnline) {
      try {
        const known = book.terms
          .filter((t) => t.chapterId === activeChapter.id)
          .map((t) => t.normalized);
        const res = await fetch("/api/llm/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "detect-terms",
            chapterTitle: activeChapter.title,
            body: activeChapter.body,
            knownTerms: known,
          }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Detect failed");
        const parsed = parseDetectTermsJson(data.text ?? "");
        if (parsed.error) setDetectError(parsed.error);
        for (const item of parsed.items) {
          const normalized = normalizeTerm(item.term);
          if (merged.some((e) => e.chapterId === activeChapter.id && e.normalized === normalized)) continue;
          merged.push({
            id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            term: item.term,
            normalized,
            chapterId: activeChapter.id,
            ranges: findTermRanges(activeChapter.body, item.term),
            explanation: item.draftExplanation,
            source: "llm",
            status: "suggested",
            createdAt: new Date().toISOString(),
          });
        }
        merged = mergeBookTerms({ ...book, terms: merged }, activeChapter.id, activeChapter.body).terms;
      } catch (e) {
        setDetectError(e instanceof Error ? e.message : "Detect failed");
      }
    }

    merged = recomputeTermRanges(merged, activeChapter.id, activeChapter.body);
    setBook({ ...book, terms: merged });
    setRailTab("terms");
    setTermsSheetOpen(true);
  }, [activeChapter, book, munenoriOnline]);

  const fixDetectTermsRanges = useCallback((terms: GoDeeperTerm[]) => {
    if (!activeChapter) return terms;
    return recomputeTermRanges(terms, activeChapter.id, activeChapter.body);
  }, [activeChapter]);

  useEffect(() => {
    if (!book || !activeChapter) return;
    const { id, body } = activeChapter;
    const t = window.setTimeout(() => {
      setBook((prev) => (prev ? mergeBookTerms(prev, id, body) : prev));
    }, 400);
    return () => window.clearTimeout(t);
  }, [activeChapter, book]);

  const paletteActions: PaletteAction[] = useMemo(() => {
    const offline = !munenoriOnline;
    return [
      {
        id: "continue",
        label: "Continue chapter",
        hint: "Munenori proposes text at the end",
        icon: Sparkles,
        disabled: offline,
        disabledReason: "Munenori is offline",
        run: () => {
          setEditorMode("edit");
          runContinue(proposalInstruction);
        },
      },
      {
        id: "detect",
        label: "Detect terms",
        hint: "Heuristic scan (+ Munenori when online)",
        icon: Tags,
        run: () => void handleDetectTerms(),
      },
      {
        id: "audit",
        label: "Open audit",
        hint: "Review open findings",
        icon: ClipboardCheck,
        run: () => setAuditSheetOpen(true),
      },
      {
        id: "phone",
        label: "Open on this Wi‑Fi",
        hint: "QR code for your phone",
        icon: Smartphone,
        run: () => setPhoneOpen(true),
      },
      {
        id: "focus",
        label: focusMode ? "Exit focus" : "Toggle focus",
        icon: Focus,
        run: () => setFocusMode((f) => !f),
      },
      {
        id: "theme",
        label: theme === "light" ? "Dark theme" : "Light theme",
        icon: theme === "light" ? Moon : Sun,
        run: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      },
    ];
  }, [focusMode, handleDetectTerms, munenoriOnline, proposalInstruction, runContinue, theme]);

  if (!book || !audit || !activeChapter) {
    return <EditorSkeleton />;
  }

  const showToc = !focusMode;
  const chapterTerms = book.terms.filter((t) => t.chapterId === activeChapter.id);

  return (
    <div
      className="book-editor flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]"
      data-theme={theme}
      style={{ background: "var(--book-canvas)", color: "var(--book-text)" }}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5"
        style={{ borderColor: "var(--book-border)", background: "var(--book-chrome)" }}
        data-testid="editor-header"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.01em]" style={{ color: "var(--book-text-faint)" }}>
            Agentic book editor
          </p>
          <p className="truncate text-sm font-semibold sm:text-base" style={{ color: "var(--book-text)" }}>
            {book.title}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex">
            <MunenoriStatus />
          </div>
          <button
            type="button"
            className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium lg:inline-flex"
            style={{ color: focusMode ? "var(--book-accent-text)" : "var(--book-text-secondary)" }}
            onClick={() => setFocusMode((f) => !f)}
            aria-pressed={focusMode}
          >
            <Focus size={16} strokeWidth={1.5} />
            {focusMode ? "Exit focus" : "Focus"}
          </button>
          <button
            type="button"
            className="hidden rounded-md p-2 lg:inline-flex"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            style={{ color: "var(--book-text-secondary)" }}
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
          </button>
          <div className="relative lg:hidden">
            <button
              type="button"
              className="rounded-md p-2"
              aria-label="More actions"
              data-testid="overflow-menu"
              style={{ color: "var(--book-text-secondary)" }}
              onClick={() => setOverflowOpen((o) => !o)}
            >
              <MoreHorizontal size={20} strokeWidth={1.5} />
            </button>
            {overflowOpen && (
              <div
                className="absolute right-0 top-full z-40 mt-1 w-48 rounded-lg p-1 shadow-lg"
                style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
              >
                <OverflowItem icon={Moon} label="Theme" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
                <OverflowItem icon={ClipboardCheck} label="Audit" onClick={() => setAuditSheetOpen(true)} />
                <OverflowItem icon={Tags} label="Terms" onClick={() => setTermsSheetOpen(true)} />
                <OverflowItem icon={Smartphone} label="Phone" onClick={() => setPhoneOpen(true)} />
                <OverflowItem icon={Focus} label={focusMode ? "Exit focus" : "Focus"} onClick={() => setFocusMode((f) => !f)} />
                <OverflowItem icon={Sparkles} label="Detect terms" onClick={() => void handleDetectTerms()} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {showToc && (
          <nav
            className="hidden shrink-0 border-r lg:block lg:w-56 xl:w-60"
            style={{ borderColor: "var(--book-border)", background: "var(--book-sidebar)" }}
            aria-label="Table of contents"
            data-testid="toc-desktop"
          >
            <TocList
              book={book}
              onSelect={(id) => setBook({ ...book, activeChapterId: id })}
            />
          </nav>
        )}

        <main className="min-h-[50vh] min-w-0 flex-1 lg:min-h-0">
          <EditorPane
            title={activeChapter.title}
            body={activeChapter.body}
            onBodyChange={(body) => setChapterBody(activeChapter.id, body)}
            mode={editorMode}
            onModeChange={setEditorMode}
            terms={chapterTerms}
            showSuggestedTerms={editorMode === "edit" && showSuggestedInEdit}
            munenoriOnline={munenoriOnline}
            proposal={ai.proposal}
            proposalInstruction={proposalInstruction}
            onProposalInstructionChange={setProposalInstruction}
            onContinue={runContinue}
            onRewriteSelection={runRewrite}
            onAcceptProposal={acceptProposal}
            onDiscardProposal={ai.discard}
            onRetryProposal={retryProposal}
            onCancelProposal={ai.cancel}
            onMarkTerm={handleMarkTerm}
            onDetectTerms={() => void handleDetectTerms()}
            onRemoveTerm={(id) =>
              setBook({ ...book, terms: book.terms.filter((t) => t.id !== id) })
            }
            revertVisible={ai.revertVisible}
            onRevert={() => activeChapter && ai.revert((b) => setChapterBody(activeChapter.id, b))}
            paletteOpen={paletteOpen}
            onClosePalette={() => setPaletteOpen(false)}
            paletteActions={paletteActions}
            onOpenPalette={() => setPaletteOpen(true)}
            onChapterTitleTap={() => setTocSheetOpen(true)}
          />
        </main>

        {!focusMode && (
          <div className="hidden h-full w-80 shrink-0 flex-col border-l lg:flex" style={{ borderColor: "var(--book-border)" }} data-testid="desktop-rail">
            <div className="flex border-b text-xs" style={{ borderColor: "var(--book-border)" }}>
              <RailTabButton active={railTab === "audit"} onClick={() => setRailTab("audit")} label="Audit" />
              <RailTabButton active={railTab === "terms"} onClick={() => setRailTab("terms")} label="Terms" />
            </div>
            {railTab === "audit" ? (
              <AuditPanel
                book={book}
                audit={audit}
                onRequestFix={runAuditFix}
                busyFindingId={busyFindingId}
                munenoriOnline={munenoriOnline}
              />
            ) : (
              <TermsPanel
                book={book}
                chapterId={activeChapter.id}
                onAccept={(t, explanation) => {
                  setBook({
                    ...book,
                    terms: book.terms.map((x) =>
                      x.id === t.id
                        ? {
                            ...x,
                            status: "accepted",
                            explanation: explanation ?? x.explanation,
                            ranges: fixDetectTermsRanges(book.terms).find((r) => r.id === t.id)?.ranges ?? x.ranges,
                          }
                        : x,
                    ),
                  });
                }}
                onReject={(id) =>
                  setBook({
                    ...book,
                    terms: book.terms.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)),
                  })
                }
                onRemove={(id) => setBook({ ...book, terms: book.terms.filter((t) => t.id !== id) })}
                onEditExplanation={(id, explanation) =>
                  setBook({
                    ...book,
                    terms: book.terms.map((x) => (x.id === id ? { ...x, explanation } : x)),
                  })
                }
              />
            )}
            {detectError && (
              <p className="px-4 py-2 text-xs" style={{ color: "var(--book-danger)" }}>
                {detectError}
              </p>
            )}
          </div>
        )}
      </div>

      <Sheet open={tocSheetOpen} onClose={() => setTocSheetOpen(false)} title="Chapters">
        <TocList
          book={book}
          onSelect={(id) => {
            setBook({ ...book, activeChapterId: id });
            setTocSheetOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={auditSheetOpen} onClose={() => setAuditSheetOpen(false)} title="Audit" maxHeight="85vh">
        <AuditPanel
          book={book}
          audit={audit}
          onRequestFix={runAuditFix}
          busyFindingId={busyFindingId}
          munenoriOnline={munenoriOnline}
          onClose={() => setAuditSheetOpen(false)}
          showClose
        />
      </Sheet>

      <Sheet open={termsSheetOpen} onClose={() => setTermsSheetOpen(false)} title="Terms" maxHeight="85vh">
        <TermsPanel
          book={book}
          chapterId={activeChapter.id}
          onAccept={(t, explanation) => {
            setBook({
              ...book,
              terms: book.terms.map((x) =>
                x.id === t.id ? { ...x, status: "accepted", explanation: explanation ?? x.explanation } : x,
              ),
            });
          }}
          onReject={(id) =>
            setBook({
              ...book,
              terms: book.terms.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)),
            })
          }
          onRemove={(id) => setBook({ ...book, terms: book.terms.filter((t) => t.id !== id) })}
          onEditExplanation={(id, explanation) =>
            setBook({
              ...book,
              terms: book.terms.map((x) => (x.id === id ? { ...x, explanation } : x)),
            })
          }
        />
      </Sheet>

      <PhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} theme={theme} />
    </div>
  );
}

function TocList({ book, onSelect }: { book: BookState; onSelect: (id: string) => void }) {
  return (
    <>
      <p className="hidden px-4 pt-4 pb-2 text-xs font-medium lg:block" style={{ color: "var(--book-text-faint)" }}>
        Chapters
      </p>
      <ul className="p-2 lg:px-3 lg:pb-4" data-testid="toc-list">
        {book.chapters.map((ch, index) => {
          const active = ch.id === book.activeChapterId;
          return (
            <li key={ch.id}>
              <button
                type="button"
                onClick={() => onSelect(ch.id)}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left text-sm lg:py-2"
                style={
                  active
                    ? {
                        background: "var(--book-accent-subtle)",
                        color: "var(--book-accent-text)",
                        boxShadow: "inset 3px 0 0 var(--book-accent)",
                      }
                    : { color: "var(--book-text-muted)" }
                }
              >
                <span className="w-5 shrink-0 text-xs tabular-nums" style={{ color: active ? "var(--book-accent)" : "var(--book-text-faint)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={active ? "font-semibold" : "font-medium"}>{ch.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function RailTabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="flex-1 px-4 py-2.5 font-medium"
      style={{
        color: active ? "var(--book-text)" : "var(--book-text-muted)",
        borderBottom: active ? "2px solid var(--book-accent)" : "2px solid transparent",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function OverflowItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Focus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
      style={{ color: "var(--book-text-secondary)" }}
      onClick={() => {
        onClick();
      }}
    >
      <Icon size={16} strokeWidth={1.5} />
      {label}
    </button>
  );
}
