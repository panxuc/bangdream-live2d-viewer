import { EXTERNAL_URLS } from "../../../../config/urls.js";

export function ViewerFooter() {
  return (
    <div className="w-full max-w-[min(100%,112rem)] mx-auto pt-8 pb-2 text-center opacity-55 dark:opacity-65">
      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">本项目为非官方粉丝制作页面，仅供学习、交流与展示使用。</p>
      <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] uppercase">相关角色、素材与商标权利归其各自权利人所有，请勿用于商业用途。</p>
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
