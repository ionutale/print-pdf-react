"use client";
import React, { useEffect, useRef, useState } from "react";
import type { Tool } from "./Toolbar";

export type Annotation =
  | { id: string; type: "rect" | "ellipse"; x: number; y: number; w: number; h: number; color: string; page: number }
  | { id: string; type: "text"; x: number; y: number; text: string; color: string; page: number }
  | { id: string; type: "image"; x: number; y: number; w: number; h: number; src: string; page: number };

type Props = {
  tool: Tool;
  page: number;
  annotations: Annotation[];
  setAnnotations: (fn: (prev: Annotation[]) => Annotation[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

export default function AnnotationOverlay({ tool, page, annotations, setAnnotations, canvasRef }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (!overlayRef.current || !canvasRef.current) return;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    const size = () => {
      overlay.style.width = `${canvas.width}px`;
      overlay.style.height = `${canvas.height}px`;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [canvasRef]);

  const toLocal = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.MouseEvent) => {
    if (tool === "select") return;
    const p = toLocal(e);
    setDrag(p);
    if (tool === "text") {
      const id = crypto.randomUUID();
      setAnnotations((prev) => prev.concat({ id, type: "text", x: p.x, y: p.y, text: "Edit", color: "#111827", page }));
    } else if (tool === "rect" || tool === "ellipse") {
      const id = crypto.randomUUID();
      setDraftId(id);
      setAnnotations((prev) => prev.concat({ id, type: tool, x: p.x, y: p.y, w: 1, h: 1, color: "#ef4444", page } as Annotation));
    }
  };

  const onMove = (e: React.MouseEvent) => {
    if (!drag || !draftId) return;
    const p = toLocal(e);
    const w = Math.max(1, p.x - drag.x);
    const h = Math.max(1, p.y - drag.y);
    setAnnotations((prev) => prev.map((a) => (a.id === draftId && "w" in a ? { ...a, w, h } : a)));
  };

  const onUp = () => {
    setDrag(null);
    setDraftId(null);
  };

  const onTextChange = (id: string, v: string) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id && a.type === "text" ? { ...a, text: v } : a)));
  };

  const items = annotations.filter((a) => a.page === page);

  return (
    <div
      ref={overlayRef}
      className="absolute top-0 left-0 pointer-events-auto z-10"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
    >
      {items.map((a) => {
        if (a.type === "text") {
          return (
            <input
              key={a.id}
              value={a.text}
              onChange={(e) => onTextChange(a.id, e.target.value)}
              className="absolute bg-transparent text-gray-900 outline-none border-b border-dashed border-gray-300"
              style={{ left: a.x, top: a.y, width: Math.max(40, a.text.length * 8) }}
            />
          );
        }
        if (a.type === "image") {
          return (
            <img
              key={a.id}
              src={a.src}
              className="absolute select-none"
              style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
              alt="annotation"
            />
          );
        }
        const base = {
          position: "absolute" as const,
          left: a.x,
          top: a.y,
          width: (a as any).w,
          height: (a as any).h,
          border: `2px solid ${a.color}`,
          background: "transparent",
        };
        return <div key={a.id} style={base} className={a.type === "ellipse" ? "rounded-full" : ""} />;
      })}
    </div>
  );
}
