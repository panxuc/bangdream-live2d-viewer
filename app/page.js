"use client";

import * as PIXI from "pixi.js";
import { Live2DCanvas } from "./components/Live2DCanvas";
import { CharacterSelect } from "./components/CharacterSelect";
import { ModelSelect } from "./components/ModelSelect";
import { MotionSelect } from "./components/MotionSelect";
import { ExpressionSelect } from "./components/ExpressionSelect";
import { SaveButton } from "./components/SaveButton";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// 引入 Skull 图标
import { Star, Settings, Moon, Sun, Download, Plus, Trash2, Layers, Move, Sparkles, RotateCcw, Skull } from "lucide-react";

// SimpleSlider 组件
const SimpleSlider = ({ value, min, max, step, onChange, label, disabled, defaultValue }) => (
  <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span className="font-bold uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) return;
            onChange(val);
          }}
          disabled={disabled}
          className="w-16 h-6 px-1 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:border-[#E5004F] focus:outline-none transition-colors"
        />
        <button
          onClick={() => onChange(defaultValue)}
          disabled={disabled || value === defaultValue}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${value !== defaultValue ? 'text-[#E5004F]' : 'text-gray-300 dark:text-gray-600 cursor-default'}`}
          title={`重置为 ${defaultValue}`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#E5004F] hover:accent-[#ff4785] transition-all"
    />
  </div>
);

export default function Home() {
  const [models, setModels] = useState([
    {
      id: "default-1",
      characterId: null,
      modelId: null,
      modelData: null,
      motion: null,
      expression: null,
      borrowedModelId: null,
      x: 0,
      y: 0,
      scale: 0.25,
      isModified: false,
      isHeadless: false, // 初始化状态
      isVisible: true
    }
  ]);

  const [activeModelId, setActiveModelId] = useState("default-1");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [isBatching, setIsBatching] = useState(false);
  const canvasRef = useRef();

  const activeModel = useMemo(() =>
    models.find(m => m.id === activeModelId) || models[0]
    , [models, activeModelId]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.PIXI = PIXI;
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const updateActiveModel = useCallback((updates) => {
    setModels(prev => prev.map(m =>
      m.id === activeModelId ? { ...m, ...updates } : m
    ));
  }, [activeModelId]);

  const handleAddModel = () => {
    if (models.length >= 6) return;
    const newId = `model-${Date.now()}`;
    const newModel = {
      id: newId,
      characterId: null,
      modelId: null,
      modelData: null,
      motion: null,
      expression: null,
      borrowedModelId: null,
      x: 0,
      y: 0,
      scale: 0.25,
      isModified: false,
      isHeadless: false,
      isVisible: true
    };
    setModels(prev => [...prev, newModel]);
    setActiveModelId(newId);
  };

  const handleRemoveModel = (idToRemove) => {
    if (models.length <= 1) return;
    setModels(prev => {
      const filtered = prev.filter(m => m.id !== idToRemove);
      if (idToRemove === activeModelId) {
        setActiveModelId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const handleCharacterSelect = useCallback((value) => {
    updateActiveModel({
      characterId: value === "none" ? null : value,
      modelId: null,
      modelData: null,
      motion: null,
      expression: null,
      borrowedModelId: null
    });
  }, [updateActiveModel]);

  const handleModelSelect = useCallback((value) => {
    updateActiveModel({
      modelId: value === "none" ? null : value,
      modelData: null,
      motion: null,
      expression: null,
      borrowedModelId: null
    });
  }, [updateActiveModel]);

  const handleModelLoad = useCallback((data) => {
    updateActiveModel({ modelData: data });
  }, [updateActiveModel]);

  const handleMotionSelect = useCallback((value) => {
    updateActiveModel({ motion: value === "none" ? null : value });
  }, [updateActiveModel]);

  // 动作覆盖逻辑
  const handleMotionOverride = useCallback(async (sourceCharId, sourceModelId) => {
    if (!sourceCharId || !sourceModelId) {
      updateActiveModel({ customModelData: null, motion: null, borrowedModelId: null });
      return;
    }
    try {
      const currentModelId = activeModel.modelId;
      if (!currentModelId) return;

      const isModified = activeModel.isModified;
      const targetBaseUrl = isModified ? `/api/charam/${currentModelId}/` : `/api/chara/${currentModelId}/`;
      const targetDataUrl = isModified ? `/api/charam/${currentModelId}/buildData.asset` : `/api/chara/${currentModelId}/buildData.asset`;
      const sourceDataUrl = `/api/chara/${sourceModelId}/buildData.asset`;
      const sourceBaseUrl = `/api/chara/${sourceModelId}/`;

      const [targetRes, sourceRes] = await Promise.all([
        fetch(targetDataUrl),
        fetch(sourceDataUrl)
      ]);

      if (!targetRes.ok || !sourceRes.ok) throw new Error("Failed to fetch model data");

      const targetJson = await targetRes.json();
      const sourceJson = await sourceRes.json();

      const processedMotions = {};
      if (sourceJson.motions) {
        Object.keys(sourceJson.motions).forEach(groupName => {
          processedMotions[groupName] = sourceJson.motions[groupName].map(motion => {
            const newMotion = { ...motion };
            if (newMotion.file) {
              newMotion.file = new URL(newMotion.file, window.location.origin + sourceBaseUrl).href;
            }
            if (newMotion.sound) {
              newMotion.sound = new URL(newMotion.sound, window.location.origin + sourceBaseUrl).href;
            }
            return newMotion;
          });
        });
      }

      const hybridModelData = {
        ...targetJson,
        url: targetBaseUrl,
        motions: processedMotions
      };

      updateActiveModel({
        customModelData: hybridModelData,
        modelData: hybridModelData,
        motion: null,
        borrowedModelId: sourceModelId
      });
      console.log(`Motion override applied: ${sourceModelId} -> ${currentModelId}`);
    } catch (error) {
      console.error("Motion override failed:", error);
    }
  }, [activeModel.modelId, activeModel.isModified, updateActiveModel]);

  const handleExpressionSelect = useCallback((value) => {
    updateActiveModel({ expression: value === "none" ? null : value });
  }, [updateActiveModel]);

  const handleModelReload = useCallback(() => {
    setModels(prev => prev.map(m => ({
      ...m,
      motion: null,
      expression: null,
      reloadKey: (m.reloadKey || 0) + 1
    })));
  }, []);

  const handleTransformChange = (key, value) => {
    updateActiveModel({ [key]: value });
  };

  const handleModifiedChange = useCallback((checked) => {
    updateActiveModel({
      isModified: checked,
      modelId: null,
      modelData: null,
      motion: null,
      expression: null,
      borrowedModelId: null
    });
  }, [updateActiveModel]);

  // 处理去头开关
  const handleHeadlessChange = useCallback(() => {
    updateActiveModel({ isHeadless: !activeModel.isHeadless });
  }, [activeModel.isHeadless, updateActiveModel]);

  const BRAND_PINK = "#E5004F";

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-[#E5004F] selection:text-white ${isDarkMode ? 'bg-[#1a101f]' : 'bg-[#fff5f8]'}`}>
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-30'}`} style={{ backgroundImage: `radial-gradient(${BRAND_PINK} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
        <div className="absolute -top-20 -left-20 text-[#E5004F]/10 animate-pulse-slow"> <Star size={400} fill="currentColor" /> </div>
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-gradient-to-tl from-[#E5004F]/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#E5004F]/10 bg-white/70 dark:bg-[#1a101f]/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#E5004F] blur-lg opacity-40 rounded-full group-hover:opacity-60 transition-opacity"></div>
                <img src="/favicon.ico" alt="Logo" className="relative h-10 w-10 drop-shadow-md transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E5004F] to-[#ff4785]" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>BanG Dream!</h1>
                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">Live2D Viewer</span>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="relative p-2 rounded-full overflow-hidden group transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {isDarkMode ? (<Moon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" fill="currentColor" />) : (<Sun className="w-6 h-6 text-[#E5004F]" />)}
            </button>
          </div>
        </div>
      </header>

      <main className="container relative z-10 mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[320px_1fr_280px] md:grid-cols-1 gap-6 items-start max-w-[1600px] mx-auto">
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"> <Layers className="w-4 h-4 text-[#E5004F]" /> <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">图层列表 ({models.length}/6)</h3> </div>
                <button onClick={handleAddModel} disabled={models.length >= 6 || isBatching} className={`p-1.5 rounded-lg transition-all ${models.length >= 6 || isBatching ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' : 'bg-[#E5004F]/10 text-[#E5004F] hover:bg-[#E5004F] hover:text-white'}`} title={models.length >= 6 ? "已达到最大图层数" : "添加模型"}> <Plus className="w-4 h-4" /> </button>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                {models.map((model, index) => (
                  <div key={model.id} onClick={() => !isBatching && setActiveModelId(model.id)} className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all group ${isBatching ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${model.id === activeModelId ? 'bg-white dark:bg-gray-800 border-[#E5004F] shadow-sm border' : 'border border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500">{index + 1}</span>
                      <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                        {model.modelId ? model.modelId : (model.characterId ? `Chara ${model.characterId}` : 'Empty Slot')}
                        {model.isModified && <span className="ml-1 text-[10px] text-[#E5004F]">(M)</span>}
                        {model.borrowedModelId && <span className="ml-1 text-[10px] text-blue-500">+{model.borrowedModelId}</span>}
                        {model.isHeadless && <span className="ml-1 text-[10px] text-purple-500">(H)</span>}
                      </span>
                    </div>
                    {models.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveModel(model.id); }} disabled={isBatching} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent" title="删除图层"> <Trash2 className="w-3.5 h-3.5" /> </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-[#E5004F]/10 transition-shadow duration-500 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E5004F]"></div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2"> <Settings className="w-5 h-5 text-[#E5004F]" /> <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">编辑图层 #{models.findIndex(m => m.id === activeModelId) + 1}</h2> </div>
                {models.length > 1 && (
                  <button onClick={() => handleRemoveModel(activeModelId)} disabled={isBatching} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="删除当前图层"> <Trash2 className="w-4 h-4" /> </button>
                )}
              </div>

              <div className="space-y-5">
                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Character</label>
                  <CharacterSelect onSelect={handleCharacterSelect} value={activeModel.characterId} disabled={isBatching} />
                </div>

                <div className="control-group">
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">Costume Settings</label>
                    <div className="flex items-center gap-2">
                      {/* 去头开关 */}
                      <button onClick={() => !isBatching && handleHeadlessChange()} disabled={isBatching} className={`transition-all duration-300 transform active:scale-95 flex items-center gap-1 ${activeModel.isHeadless ? 'text-purple-500 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'} ${isBatching ? 'opacity-50 cursor-not-allowed' : ''}`} title={activeModel.isHeadless ? "显示头部" : "隐藏头部 (仅适用新画风)"}>
                        <Skull className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="text-gray-200 dark:text-gray-700">|</span>
                      {/* 改模开关 */}
                      <button onClick={() => !isBatching && handleModifiedChange(!activeModel.isModified)} disabled={isBatching} className={`transition-all duration-300 transform active:scale-95 ${activeModel.isModified ? 'text-[#E5004F] drop-shadow-sm' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'} ${isBatching ? 'opacity-50 cursor-not-allowed' : ''}`} title={activeModel.isModified ? "禁用改模" : "启用改模"}>
                        <Sparkles className="w-3.5 h-3.5" fill={activeModel.isModified ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  <ModelSelect characterId={activeModel.characterId} onSelect={handleModelSelect} isModified={activeModel.isModified} value={activeModel.modelId} onReload={handleModelReload} disabled={isBatching} />
                </div>

                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Motion</label>
                  <MotionSelect
                    modelData={activeModel.modelData}
                    onSelect={handleMotionSelect}
                    value={activeModel.motion}
                    disabled={isBatching}
                    onMotionOverride={handleMotionOverride}
                  />
                </div>

                <div className="control-group">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">Expression</label>
                  <ExpressionSelect modelData={activeModel.modelData} onSelect={handleExpressionSelect} value={activeModel.expression} disabled={isBatching} />
                </div>

                {activeModel.modelId && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="flex items-center gap-2 mb-2"> <Move className="w-4 h-4 text-[#E5004F]" /> <span className="text-xs font-bold text-gray-400 uppercase">Transform</span> </div>
                    <SimpleSlider label="X Offset" min={-400} max={400} step={1} value={activeModel.x} onChange={(v) => handleTransformChange('x', v)} disabled={isBatching} defaultValue={0} />
                    <SimpleSlider label="Y Offset" min={-400} max={400} step={1} value={activeModel.y} onChange={(v) => handleTransformChange('y', v)} disabled={isBatching} defaultValue={0} />
                    <SimpleSlider label="Scale" min={0.1} max={1.0} step={0.05} value={activeModel.scale} onChange={(v) => handleTransformChange('scale', v)} disabled={isBatching} defaultValue={0.25} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-4xl aspect-[3/4] md:aspect-video lg:aspect-square xl:aspect-[4/3] group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#E5004F] via-yellow-400 to-[#4338ca] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative h-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-white/60 dark:border-gray-700/50 rounded-[1.8rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="h-8 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-800/50 flex items-center px-4 space-x-2 justify-between">
                  <div className="flex space-x-2"> <div className="w-2 h-2 rounded-full bg-[#E5004F]"></div> <div className="w-2 h-2 rounded-full bg-yellow-400"></div> <div className="w-2 h-2 rounded-full bg-blue-400"></div> </div>
                  <div className="text-[10px] font-mono text-gray-400 opacity-50">{models.filter(m => m.modelId).length} Active Model(s)</div>
                </div>
                <div className="flex-1 relative">
                  <Live2DCanvas ref={canvasRef} models={models} onModelLoad={handleModelLoad} isDarkMode={isDarkMode} backgroundColor={backgroundColor} />
                  {!models.some(m => m.modelId) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none"></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-yellow-400"></div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <Download className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">保存图片</h2>
              </div>
              <div className="space-y-4">
                <div className="pt-2">
                  <SaveButton
                    modelData={activeModel.modelData}
                    selectedModel={activeModel.modelId}
                    selectedMotion={activeModel.motion}
                    selectedExpression={activeModel.expression}
                    borrowedModelId={activeModel.borrowedModelId}
                    canvasRef={canvasRef}
                    backgroundColor={backgroundColor}
                    onBackgroundColorChange={setBackgroundColor}
                    onReload={handleModelReload}
                    onBatchStatusChange={setIsBatching}
                  />
                </div>
              </div>
            </div>
            <div className="text-center opacity-40">
              <p className="text-[10px] uppercase font-bold tracking-widest">Unofficial Fan Project</p>
              <p className="text-[10px] uppercase font-bold tracking-widest">No Commercial Use</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
