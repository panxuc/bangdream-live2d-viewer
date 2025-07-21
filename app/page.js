"use client";

import * as PIXI from "pixi.js";
import { Live2DCanvas } from "./components/Live2DCanvas";
import { CharacterSelect } from "./components/CharacterSelect";
import { ModelSelect } from "./components/ModelSelect";
import { MotionSelect } from "./components/MotionSelect";
import { ExpressionSelect } from "./components/ExpressionSelect";
import { SaveButton } from "./components/SaveButton";
import { useState, useEffect, useRef, useCallback } from "react";

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

  const handleCharacterSelect = useCallback((value) => {
    setSelectedCharacter(value === "none" ? null : value);
    setSelectedModel(null);
    setModelData(null);
    setSelectedMotion(null);
    setSelectedExpression(null);
  }, []);

  const handleModelSelect = useCallback((value) => {
    setSelectedModel(value === "none" ? null : value);
    setModelData(null);
    setSelectedMotion(null);
    setSelectedExpression(null);
  }, []);

  const handleModelLoad = useCallback((data) => {
    setModelData(data);
  }, []);

  const handleMotionSelect = useCallback((value) => {
    setSelectedMotion(value === "none" ? null : value);
  }, []);

  const handleExpressionSelect = useCallback((value) => {
    setSelectedExpression(value === "none" ? null : value);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                BanG Dream! Live2D 查看器
              </h1>
            </div>
            <label className="flex items-center cursor-pointer group">
              <span className="mr-3 text-sm font-medium">深色模式</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
                <div className={`block w-14 h-7 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300 dark:bg-gray-600'} group-hover:shadow-lg`}></div>
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all duration-300 shadow-md ${isDarkMode ? 'transform translate-x-7' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px_1fr_260px] md:grid-cols-1 gap-4 md:gap-8 items-start max-w-7xl mx-auto">
          {/* Left Panel: Controls */}
          <div className="lg:sticky lg:top-24 animate-fade-in">
            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in">
              <h2 className="text-lg font-semibold text-foreground/90 border-b pb-2">🎮 模型控制</h2>
              <div className="space-y-4">
                <CharacterSelect onSelect={handleCharacterSelect} value={selectedCharacter} />
                <ModelSelect characterId={selectedCharacter} onSelect={handleModelSelect} isDarkMode={isDarkMode} value={selectedModel} />
                <MotionSelect modelData={modelData} onSelect={handleMotionSelect} value={selectedMotion} />
                <ExpressionSelect modelData={modelData} onSelect={handleExpressionSelect} value={selectedExpression} />
              </div>
            </div>
          </div>

          {/* Center: Live2D Viewer */}
          <div className="flex justify-center animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="bg-card/30 backdrop-blur-sm border rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
              <Live2DCanvas
                ref={canvasRef}
                selectedModel={selectedModel}
                onModelLoad={handleModelLoad}
                selectedExpression={selectedExpression}
                selectedMotion={selectedMotion}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>

          {/* Right Panel: Export */}
          <div className="lg:sticky lg:top-24 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in">
              <h2 className="text-lg font-semibold text-foreground/90 border-b pb-2">📥 导出设置</h2>
              <SaveButton 
                modelData={modelData}
                selectedModel={selectedModel}
                selectedMotion={selectedMotion}
                selectedExpression={selectedExpression}
                canvasRef={canvasRef}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
