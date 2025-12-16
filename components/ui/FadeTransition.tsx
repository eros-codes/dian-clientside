"use client";

import React from "react";
import { Fade } from "@mui/material";

interface FadeTransitionProps {
  in?: boolean;
  timeout?: number | { enter?: number; exit?: number };
  children: React.ReactNode;
}

export function FadeTransition({ in: inProp = true, timeout = 180, children }: FadeTransitionProps) {
  return (
    <Fade in={inProp} timeout={timeout}>
      <div>{children}</div>
    </Fade>
  );
}
