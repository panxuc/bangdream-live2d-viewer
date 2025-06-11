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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvasRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.PIXI = PIXI;
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      <div className="flex items-center justify-between w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center">BanG Dream! Live2D 查看器</h1>
        <label className="flex items-center cursor-pointer">
          <span className="mr-2">深色模式</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
            />
            <div className={`block w-14 h-8 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isDarkMode ? 'transform translate-x-6' : ''}`}></div>
          </div>
        </label>
      </div>
      <main className="flex w-full justify-center items-center gap-8 row-start-2">
        {/* Left sidebar: selectors */}
        <div className="flex flex-col space-y-4">
          <CharacterSelect onSelect={handleCharacterSelect} value={selectedCharacter} />
          <ModelSelect characterId={selectedCharacter} onSelect={handleModelSelect} isDarkMode={isDarkMode} value={selectedModel} />
          <MotionSelect modelData={modelData} onSelect={handleMotionSelect} value={selectedMotion} />
          <ExpressionSelect modelData={modelData} onSelect={handleExpressionSelect} value={selectedExpression} />
        </div>

        {/* Center: Live2D canvas */}
        <Live2DCanvas
          ref={canvasRef}
          selectedModel={selectedModel}
          onModelLoad={handleModelLoad}
          selectedExpression={selectedExpression}
          selectedMotion={selectedMotion}
          isDarkMode={isDarkMode}
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
