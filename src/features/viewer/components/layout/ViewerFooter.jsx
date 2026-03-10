"use client";

import { EXTERNAL_URLS } from "@/src/config/urls";

export function ViewerFooter() {
  return (
    <div className="w-full max-w-[min(100%,112rem)] mx-auto pt-8 pb-2 text-center opacity-55 dark:opacity-65">
      <p className="text-[10px] uppercase font-bold tracking-widest">非官方粉丝项目</p>
      <p className="text-[10px] uppercase font-bold tracking-widest">禁止商业用途</p>
      <a
        href={EXTERNAL_URLS.bestdoriSupport}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-[10px] font-bold tracking-widest text-[#E5004F] hover:underline"
      >
        支持 Bestdori!
      </a>
    </div>
  );
}
