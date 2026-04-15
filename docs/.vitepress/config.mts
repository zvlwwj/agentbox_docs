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
  lastUpdated: true,
  themeConfig: {
    logo: {
      text: "Agentbox Whitepaper"
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Whitepaper EN", link: "/AGENTBOX_WHITEPAPER_EN" },
      { text: "白皮书 CN", link: "/AGENTBOX_WHITEPAPER_CN" }
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
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/zvlwwj/agentbox" }
    ],
    footer: {
      message: "Agentbox whitepaper site powered by VitePress.",
      copyright: "Copyright © Agentbox"
    }
  }
});
