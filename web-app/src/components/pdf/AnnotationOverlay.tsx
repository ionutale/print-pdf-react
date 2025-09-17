"use client";
import React, { useEffect, useRef, useState } from "react";
import type { Tool } from "./Toolbar";

export type Annotation =
  | { id: string; type: "rect" | "ellipse"; x: number; y: number; w: number; h: number; color: string; stroke?: number; page: number }
  | { id: string; type: "text"; x: number; y: number; text: string; color: string; size?: number; page: number }
  | { id: string; type: "image"; x: number; y: number; w: number; h: number; src: string; page: number };

type Props = {
  tool: Tool;
  page: number;
  annotations: Annotation[];
  setAnnotations: (fn: (prev: Annotation[]) => Annotation[]) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  snapEnabled?: boolean;
  snapSize?: number;
  defaultColor?: string;
  defaultStroke?: number;
  defaultTextSize?: number;
};

export default function AnnotationOverlay({ tool, page, annotations, setAnnotations, canvasRef, selectedId, setSelectedId, snapEnabled = false, snapSize = 8, defaultColor = "#ef4444", defaultStroke = 2, defaultTextSize = 14 }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [moving, setMoving] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: "nw"|"n"|"ne"|"e"|"se"|"s"|"sw"|"w"; start: { x: number; y: number; w: number; h: number; px: number; py: number; keepRatio: boolean } } | null>(null);

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
  const snap = (v: number) => (snapEnabled ? Math.round(v / snapSize) * snapSize : v);

  const onDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const annId = target.dataset.aid;
    const handle = target.dataset.handle as any;
    if (tool === "select") {
      if (annId && !handle) {
        setSelectedId(annId);
        const a = annotations.find((x) => x.id === annId);
        if (a && (a as any).w !== undefined) setMoving({ id: a.id, offsetX: toLocal(e).x - a.x, offsetY: toLocal(e).y - a.y });
      } else if (annId && handle === "se") {
        setSelectedId(annId);
        const a = annotations.find((x) => x.id === annId) as any;
        if (a) setResizing({ id: annId, handle: "se", start: { x: a.x, y: a.y, w: a.w, h: a.h, px: toLocal(e).x, py: toLocal(e).y, keepRatio: e.shiftKey } });
      } else if (annId && ["nw","n","ne","e","s","sw","w"].includes(handle)) {
        setSelectedId(annId);
        const a = annotations.find((x) => x.id === annId) as any;
        if (a) setResizing({ id: annId, handle, start: { x: a.x, y: a.y, w: a.w, h: a.h, px: toLocal(e).x, py: toLocal(e).y, keepRatio: e.shiftKey } });
      } else {
        setSelectedId(null);
      }
      return;
    }
    const p = toLocal(e);
    setDrag(p);
    if (tool === "text") {
      const id = crypto.randomUUID();
      setAnnotations((prev) => prev.concat({ id, type: "text", x: p.x, y: p.y, text: "Edit", color: defaultColor || "#111827", size: defaultTextSize, page }));
    } else if (tool === "rect" || tool === "ellipse") {
      const id = crypto.randomUUID();
      setDraftId(id);
      setAnnotations((prev) => prev.concat({ id, type: tool, x: p.x, y: p.y, w: 1, h: 1, color: defaultColor || "#ef4444", stroke: defaultStroke, page } as Annotation));
    }
  };

  const onMove = (e: React.MouseEvent) => {
    const p = toLocal(e);
    if (moving) {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === moving.id && "w" in a ? { ...a, x: snap(p.x - moving.offsetX), y: snap(p.y - moving.offsetY) } : a.id === moving.id && a.type === "text" ? { ...a, x: snap(p.x - moving.offsetX), y: snap(p.y - moving.offsetY) } : a))
      );
      return;
    }
    if (resizing) {
      const { start, handle } = resizing;
      const dx = p.x - start.px;
      const dy = p.y - start.py;
      let x = start.x;
      let y = start.y;
      let w = start.w;
      let h = start.h;
      const applyRatio = (ww: number, hh: number) => {
        const ratio = start.w / start.h || 1;
        if (start.keepRatio) {
          if (Math.abs(ww) > Math.abs(hh)) hh = ww / ratio; else ww = hh * ratio;
        }
        return { ww, hh };
      };
      switch (handle) {
        case "se": {
          let { ww, hh } = applyRatio(w + dx, h + dy);
          w = Math.max(10, ww); h = Math.max(10, hh);
          break;
        }
        case "e": {
          let { ww } = applyRatio(w + dx, h); w = Math.max(10, ww); break;
        }
        case "s": {
          let { hh } = applyRatio(w, h + dy); h = Math.max(10, hh); break;
        }
        case "nw": {
          let nx = x + dx; let ny = y + dy; let { ww, hh } = applyRatio(w - dx, h - dy);
          w = Math.max(10, ww); h = Math.max(10, hh); x = nx; y = ny; break;
        }
        case "n": {
          let ny = y + dy; let { hh } = applyRatio(w, h - dy); h = Math.max(10, hh); y = ny; break;
        }
        case "w": {
          let nx = x + dx; let { ww } = applyRatio(w - dx, h); w = Math.max(10, ww); x = nx; break;
        }
        case "ne": {
          let ny = y + dy; let { ww, hh } = applyRatio(w + dx, h - dy); w = Math.max(10, ww); h = Math.max(10, hh); y = ny; break;
        }
        case "sw": {
          let nx = x + dx; let { ww, hh } = applyRatio(w - dx, h + dy); w = Math.max(10, ww); h = Math.max(10, hh); x = nx; break;
        }
      }
      setAnnotations((prev) => prev.map((a) => (a.id === resizing.id && "w" in a ? { ...a, x: snap(x), y: snap(y), w: snap(w), h: snap(h) } : a)));
      return;
    }
    if (!drag || !draftId) return;
    const w = Math.max(1, p.x - drag.x);
    const h = Math.max(1, p.y - drag.y);
    setAnnotations((prev) => prev.map((a) => (a.id === draftId && "w" in a ? { ...a, w: snap(w), h: snap(h) } : a)));
  };

  const onUp = () => {
    setDrag(null);
    setDraftId(null);
    setMoving(null);
    setResizing(null);
  };

  const onTextChange = (id: string, v: string) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id && a.type === "text" ? { ...a, text: v } : a)));
  };

  const items = annotations.filter((a) => a.page === page);

  return (
    <div
      ref={overlayRef}
      className={"absolute top-0 left-0 pointer-events-auto z-10 " + (snapEnabled ? "bg-[length:8px_8px] [background-image:repeating-linear-gradient(0deg,transparent,transparent_7px,#f3f4f6_7px,#f3f4f6_8px),repeating-linear-gradient(90deg,transparent,transparent_7px,#f3f4f6_7px,#f3f4f6_8px)]" : "")}
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
              className="absolute bg-transparent outline-none border-b border-dashed border-gray-300"
              style={{ left: a.x, top: a.y, width: Math.max(40, a.text.length * 8), color: a.color, fontSize: (a.size ?? defaultTextSize) }}
              data-aid={a.id}
            />
          );
        }
        if (a.type === "image") {
          return (
            <img
              key={a.id}
              src={a.src}
              className={"absolute select-none " + (selectedId === a.id ? "ring-2 ring-indigo-500" : "")}
              style={{ left: a.x, top: a.y, width: a.w, height: a.h }}
              data-aid={a.id}
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
          border: `${(a as any).stroke ?? defaultStroke}px solid ${a.color}`,
          background: "transparent",
        };
        const handles = [
          { key: "nw", style: { left: -6, top: -6, cursor: "nwse-resize" } },
          { key: "n", style: { left: "50%", top: -6, transform: "translateX(-50%)", cursor: "ns-resize" } },
          { key: "ne", style: { right: -6, top: -6, cursor: "nesw-resize" } },
          { key: "e", style: { right: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
          { key: "se", style: { right: -6, bottom: -6, cursor: "nwse-resize" } },
          { key: "s", style: { left: "50%", bottom: -6, transform: "translateX(-50%)", cursor: "ns-resize" } },
          { key: "sw", style: { left: -6, bottom: -6, cursor: "nesw-resize" } },
          { key: "w", style: { left: -6, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
        ];
        return (
          <div key={a.id} style={base} className={(a.type === "ellipse" ? "rounded-full " : "") + (selectedId === a.id ? "ring-2 ring-indigo-500 " : "")} data-aid={a.id}>
            {selectedId === a.id && "w" in a &&
              handles.map((h) => (
                <div
                  key={h.key}
                  data-aid={a.id}
                  data-handle={h.key}
                  className="absolute w-3 h-3 bg-white border border-indigo-500 rounded-sm"
                  style={h.style as any}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
