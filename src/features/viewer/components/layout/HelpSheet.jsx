"use client";

import {
  BookOpen,
  CircleHelp,
  FolderUp,
  Github,
  Info,
  Link,
  ListTodo,
  MessageCircle,
  Star,
  Tent,
  Wifi,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const sections = [
  {
    id: "info",
    title: "关于本站",
    icon: Info,
    items: [
      [{ icon: Wifi }, "基础模型来自于 ", { type: "link", label: "Bestdori", href: "https://bestdori.com/" }, " 网站的游戏解包资源，本站不定期对相关资源进行备份。"],
      [{ icon: Wifi }, "改模模型大部分来自于社区的用户自制资源。本站仅提供展示功能。"],
      [{ icon: FolderUp }, "本地上传功能支持用户导入自己手头的 Live2D 或 Spine 模型文件，文件不会被上传到服务器，完全在浏览器本地处理。"],
      [{ icon: Info }, "由于 Live2D / Spine 模型的复杂性和多样性，无法保证所有模型都能完美兼容和显示效果良好。"],
      [{ icon: CircleHelp }, "如果你有任何问题或建议，欢迎在 NGA 联系 ", { type: "link", label: "[@各務砂雪]", href: "https://bbs.nga.cn/nuke.php?func=ucp&uid=66691870" }, " 或在 ", { type: "link", label: "此帖", href: "https://bbs.nga.cn/read.php?tid=44612199" }, " 下反馈。"],
    ],
  },
  {
    id: "link",
    title: "链接",
    icon: Link,
    items: [
      [{ icon: Star }, { type: "link", label: "Bestdori", href: "https://bestdori.com/" }],
      [{ icon: MessageCircle }, { type: "link", label: "WebGAL 交流群", href: "https://t.bilibili.com/328261011?comment_on=1&comment_root_id=265078938272&share_tag=s_i&type=2#reply265078938272" }],
      [{ icon: Tent }, { type: "link", label: "邦多礼庇护所", href: "https://tools.shelter.net.cn/" }],
      [{ icon: Github }, { type: "link", label: "KonshinHaoshin/mygoxmujica_archive", href: "https://github.com/KonshinHaoshin/mygoxmujica_archive" }],
    ],
  },
  {
    id: "todo",
    title: "TODO",
    icon: ListTodo,
    items: [
      ["待更新"],
    ],
  },
];

const InlineIcon = ({ icon: Icon }) => (
  <span className="inline-flex items-center align-middle mx-0.5">
    <Icon className="w-3.5 h-3.5 text-[#E5004F]" />
  </span>
);

const isLinkPart = (part) => typeof part === "object" && part?.type === "link" && typeof part?.href === "string";

const isIconPart = (part) => typeof part === "object" && part?.icon;

export function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="px-3 h-10 inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white text-sm font-semibold text-[#E5004F] transition-colors hover:bg-[#E5004F]/5 dark:bg-[#2a2732] dark:border-white/10"
          title="查看帮助"
        >
          <BookOpen className="w-4 h-4" />
          帮助
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(92vw,880px)] sm:max-w-[880px] p-0">
        <SheetHeader className="border-b border-black/5 dark:border-white/10 px-5 py-4">
          <SheetTitle className="text-[#E5004F] text-lg">帮助中心</SheetTitle>
          <SheetDescription>BanG Dream! Live2D / Spine 查看器使用说明</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} className="rounded-xl border border-black/8 dark:border-white/10 bg-white/80 dark:bg-[#24192f]/60 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Icon className="w-4 h-4 text-[#E5004F]" />
                  <h3 className="font-bold text-sm md:text-base">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  {section.items.map((item, itemIndex) => (
                    <li key={`${section.id}-${itemIndex}`} className="leading-6">
                      <span className="inline-flex flex-wrap items-center">
                        {item.map((part, partIndex) =>
                          typeof part === "string" ? (
                            <span key={`${section.id}-${itemIndex}-${partIndex}`}>{part}</span>
                          ) : isLinkPart(part) ? (
                            <a
                              key={`${section.id}-${itemIndex}-${partIndex}`}
                              href={part.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mx-0.5 text-[#E5004F] font-semibold underline decoration-[#E5004F]/40 underline-offset-3 hover:text-[#c50042] hover:decoration-[#E5004F]"
                            >
                              {part.label || part.href}
                            </a>
                          ) : isIconPart(part) ? (
                            <InlineIcon key={`${section.id}-${itemIndex}-${partIndex}`} icon={part.icon} />
                          ) : (
                            <span key={`${section.id}-${itemIndex}-${partIndex}`} />
                          ),
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
