"use client";
import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  pdfDoc: any | null;
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
};

export default function ThumbnailsSidebar({ pdfDoc, currentPage, onSelectPage }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pages = useMemo(() => {
    if (!pdfDoc) return [] as number[];
    return Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
  }, [pdfDoc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc) return;
    const renderThumb = async (num: number) => {
      const existing = container.querySelector<HTMLCanvasElement>(`canvas[data-page="${num}"]`);
      if (existing) return; // already rendered
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: 0.2 });
      const c = document.createElement("canvas");
      c.dataset.page = String(num);
      c.width = viewport.width;
      c.height = viewport.height;
      const ctx = c.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      c.className = "rounded border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400";
      c.onclick = () => onSelectPage(num);
      const wrapper = document.createElement("div");
      wrapper.className = "p-2 flex flex-col items-center gap-1";
      wrapper.appendChild(c);
      const label = document.createElement("div");
      label.textContent = String(num);
      label.className = "text-xs text-gray-600";
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    };
    pages.forEach((n) => void renderThumb(n));
    return () => {
      if (container) container.innerHTML = "";
    };
  }, [pdfDoc, pages, onSelectPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLDivElement>("div.p-2").forEach((wrapper, idx) => {
      const pageNum = idx + 1;
      if (pageNum === currentPage) wrapper.classList.add("bg-indigo-50");
      else wrapper.classList.remove("bg-indigo-50");
    });
  }, [currentPage]);

  return (
    <aside className="w-40 shrink-0 h-[calc(100vh-150px)] overflow-auto bg-white rounded-lg shadow-md p-2">
      <div ref={containerRef} className="grid gap-2">
        {/* thumbnails injected here */}
      </div>
    </aside>
  );
}
