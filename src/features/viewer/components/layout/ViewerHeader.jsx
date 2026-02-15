"use client";

import { Moon, Sun } from "lucide-react";
import { HelpSheet } from "./HelpSheet";

export function ViewerHeader({ isDarkMode, onToggleDarkMode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md shadow-sm dark:bg-[#1f1c25]/90 dark:border-white/10">
      <div className="container mx-auto px-5 py-3.5 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Logo" className="h-9 w-9 rounded-lg ring-1 ring-black/10 dark:ring-white/15" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-[#E5004F]" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
                BanG Dream!
              </h1>
              <span className="text-[11px] font-medium tracking-[0.12em] text-gray-500 uppercase dark:text-gray-400">Live2D 查看器</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HelpSheet />
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg border border-black/10 bg-white text-[#E5004F] transition-colors hover:bg-[#E5004F]/5 dark:bg-[#2a2732] dark:border-white/10"
              title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
            >
              {isDarkMode ? <Moon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" fill="currentColor" /> : <Sun className="w-6 h-6 text-[#E5004F]" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
