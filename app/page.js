"use client";

import * as PIXI from "pixi.js";
import { Live2DCanvas } from "./components/Live2DCanvas";
import { CharacterSelect } from "./components/CharacterSelect";
import { ModelSelect } from "./components/ModelSelect";
import { ExpressionSelect } from "./components/ExpressionSelect";
import { MotionSelect } from "./components/MotionSelect";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [selectedExpression, setSelectedExpression] = useState(null);
  const [selectedMotion, setSelectedMotion] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.PIXI = PIXI;
    }
  }, []);

  const handleCharacterSelect = (value) => {
    setSelectedCharacter(value === "none" ? null : value);
    setSelectedModel(null);
    setModelData(null);
    setSelectedExpression(null);
    setSelectedMotion(null);
  };

  const handleModelSelect = (value) => {
    setSelectedModel(value === "none" ? null : value);
    setModelData(null);
    setSelectedExpression(null);
    setSelectedMotion(null);
  };

  const handleModelLoad = (data) => {
    console.log("Received model data in parent:", data);
    setModelData(data);
  };

  const handleExpressionSelect = (value) => {
    setSelectedExpression(value === "none" ? null : value);
  };

  const handleMotionSelect = (value) => {
    setSelectedMotion(value === "none" ? null : value);
  };

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold text-center mt-8">BanG Dream! Live2D 查看器</h1>
      <main className="flex w-full justify-center items-center gap-8 row-start-2">
        {/* Left sidebar: selectors */}
        <div className="flex flex-col space-y-4">
          <CharacterSelect onSelect={handleCharacterSelect} />
          <ModelSelect characterId={selectedCharacter} onSelect={handleModelSelect} />
          <ExpressionSelect modelData={modelData} onSelect={handleExpressionSelect} />
          <MotionSelect modelData={modelData} onSelect={handleMotionSelect} />
        </div>

        {/* Center: Live2D canvas */}
        <Live2DCanvas
          selectedModel={selectedModel}
          onModelLoad={handleModelLoad}
          selectedExpression={selectedExpression}
          selectedMotion={selectedMotion}
        />

        {/* Right sidebar: output and save */}
        {/* <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">输出图片大小</label>
            <Input
              id="image-size"
              readOnly
              className="w-24"
              placeholder="400×400"
            />
          </div>
          <Button variant="outline" className="w-full">
            保存
          </Button>
        </div> */}
      </main>
    </div>
  );
}
