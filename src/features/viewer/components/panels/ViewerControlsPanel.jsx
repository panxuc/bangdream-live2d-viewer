"use client";

import { useEffect, useRef, useState } from "react";
import { LayerEditorPanel } from "./LayerEditorPanel";
import { LayerListPanel } from "./LayerListPanel";

export function ViewerControlsPanel(props) {
  const controlsLayoutRef = useRef(null);
  const [isWideControlsLayout, setIsWideControlsLayout] = useState(false);
  const [isLayerListExpanded, setIsLayerListExpanded] = useState(false);

  useEffect(() => {
    const node = controlsLayoutRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextIsWide = entry.contentRect.width >= 760;
      setIsWideControlsLayout(nextIsWide);
      if (nextIsWide) {
        setIsLayerListExpanded(true);
      }
    });

    resizeObserver.observe(node);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={controlsLayoutRef}
      className={`lg:sticky lg:top-28 ${isWideControlsLayout ? "grid grid-cols-[320px_minmax(0,1fr)] gap-6 items-start" : "space-y-6"}`}
    >
      <LayerListPanel
        models={props.models}
        activeModelId={props.activeModelId}
        isBatching={props.isBatching}
        maxModels={props.maxModels}
        isWideControlsLayout={isWideControlsLayout}
        isLayerListExpanded={isLayerListExpanded}
        setIsLayerListExpanded={setIsLayerListExpanded}
        setActiveModelId={props.setActiveModelId}
        handleAddModel={props.handleAddModel}
        handleDuplicateModel={props.handleDuplicateModel}
        handleRemoveModel={props.handleRemoveModel}
        handleMoveModel={props.handleMoveModel}
        handleReorderModels={props.handleReorderModels}
      />

      <LayerEditorPanel {...props} />
    </div>
  );
}
