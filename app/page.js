"use client";

import * as PIXI from "pixi.js";
import { Live2DCanvas } from "./components/Live2DCanvas";
import { CharacterSelect } from "./components/CharacterSelect";
import { ModelSelect } from "./components/ModelSelect";
import { MotionSelect } from "./components/MotionSelect";
import { ExpressionSelect } from "./components/ExpressionSelect";
import { SaveButton } from "./components/SaveButton";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedMotion, setSelectedMotion] = useState(null);
  const [selectedExpression, setSelectedExpression] = useState(null);
  const [modelData, setModelData] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.PIXI = PIXI;
    }
  }, []);

  const handleCharacterSelect = (value) => {
    setSelectedCharacter(value === "none" ? null : value);
    setSelectedModel(null);
    setModelData(null);
    setSelectedMotion(null);
    setSelectedExpression(null);
  };

  const handleModelSelect = (value) => {
    setSelectedModel(value === "none" ? null : value);
    setModelData(null);
    setSelectedMotion(null);
    setSelectedExpression(null);
  };

  const handleModelLoad = (data) => {
    setModelData(data);
  };

  const handleMotionSelect = (value) => {
    setSelectedMotion(value === "none" ? null : value);
  };

  const handleExpressionSelect = (value) => {
    setSelectedExpression(value === "none" ? null : value);
  };

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold text-center mt-8">BanG Dream! Live2D 查看器</h1>
      <main className="flex w-full justify-center items-center gap-8 row-start-2">
        {/* Left sidebar: selectors */}
        <div className="flex flex-col space-y-4">
          <CharacterSelect onSelect={handleCharacterSelect} />
          <ModelSelect characterId={selectedCharacter} onSelect={handleModelSelect} />
          <MotionSelect modelData={modelData} onSelect={handleMotionSelect} />
          <ExpressionSelect modelData={modelData} onSelect={handleExpressionSelect} />
        </div>

        {/* Center: Live2D canvas */}
        <Live2DCanvas
          ref={canvasRef}
          selectedModel={selectedModel}
          onModelLoad={handleModelLoad}
          selectedExpression={selectedExpression}
          selectedMotion={selectedMotion}
        />

        {/* Right sidebar: output and save */}
        <div className="flex flex-col space-y-4">
          <SaveButton 
            modelData={modelData}
            selectedModel={selectedModel}
            selectedMotion={selectedMotion}
            selectedExpression={selectedExpression}
            canvasRef={canvasRef}
          />
        </div>
      </main>
    </div>
  );
}
