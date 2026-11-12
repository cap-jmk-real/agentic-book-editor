export function EditorSkeleton() {
  return (
    <div
      className="book-editor flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]"
      data-theme="light"
      style={{ background: "var(--book-canvas)" }}
      aria-busy="true"
      aria-label="Loading editor"
    >
      <div className="h-14 animate-pulse border-b" style={{ borderColor: "var(--book-border)", background: "var(--book-chrome)" }} />
      <div className="flex flex-1 gap-4 p-4">
        <div className="hidden w-52 animate-pulse rounded-md lg:block" style={{ background: "var(--book-sidebar)" }} />
        <div className="mx-auto h-[60vh] w-full max-w-2xl animate-pulse rounded-sm" style={{ background: "var(--book-page)" }} />
      </div>
    </div>
  );
}
