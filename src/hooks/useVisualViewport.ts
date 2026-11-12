"use client";

import { useEffect, useState } from "react";

export function useVisualViewportBottom(defaultBottom = 0) {
  const [bottom, setBottom] = useState(defaultBottom);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setBottom(gap);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return bottom;
}
