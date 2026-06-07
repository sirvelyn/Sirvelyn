import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export interface DividerProps {
  key: string;
  className: string;
  style: CSSProperties;
  onPointerDown: (e: ReactPointerEvent) => void;
}

/** Each track may not shrink below this share of its axis total. */
const MIN_RATIO = 0.12;

/**
 * Drag-resizable CSS-grid sizing for the split view. Returns `fr` track strings
 * and absolutely-positioned divider handles. It owns ONLY the track sizes — the
 * terminal panes stay where the caller renders them (they are never moved or
 * remounted), so dragging can't disturb a running shell. Sizes reset to equal
 * whenever the grid dimensions change (a terminal added/removed).
 */
export function useResizableGrid(cols: number, rows: number) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [colSizes, setColSizes] = useState<number[]>(() => Array(cols).fill(1));
  const [rowSizes, setRowSizes] = useState<number[]>(() => Array(rows).fill(1));

  useEffect(() => setColSizes(Array(cols).fill(1)), [cols]);
  useEffect(() => setRowSizes(Array(rows).fill(1)), [rows]);

  const startDrag =
    (axis: "col" | "row", index: number) => (e: ReactPointerEvent) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const horizontal = axis === "col";
      const total = horizontal ? rect.width : rect.height;
      if (total <= 0) return;

      const sizes = horizontal ? colSizes : rowSizes;
      const setSizes = horizontal ? setColSizes : setRowSizes;
      const sumFr = sizes.reduce((a, b) => a + b, 0);
      const startPos = horizontal ? e.clientX : e.clientY;
      const a0 = sizes[index];
      const pairSum = a0 + sizes[index + 1];
      const min = MIN_RATIO * sumFr;

      const onMove = (ev: PointerEvent) => {
        const pos = horizontal ? ev.clientX : ev.clientY;
        const deltaFr = ((pos - startPos) / total) * sumFr;
        const a = Math.max(min, Math.min(pairSum - min, a0 + deltaFr));
        const next = [...sizes];
        next[index] = a;
        next[index + 1] = pairSum - a;
        setSizes(next);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.userSelect = "";
      };
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

  const sumCols = colSizes.reduce((a, b) => a + b, 0);
  const sumRows = rowSizes.reduce((a, b) => a + b, 0);
  const cumPct = (arr: number[], i: number, sum: number) =>
    (arr.slice(0, i + 1).reduce((a, b) => a + b, 0) / sum) * 100;

  const dividers: DividerProps[] = [];
  for (let i = 0; i < cols - 1; i++) {
    dividers.push({
      key: `v${i}`,
      className: "split-divider split-divider-v",
      style: { left: `${cumPct(colSizes, i, sumCols)}%` },
      onPointerDown: startDrag("col", i),
    });
  }
  for (let i = 0; i < rows - 1; i++) {
    dividers.push({
      key: `h${i}`,
      className: "split-divider split-divider-h",
      style: { top: `${cumPct(rowSizes, i, sumRows)}%` },
      onPointerDown: startDrag("row", i),
    });
  }

  return {
    stageRef,
    gridTemplateColumns: colSizes.map((s) => `${s}fr`).join(" "),
    gridTemplateRows: rowSizes.map((s) => `${s}fr`).join(" "),
    dividers,
  };
}
