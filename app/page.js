"use client";

import * as PIXI from "pixi.js";
import { Live2DCanvas } from "./components/Live2DCanvas";
import { CharacterSelect } from "./components/CharacterSelect";
import { ModelSelect } from "./components/ModelSelect";
import { MotionSelect } from "./components/MotionSelect";
import { ExpressionSelect } from "./components/ExpressionSelect";
import { SaveButton } from "./components/SaveButton";
import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Sparkles, Music, Settings, Moon, Sun, Download } from "lucide-react"; // 引入图标库增加视觉细节

export default function Home() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedMotion, setSelectedMotion] = useState(null);
  const [selectedExpression, setSelectedExpression] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
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

  // BanG Dream! 标志性粉色
  const BRAND_PINK = "#E5004F";

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-[#E5004F] selection:text-white ${isDarkMode ? 'bg-[#1a101f]' : 'bg-[#fff5f8]'}`}>

      {/* 背景装饰图案 (CSS Pattern) */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-30'}`}
          style={{
            backgroundImage: `radial-gradient(${BRAND_PINK} 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}>
        </div>
        {/* 左上角装饰星 */}
        <div className="absolute -top-20 -left-20 text-[#E5004F]/10 animate-pulse-slow">
          <Star size={400} fill="currentColor" />
        </div>
        {/* 右下角装饰圆 */}
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-gradient-to-tl from-[#E5004F]/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5004F]/10 bg-white/70 dark:bg-[#1a101f]/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#E5004F] blur-lg opacity-40 rounded-full group-hover:opacity-60 transition-opacity"></div>
                <img src="/favicon.ico" alt="Logo" className="relative h-10 w-10 drop-shadow-md transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E5004F] to-[#ff4785]" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
                  BanG Dream!
                </h1>
                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">Live2D Viewer</span>
              </div>
            </div>

            {/* Dark Mode Toggle - Star Style */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative p-2 rounded-full overflow-hidden group transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDarkMode ? (
                <Moon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" fill="currentColor" />
              ) : (
                <Sun className="w-6 h-6 text-[#E5004F]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative z-10 mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[300px_1fr_280px] md:grid-cols-1 gap-6 items-start max-w-[1400px] mx-auto">

          {/* Left Panel: Controls */}
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-[#E5004F]/10 transition-shadow duration-500 relative overflow-hidden group">
              {/* 装饰线条 */}
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E5004F]"></div>

              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Settings className="w-5 h-5 text-[#E5004F]" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Live2D 设置</h2>
              </div>

              <div className="space-y-5">
                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Character</label>
                  <CharacterSelect onSelect={handleCharacterSelect} value={selectedCharacter} />
                </div>
                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Costume</label>
                  <ModelSelect characterId={selectedCharacter} onSelect={handleModelSelect} isDarkMode={isDarkMode} value={selectedModel} />
                </div>
                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Motion</label>
                  <MotionSelect modelData={modelData} onSelect={handleMotionSelect} value={selectedMotion} />
                </div>
                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Expression</label>
                  <ExpressionSelect modelData={modelData} onSelect={handleExpressionSelect} value={selectedExpression} />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Stage / Live2D Viewer */}
          <div className="flex flex-col items-center">
            {/* 舞台光效模拟 */}
            <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-video lg:aspect-square xl:aspect-[4/3] group">
              {/* 背景光晕 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#E5004F] via-yellow-400 to-[#4338ca] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

              <div className="relative h-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-gray-700/50 rounded-[1.8rem] shadow-2xl overflow-hidden flex flex-col">

                {/* 顶部状态栏装饰 */}
                <div className="h-8 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-800/50 flex items-center px-4 space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#E5004F]"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>

                {/* 画布主体 */}
                <div className="flex-1 relative">
                  <Live2DCanvas
                    ref={canvasRef}
                    selectedModel={selectedModel}
                    onModelLoad={handleModelLoad}
                    selectedExpression={selectedExpression}
                    selectedMotion={selectedMotion}
                    isDarkMode={isDarkMode}
                    backgroundColor={backgroundColor}
                  />

                  {/* 如果未选择模型，显示占位符 */}
                  {!selectedModel && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                      <Star className="w-16 h-16 mb-4 opacity-20 animate-bounce" />
                      {/* <p className="text-sm tracking-widest font-medium opacity-50">等待设置</p> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Export & Info */}
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl transition-shadow duration-500 relative overflow-hidden">
              {/* 装饰线条 */}
              <div className="absolute top-0 right-0 w-1 h-full bg-yellow-400"></div>

              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Download className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">保存图片</h2>
              </div>

              <div className="space-y-4">
                {/* <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  调整好姿势和表情，将这一瞬间保存下来吧！
                </p> */}
                <div className="pt-2">
                  <SaveButton
                    modelData={modelData}
                    selectedModel={selectedModel}
                    selectedMotion={selectedMotion}
                    selectedExpression={selectedExpression}
                    canvasRef={canvasRef}
                    backgroundColor={backgroundColor}
                    onBackgroundColorChange={setBackgroundColor}
                  />
                </div>
              </div>
            </div>

            {/* 底部版权风格文字 */}
            <div className="text-center opacity-40">
              <p className="text-[10px] uppercase font-bold tracking-widest">Unofficial Fan Project</p>
              <p className="text-[10px] uppercase font-bold tracking-widest">No Commercial Use</p>
              <p className="text-[10px] mt-1 font-serif italic">
                Powered by{' '}
                <a
                  href="https://bestdori.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E5004F] hover:underline transition-colors border-b border-transparent"
                >
                  Bestdori
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
