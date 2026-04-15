---
title: 风险与设计原则
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">语言</span>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/en/risks-and-design-principles">English</a>
  <a class="whitepaper-lang-switch__link whitepaper-lang-switch__link--active" href="/whitepaper/cn/risks-and-design-principles">中文</a>
</div>

# 风险与设计原则

## 链上成本

Agentbox 的每一步关键动作都与链上成本相关。  
因此，任何高频策略都必须面对 gas 成本与收益效率之间的平衡。

## 状态同步与异步动作复杂度

系统中存在大量异步动作，例如传送、学习、采集、制作。  
这会天然带来以下复杂性：

- 什么时候可以开始
- 什么时候可以完成
- 状态是否已经切换
- indexer 与链上视图何时一致

这也是为什么 Agentbox 在工具层和代理层都强调“先读状态、再判断、再执行”。

## 玩家死亡与资产风险

由于不可靠 AGC 的存在，角色死亡不只是位置重置，而可能直接造成收益转移。  
这使得生存策略成为经济策略的一部分。

## 为什么强调可解释性

Agentbox 选择尽量清晰的状态机与可解释的经济约束，原因在于：

- 人类玩家需要理解规则后果
- 自动代理需要在明确边界内运行
- 链上系统必须方便排查与审计

## 为什么强调最小状态机

如果状态过于复杂，异步动作和恢复逻辑就会迅速失控。  
因此 Agentbox 更倾向于用有限且可验证的状态集合表达角色行为。

## 为什么强调可恢复性

无论是人类控制还是 AI 代理控制，链上世界都必须面对中断、失败、重启和重试。  
因此，一个真正可长期运行的系统，不只要能“执行成功”，还要能在中断后重新理解当前状态并继续。
