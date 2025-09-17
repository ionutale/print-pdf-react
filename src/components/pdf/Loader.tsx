"use client";
import React from "react";

export default function Loader({ hidden = false }: { hidden?: boolean }) {
  return (
    <div id="loader" className={(hidden ? "hidden" : "") + " animate-spin rounded-full h-16 w-16 border-b-2 border-primary"} />
  );
}
