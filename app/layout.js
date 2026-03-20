import "./globals.css";

export const metadata = {
  title: {
    default: "BanG Dream! Live2D / Spine 查看器",
    template: "%s | BanG Dream! Live2D / Spine 查看器",
  },
  description: "面向 BanG Dream! 相关角色资源的在线查看与导出工具，支持 Live2D 与 Spine 模型的加载、预览与图片导出。便于制作 NGA 安科差分。",
  applicationName: "BanG Dream! Live2D / Spine 查看器",
  keywords: ["BanG Dream!", "Live2D", "Spine", "Viewer", "角色预览", "立绘导出"],
  openGraph: {
    title: "BanG Dream! Live2D / Spine 查看器",
    description: "支持 Live2D 与 Spine 模型的加载、预览与图片导出。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
