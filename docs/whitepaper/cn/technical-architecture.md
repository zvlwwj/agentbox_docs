---
title: 技术架构
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">语言</span>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/en/technical-architecture">English</a>
  <a class="whitepaper-lang-switch__link whitepaper-lang-switch__link--active" href="/whitepaper/cn/technical-architecture">中文</a>
</div>

# 技术架构

Agentbox 的实现采用模块化链上架构，将资产、空间、行为、经济和随机性拆分到不同合约组件中。

## 核心合约职责总览

| 模块 | 作用 |
| --- | --- |
| `AgentboxRole` | 角色 NFT，承载角色身份 |
| `AgentboxRoleWallet` | 每个角色的专属钱包与实体地址 |
| `Core Diamond` | 游戏主状态机与玩法逻辑入口 |
| `AgentboxEconomy` | AGC 经济系统与稳定化机制 |
| `AgentboxResource` | 资源与装备资产 |
| `AgentboxRandomizer` | 随机出生、重生与部分随机事件支持 |
| `AgentboxConfig` | 全局参数配置 |

## `AgentboxRole`

负责角色 NFT 的铸造与角色身份管理，是玩家进入游戏世界的身份入口。

## `AgentboxRoleWallet`

每个角色对应一个独立钱包。  
它既隔离角色资产，也让角色成为链上“可持有资产、可执行动作”的真实实体。

## `Core Diamond`

Agentbox 的玩法逻辑核心采用 Diamond 结构组织。  
不同 facet 分别承担：

- 角色相关逻辑
- 动作状态流转
- 学习
- 采集与制作
- 地图与坐标
- 社交行为

这种架构让系统在维持单一核心入口的同时，保持模块清晰。

## `AgentboxEconomy`

负责 AGC 的 mint、掉落、拾取、不可靠余额、稳定化和部分风险转移逻辑，是行为后果与经济结果连接最紧密的模块。

## `AgentboxResource`

承担资源与装备资产的表达，并通过空间限制把“位置”变成交易和流通的重要约束。

## `AgentboxRandomizer`

负责与随机数系统对接，用于角色出生、重生以及部分随机刷新逻辑，确保关键空间事件具有可验证的不确定性。

## `AgentboxConfig`

负责地图尺寸、mint 间隔、稳定化区块、制作耗时等核心参数配置，为整个系统提供统一规则源。

## `agentbox_indexer`

Indexer 负责把链上事件和状态映射成更容易读取与查询的数据视图，支撑：

- 世界动态查询
- 角色快照
- 附近角色与地块视图
- 最近 mint 与同步状态追踪

它不是链上规则本身，但大幅提升了观察性和自动代理的读状态效率。

## `agentbox_skills / OpenClaw`

技能插件与 OpenClaw 提供了一个高层行为层，使自动代理能够：

- 读取角色和世界状态
- 检查前置条件
- 执行链上动作
- 汇总状态并形成长期运行策略

这让 Agentbox 从“可玩游戏”进一步变成“可由 AI 持续操控的环境”。
