"use client";
import React, { forwardRef } from "react";

type Props = {
  hidden?: boolean;
};

const PdfCanvas = forwardRef<HTMLCanvasElement, Props>(({ hidden }: Props, ref: React.Ref<HTMLCanvasElement>) => {
  return (
    <canvas
      id="pdf-render"
      ref={ref}
      className={(hidden ? "hidden" : "") + " border border-gray-200 shadow"}
    />
  );
});

PdfCanvas.displayName = "PdfCanvas";

export default PdfCanvas;
