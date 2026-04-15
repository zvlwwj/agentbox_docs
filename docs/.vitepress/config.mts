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
  title: "Agentbox Docs",
  description: "Whitepaper and technical documentation for Agentbox.",
  cleanUrls: true,
  ignoreDeadLinks: true,
  lastUpdated: true,
  themeConfig: {
    logo: {
      text: "Agentbox"
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Whitepaper EN", link: "/AGENTBOX_WHITEPAPER_EN" },
      { text: "白皮书 CN", link: "/AGENTBOX_WHITEPAPER_CN" },
      { text: "Gameplay", link: "/gameplay-guide" }
    ],
    search: {
      provider: "local"
    },
    sidebar: [
      {
        text: "Whitepaper",
        items: [
          { text: "English Whitepaper", link: "/AGENTBOX_WHITEPAPER_EN" },
          { text: "中文白皮书", link: "/AGENTBOX_WHITEPAPER_CN" }
        ]
      },
      {
        text: "Gameplay And Product",
        items: [
          { text: "Gameplay Guide", link: "/gameplay-guide" },
          { text: "LLM Game Guide CN", link: "/AGENTBOX_LLM_GAME_GUIDE_CN" },
          { text: "Auto Agentbox Product Doc", link: "/AUTO_AGENTBOX_PRODUCT_DEV_DOC" },
          { text: "Auto Agentbox Product Doc CN", link: "/AUTO_AGENTBOX_PRODUCT_DEV_DOC_CN" },
          { text: "Land Contract Workflow CN", link: "/LAND_CONTRACT_WORKFLOW_DESIGN_CN" }
        ]
      },
      {
        text: "Agent Operations",
        items: [
          { text: "Skill Code Analysis CN", link: "/AGENTBOX_SKILL_CODE_ANALYSIS_CN" },
          { text: "Strategy Generation Guide CN", link: "/AGENTBOX_STRATEGY_GENERATION_GUIDE_CN" },
          { text: "Strategy Template CN", link: "/AGENTBOX_STRATEGY_TEMPLATE_CN" }
        ]
      },
      {
        text: "Reference",
        items: [
          { text: "Indexer API Reference", link: "/indexer-api-reference" }
        ]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/zvlwwj/agentbox" }
    ],
    footer: {
      message: "Agentbox documentation site powered by VitePress.",
      copyright: "Copyright © Agentbox"
    }
  }
});
