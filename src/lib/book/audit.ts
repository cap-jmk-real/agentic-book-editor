import type { AuditFinding, AuditState, ChapterId } from "./types";

export function openFindingsForChapter(
  audit: AuditState,
  chapterId: ChapterId,
): AuditFinding[] {
  return audit.findings.filter(
    (f) => f.chapterId === chapterId && f.status === "open",
  );
}

export function resolveFinding(
  audit: AuditState,
  findingId: string,
): AuditState {
  return {
    ...audit,
    findings: audit.findings.map((f) =>
      f.id === findingId ? { ...f, status: "resolved" } : f,
    ),
  };
}

export function munenoriFindings(audit: AuditState): AuditFinding[] {
  return audit.findings.filter(
    (f) => f.resolver === "munenori" && f.status === "open",
  );
}

export function severityLabel(severity: AuditFinding["severity"]): string {
  switch (severity) {
    case "error":
      return "Error";
    case "warn":
      return "Warn";
    default:
      return "Info";
  }
}
