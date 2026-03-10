import "./globals.css";

export const metadata = {
  title: "BanG Dream! Live2D 查看器",
  description: "BanG Dream! Live2D 查看器",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
