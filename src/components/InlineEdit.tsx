import { useState } from "react";

interface Props {
  value: string;
  onCommit: (next: string) => void;
  /** Class for the read-only display span. */
  className?: string;
  title?: string;
}

/**
 * Double-click a label to edit it inline. Enter or blur commits a non-empty,
 * trimmed value; Escape cancels. Pointer events are stopped so editing doesn't
 * trigger the surrounding tab/pane click handlers.
 */
export function InlineEdit({ value, onCommit, className, title }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  const commit = () => {
    if (draft === null) return;
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    setDraft(null);
  };

  if (editing) {
    return (
      <input
        className="inline-edit"
        value={draft}
        autoFocus
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") setDraft(null);
        }}
      />
    );
  }

  return (
    <span
      className={className}
      title={title ?? "Klik dua kali untuk ganti nama"}
      onDoubleClick={() => setDraft(value)}
    >
      {value}
    </span>
  );
}
