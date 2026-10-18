"use client";

type Props = {
  title: string;
  body: string;
  onBodyChange: (body: string) => void;
  onContinue: () => void;
  continuing: boolean;
  continueError: string | null;
  instruction: string;
  onInstructionChange: (value: string) => void;
};

export function EditorPane({
  title,
  body,
  onBodyChange,
  onContinue,
  continuing,
  continueError,
  instruction,
  onInstructionChange,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        <button
          type="button"
          onClick={onContinue}
          disabled={continuing}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {continuing ? "Munenori writing…" : "Munenori Continue"}
        </button>
      </header>
      <div className="border-b border-zinc-800 px-4 py-2">
        <label className="block text-xs text-zinc-500">
          Optional instruction for Continue
          <input
            type="text"
            value={instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            placeholder="e.g. add a worked example"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </label>
      </div>
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        spellCheck
        className="min-h-0 flex-1 resize-none bg-zinc-950 p-4 font-mono text-sm leading-relaxed text-zinc-100 outline-none"
        aria-label="Chapter markdown"
      />
      {continueError && (
        <p className="border-t border-zinc-800 px-4 py-2 text-xs text-amber-300">
          {continueError}
        </p>
      )}
    </div>
  );
}
