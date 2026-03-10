import test from "node:test";
import assert from "node:assert/strict";
import { createInitialViewerLayerState, viewerLayerReducer } from "../src/features/viewer/lib/viewerLayerReducer.mjs";

test("viewerLayerReducer adds and activates a new model", () => {
  const initialState = createInitialViewerLayerState();
  const nextState = viewerLayerReducer(initialState, {
    type: "add_model",
    model: { id: "model-2" },
  });

  assert.equal(nextState.models.length, 2);
  assert.equal(nextState.activeModelId, "model-2");
});

test("viewerLayerReducer removes active model and selects previous tail", () => {
  const populatedState = {
    models: [{ id: "a" }, { id: "b" }, { id: "c" }],
    activeModelId: "b",
  };
  const nextState = viewerLayerReducer(populatedState, {
    type: "remove_model",
    modelId: "b",
  });

  assert.deepEqual(nextState.models.map((model) => model.id), ["a", "c"]);
  assert.equal(nextState.activeModelId, "c");
});

test("viewerLayerReducer reorders models", () => {
  const populatedState = {
    models: [{ id: "a" }, { id: "b" }, { id: "c" }],
    activeModelId: "a",
  };
  const nextState = viewerLayerReducer(populatedState, {
    type: "reorder_models",
    draggedId: "a",
    targetId: "c",
  });

  assert.deepEqual(nextState.models.map((model) => model.id), ["b", "c", "a"]);
});
