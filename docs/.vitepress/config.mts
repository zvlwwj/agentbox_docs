import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitepress";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const cnamePath = path.resolve(process.cwd(), "public/CNAME");
const hasCustomDomainFile = fs.existsSync(cnamePath);
const base =
  process.env.VITEPRESS_BASE ??
  (hasCustomDomainFile
    ? "/"
    : process.env.GITHUB_ACTIONS === "true" && repoName
      ? `/${repoName}/`
      : "/");

export default defineConfig({
  base,
  lang: "en-US",
  title: "Agentbox Whitepaper",
  description: "Bilingual whitepaper site for Agentbox.",
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: false,
  themeConfig: {
    logo: {
      text: "Agentbox"
    },
    nav: [
      { text: "English", link: "/" },
      { text: "中文", link: "/whitepaper/cn/summary" }
    ],
    search: {
      provider: "local"
    },
    docFooter: {
      prev: false,
      next: false
    },
    sidebar: {
      "/whitepaper/cn/": [
        { text: "摘要", link: "/whitepaper/cn/summary" },
        { text: "项目愿景", link: "/whitepaper/cn/project-vision" },
        { text: "核心概念", link: "/whitepaper/cn/core-concepts" },
        { text: "核心玩法循环", link: "/whitepaper/cn/core-gameplay-loop" },
        { text: "AGC 经济系统", link: "/whitepaper/cn/agc-economic-system" },
        { text: "空间与社会系统", link: "/whitepaper/cn/spatial-and-social-systems" },
        { text: "装备、技能与职业化成长", link: "/whitepaper/cn/growth" },
        { text: "技术架构", link: "/whitepaper/cn/technical-architecture" },
        { text: "AI Agent 玩法层", link: "/whitepaper/cn/ai-agent-gameplay-layer" },
        { text: "当前实现状态与后续方向", link: "/whitepaper/cn/current-status-and-future-directions" },
        { text: "风险与设计原则", link: "/whitepaper/cn/risks-and-design-principles" },
        { text: "结语", link: "/whitepaper/cn/closing" },
        { text: "核心名词表", link: "/whitepaper/cn/core-glossary" }
      ],
      "/": [
        { text: "Summary", link: "/" },
        { text: "Project Vision", link: "/whitepaper/en/project-vision" },
        { text: "Core Concepts", link: "/whitepaper/en/core-concepts" },
        { text: "Core Gameplay Loop", link: "/whitepaper/en/core-gameplay-loop" },
        { text: "AGC Economic System", link: "/whitepaper/en/agc-economic-system" },
        { text: "Spatial and Social Systems", link: "/whitepaper/en/spatial-and-social-systems" },
        { text: "Equipment, Skills, and Specialized Growth", link: "/whitepaper/en/growth" },
        { text: "Technical Architecture", link: "/whitepaper/en/technical-architecture" },
        { text: "AI Agent Gameplay Layer", link: "/whitepaper/en/ai-agent-gameplay-layer" },
        { text: "Current Status and Future Directions", link: "/whitepaper/en/current-status-and-future-directions" },
        { text: "Risks and Design Principles", link: "/whitepaper/en/risks-and-design-principles" },
        { text: "Closing", link: "/whitepaper/en/closing" },
        { text: "Core Glossary", link: "/whitepaper/en/core-glossary" }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/zvlwwj/agentbox" }
    ],
    footer: {
      message: "Agentbox whitepaper site powered by VitePress.",
      copyright: "Copyright © Agentbox"
    }
  }
});
