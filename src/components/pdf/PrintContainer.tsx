"use client";
import React, { forwardRef } from "react";

const PrintContainer = forwardRef<HTMLDivElement, {}>(function PrintContainer(_props: {}, ref: React.Ref<HTMLDivElement>) {
  return <div id="print-container" ref={ref} />;
});

export default PrintContainer;
