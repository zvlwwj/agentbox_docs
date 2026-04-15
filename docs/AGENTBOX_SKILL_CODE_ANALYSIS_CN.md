# agentbox_skill 工程代码解析

## 1. 文档目的

本文档基于当前仓库中的 `agentbox_skill/` 实际代码，对项目结构、运行入口、自动执行链、策略系统、发现层、持久化层和测试布局做一次工程级解析。

它关注的是“现在代码是怎么组织和工作的”，而不是早期设计稿或历史方案。

---

## 2. 项目整体定位

`agentbox_skill` 是一个以 Python 实现的 Agentbox 技能工程，当前可以分成三层：

1. `skill_player/`
   对外暴露 skill 入口，提供 `manifest()`、`list_tools()`、`invoke()`。
2. `agentbox_runtime/`
   负责链连接、配置、合约读写、托管注册、indexer 访问、工具注册，是实际的业务运行时。
3. `auto_agentbox/`
   在 runtime 之上实现自治控制平面，包括策略管理、消息同步、发现层、候选动作生成、决策打分、动作执行与状态落盘。

从当前实现上看，这个工程已经不是“单纯的工具集合”，而是一套：

- 链上游戏操作 SDK
- 托管注册流程
- 自动化玩家控制平面
- 土地经营/合约开发实验流水线

---

## 3. 顶层入口

### 3.1 Skill 入口

文件: [skill_player/main.py](/Users/jingyizou/agentbox/agentbox_skill/skill_player/main.py)

这是整个 skill 的最外层入口。逻辑非常薄：

- `_runtime()` 懒加载 `PlayerRuntime`
- `manifest()` 读取 `manifest.json`
- `list_tools()` 直接转发到 runtime
- `invoke()` 直接转发到 runtime

也就是说，`skill_player/main.py` 本身不承载业务逻辑，它只是宿主系统与运行时之间的桥接层。

### 3.2 运行时入口

文件: [agentbox_runtime/player_logic.py](/Users/jingyizou/agentbox/agentbox_skill/agentbox_runtime/player_logic.py)

`PlayerRuntime` 是当前工程最核心的对象。初始化时会完成：

- 加载配置
- 创建 `web3`
- 装配合约 adapter
- 初始化签名账户
- 初始化托管钱包服务
- 初始化 indexer 客户端
- 初始化 precheck
- 初始化自动控制平面 `AutoAgentControlPlane`
- 初始化自动 worker `AutoAgentWorker`
- 构建工具注册表

从职责上说，`PlayerRuntime` 是“游戏技能运行内核”，负责把链交互能力和自动控制能力统一组织起来。

---

## 4. runtime 层解析

### 4.1 工具注册方式

文件: [agentbox_runtime/player_logic.py](/Users/jingyizou/agentbox/agentbox_skill/agentbox_runtime/player_logic.py)

`PlayerRuntime._build_tools()` 通过 `ToolSpec` 注册全部对外工具。当前工具主要分为几类：

- 读取类
  - `agentbox.read.*`
- 注册类
  - `agentbox.registration.prepare`
  - `agentbox.registration.confirm`
- 角色控制类
  - `agentbox.role.*`
- 移动与传送类
  - `agentbox.move.instant`
  - `agentbox.teleport.start`
  - `agentbox.teleport.finish`
- 战斗类
  - `agentbox.combat.attack`
- 学习/教学类
  - `agentbox.learn.*`
  - `agentbox.teach.cancel`
- 采集类
  - `agentbox.gather.*`
- 制作与装备类
  - `agentbox.craft.*`
  - `agentbox.equip.*`
- 土地类
  - `agentbox.land.buy`
- 社交类
  - `agentbox.social.dm`
  - `agentbox.social.broadcast`
- 经济类
  - `agentbox.economy.trigger_mint`
  - `agentbox.economy.stabilize`
- 自治控制类
  - `start_agentbox`
  - `stop_agentbox`
  - `read_strategy`
  - `edit_strategy`
  - `confirm_strategy`

这意味着 `auto_agentbox` 并不是独立服务，它依然通过同一个 runtime 使用这些工具能力。

### 4.2 runtime 的边界

`agentbox_runtime/` 关注的是“能力正确执行”，不负责决定“当前应该做什么”。

它解决的问题包括：

- 从 chain/indexer 读取状态
- 编码合约调用与交易发送
- 做状态/余额预检查
- 返回统一结果结构
- 支撑 hosted wallet 注册

因此它是执行层下面的“安全能力层”。

### 4.3 indexer 与 chain 双读

`PlayerRuntime` 中很多读接口都带 `source` 概念：

- `auto`
- `chain`
- `indexer`

`auto` 模式会优先用 indexer，但在无 indexer 或不支持时回退到 chain。  
这使读取性能和一致性之间可以根据场景做折中。

### 4.4 hosted registration

runtime 中一条较成熟的链路是 hosted registration：

- `registration_prepare()` 创建托管钱包
- `registration_confirm()` 检查余额并代发角色创建

相关能力依赖：

- `custody.py`
- `wallet_store.py`
- `precheck.py`

这部分是 runtime 中工程化程度比较高、测试也比较完整的一块。

---

## 5. auto_agentbox 的当前架构

### 5.1 核心目标

当前 `auto_agentbox/` 已经从“按固定策略类别硬编码执行”重构为：

- 自然语言策略文本
- 结构化 `extracted_policy`
- 统一候选动作注册表
- 通用决策引擎
- 独立发现层

也就是说，执行层不再按 `agc_pickup`、`resource_trading` 这种 archetype 走主分支，而是：

1. 读取当前状态
2. 发现环境和候选目标
3. 生成候选动作
4. 用策略规则打分
5. 选择得分最高的动作执行

### 5.2 核心文件

- [auto_agentbox/control_plane.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/control_plane.py)
- [auto_agentbox/decision_engine.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/decision_engine.py)
- [auto_agentbox/affordances.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/affordances.py)
- [auto_agentbox/discovery.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/discovery.py)
- [auto_agentbox/strategy_manager.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_manager.py)
- [auto_agentbox/strategy_extractor.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_extractor.py)
- [auto_agentbox/models.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/models.py)
- [auto_agentbox/state_store.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/state_store.py)
- [auto_agentbox/message_store.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/message_store.py)

---

## 6. 数据模型解析

文件: [auto_agentbox/models.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/models.py)

### 6.1 运行状态

`AutoAgentRuntimeState` 是自治执行的主状态对象，负责保存：

- 当前 agent 状态
  - `awaiting_registration`
  - `awaiting_strategy`
  - `running`
  - `paused`
- worker 状态
- role id / role wallet
- active strategy / draft strategy
- 连续失败次数
- 上次动作
- 暂停原因
- 日报时间
- 当前土地项目 id

这是 `worker_tick()` 每次进出都会读写的状态核心。

### 6.2 策略对象

`StrategyVersion` 当前字段很明确：

- `title`
- `content_markdown`
- `extracted_policy`
- `status`
- `source`
- `policy_schema_version`
- `generation_mode`
- `edit_request`

这里最关键的一点是：  
**当前执行层真正消费的是 `extracted_policy`，不是 markdown 本身。**

### 6.3 决策对象

`CandidateAction` 表示一个候选动作，通常包含：

- `action_type`
- `tool_name`
- `payload`
- `summary`
- `base_score`
- `score`
- `blocked_reason`
- `metadata`
- `reasons`

`DecisionContext` 表示一次 tick 的统一上下文，包括：

- 角色钱包
- `me`
- `finishable`
- 新消息
- 当前策略
- 原生币余额
- 连续失败次数
- 上次动作
- `world_state`
- 当前 land project id

`DecisionTraceRecord` 则用于记录本次决策过程，便于回放和调试。

---

## 7. 策略系统解析

### 7.1 StrategyManager

文件: [auto_agentbox/strategy_manager.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_manager.py)

`StrategyManager` 负责：

- 初始化候选策略
- 编辑策略草稿
- 基于运行反馈创建 replanned draft
- 批准策略并切换 active
- 输出策略摘要

值得注意的是：

- 默认候选策略仍然存在
- 如果配置了 LLM generator，则优先用 LLM 生成候选
- 即使有 LLM，生成结果仍会被 `StrategyExtractor` 规范化为可执行 policy

### 7.2 StrategyExtractor

文件: [auto_agentbox/strategy_extractor.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_extractor.py)

`StrategyExtractor` 当前承担“文本到规则”的最小闭环：

- 从自然语言中提取关键词
- 推导 `action_biases`
- 提取 `action_hints`
- 提取 `deny_actions`
- 设置 `message_policy`
- 设置 `stop_conditions`
- 设置 `replan_conditions`
- 派生 goals

当前默认 policy 结构包括：

- `schema_version`
- `goals`
- `action_biases`
- `action_hints`
- `deny_actions`
- `priorities`
- `stop_conditions`
- `replan_conditions`
- `message_policy`

这说明当前策略系统已经不是“分类标签驱动”，而是“规则和偏好驱动”。

### 7.3 当前策略系统的特点

优点：

- 结构简单，足够落地
- 可在无 LLM 时工作
- 容易配合本地测试
- 已经能给决策层提供统一输入

局限：

- 规则抽取仍偏启发式
- 复杂目标组合和时间规划表达较弱
- `action_hints` 还比较重要，尚未彻底被世界状态发现层替代

---

## 8. DiscoveryProvider 发现层解析

文件: [auto_agentbox/discovery.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/discovery.py)

这是当前最新落下来的一个重要分层。

### 8.1 它解决什么问题

在较早的实现里，`control_plane` 会直接内联读取：

- 当前地块
- 装备槽
- recipe 候选
- equipment 候选
- NPC 候选

现在这些发现逻辑被抽到了 `DiscoveryProvider.build_world_state()`，它统一根据：

- 当前角色位置
- 当前策略的 `action_hints`
- 当前策略的 `action_biases`

去构建 `world_state`。

### 8.2 当前会发现哪些世界状态

`build_world_state()` 目前会尝试收集：

- `current_land`
- `equipped_slots`
- `candidate_recipes`
- `candidate_equipment`
- `candidate_npcs`
- `role_skills`
- `role_skill_ids`

### 8.3 当前发现策略

它并不是盲目扫描所有对象，而是采取“hint + 偏好驱动发现”的方式：

- 如果策略里显式给出 candidate ids，则按 hint 读取
- 如果策略对某类动作存在正向 bias，则启用默认 discovery range

例如：

- 偏好 `craft_start_best_recipe` 时，扫描默认 recipe 范围
- 偏好 `equip_best_candidate` 时，扫描默认 equipment 范围
- 偏好 `learn_npc_start` 时，扫描默认 NPC 范围

### 8.4 这个分层的价值

- `control_plane` 更薄
- 发现逻辑可测试
- affordance 层不必自己负责底层扫描
- 后续可继续拆成更细的 discovery provider

---

## 9. Affordance 注册表解析

文件: [auto_agentbox/affordances.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/affordances.py)

### 9.1 什么是 affordance

这里的 affordance 可以理解为：

“在当前上下文下，一种可能执行的动作能力及其候选生成逻辑”

每个 affordance builder 输入 `DecisionContext`，输出 0 个或多个 `CandidateAction`。

### 9.2 当前注册表的主要动作族

当前 affordance 已覆盖：

- 完成异步动作
  - `finish_current_action`
- 消息响应
  - `reply_direct_message`
  - `classify_global_message`
- 资源和经济
  - `gather_once`
  - `gather_start_current_tile`
  - `trigger_mint`
- 移动
  - `move_instant`
  - `move_to_signal_coordinate`
  - `teleport_start`
- 战斗
  - `combat_attack`
  - `combat_attack_recent_sender`
- 学习/教学
  - `learn_npc_start`
  - `learn_player_request`
  - `learn_player_request_recent_sender`
  - `learn_player_accept`
  - `learn_player_accept_recent_sender`
  - `learn_cancel`
  - `teach_cancel`
- 土地
  - `buy_land_current_tile`
  - `start_land_dev`
  - `resume_land_dev`
- 制作与装备
  - `craft_start_best_recipe`
  - `equip_best_candidate`
- 调度
  - `request_replan`
  - `noop`

### 9.3 当前 affordance 的两个来源

一部分来自策略 hints：

- 明确目标坐标
- 明确目标钱包
- 明确 skill / npc

另一部分来自动态世界状态：

- 根据消息提取坐标
- 根据消息发送者构造攻击/学习目标
- 根据当前地块决定是否采集或买地
- 根据已发现 recipe 自动选择 craft 目标
- 根据已发现装备自动选择 equip 候选
- 根据已发现 NPC 自动选择学习对象

这说明当前执行层已经从“策略直接给参数”向“引擎自动发现目标并构造参数”推进了一大步。

---

## 10. 决策引擎解析

文件: [auto_agentbox/decision_engine.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/decision_engine.py)

### 10.1 决策流程

`DecisionEngine.decide(context)` 的步骤非常清晰：

1. 让 `AffordanceRegistry` 生成全部候选动作
2. 交给 `PolicyEngine` 对候选打分
3. 过滤被 block 的候选
4. 按分数排序
5. 返回得分最高的候选
6. 如果全部被 block，则返回 `noop`

### 10.2 PolicyEngine 当前做什么

当前 `PolicyEngine` 实现的规则主要包括：

- 根据 `deny_actions` 直接阻断动作
- 根据 `message_policy` 决定是否回复私信
- 根据 `action_biases` 为候选加分
- 对连续重复动作做重复惩罚
- 对连续失败后的高风险/主动动作做失败惩罚
- 对 `resume_land_dev` 做上下文校验

这是一套相对轻量但很实用的评分模型。

### 10.3 这一层的意义

这层把“候选动作生成”和“策略偏好评分”拆开了。

因此：

- affordance 层负责“我现在能做什么”
- policy 层负责“按当前策略，我更应该做什么”

这正是当前工程里最关键的一次架构升级。

---

## 11. Control Plane 主执行链

文件: [auto_agentbox/control_plane.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/control_plane.py)

### 11.1 start / stop / strategy 系列

`AutoAgentControlPlane` 对外提供：

- `start()`
- `stop()`
- `read_strategy()`
- `edit_strategy()`
- `confirm_strategy()`
- `worker_tick()`

`start()` 会先检查：

- 是否已经注册角色
- 是否已有 active strategy

如果没有角色，则进入 `awaiting_registration`。  
如果没有 active strategy，则进入 `awaiting_strategy` 并生成候选策略。  
只有角色和策略都具备后，才切换到 `running`。

### 11.2 worker_tick 当前执行顺序

`worker_tick()` 当前流程可以概括为：

1. 读取 runtime state
2. 如果不是 `running`，直接跳过
3. 做安全检查
4. 读取 `me`
5. 读取 `finishable`
6. 同步新消息
7. 读取 active strategy
8. 构造 `DecisionContext`
9. 交给 `DecisionEngine` 选动作
10. 调用 `_execute_candidate()` 执行
11. 更新 `last_action` 和 `consecutive_failures`
12. 写入 decision trace
13. 视情况写日报
14. 保存 state

### 11.3 _execute_candidate 的角色

`_execute_candidate()` 是 control plane 中最像“动作路由器”的部分。

它根据 `CandidateAction.action_type` 调用 runtime 真实工具或内部流程，例如：

- 完成异步动作
- 自动回复消息
- 发起采集
- 移动/传送
- 战斗
- 学习/教学
- 买地
- craft/equip
- 触发 mint
- 启动或恢复 land development

因此 control plane 实际上负责：

- 状态机管理
- 决策调度
- 动作执行编排

但不再负责直接做“策略分类分支”。

---

## 12. 持久化与本地状态

### 12.1 StateStore

文件: [auto_agentbox/state_store.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/state_store.py)

当前自动执行相关数据以本地 JSON / JSONL 文件形式存放在 `.data/auto_agentbox` 下。

`AutoAgentStateStore` 主要管理：

- `runtime_state.json`
- `strategies/*.json`
- `logs/actions.jsonl`
- `logs/decision_traces.jsonl`
- `reports/*`

它负责：

- 读写 runtime state
- 读写策略
- 追加 action log
- 追加 decision trace
- 写日报

### 12.2 MessageStore

文件: [auto_agentbox/message_store.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/message_store.py)

消息不会只停留在内存里，`MessageStore` 会把 indexer 读到的消息同步到本地 `messages.jsonl`，并支持：

- 去重 upsert
- 加载全部消息
- 标记消息已处理
- 保存响应动作和响应 tx hash

这使消息驱动行为具备本地连续性。

### 12.3 LandProjectStore

`LandProjectStore` 用于单独保存土地经营项目。  
每个项目一个 JSON 文件，独立于 runtime state 和普通策略状态。

---

## 13. land_dev 子系统

当前代码中仍保留土地经营与合约生成相关实验能力，包括：

- [auto_agentbox/land_dev_service.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/land_dev_service.py)
- [auto_agentbox/forge_deployer.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/forge_deployer.py)

从当前架构上看，`land_dev` 已经不再是一个“策略类别”，但仍然是一组特殊能力：

- 发现机会
- 生成项目
- 生成 spec / 合约 / README
- review
- deploy
- 发布文档

它现在通过 affordance 和 control plane 被接入，而不是作为旧式主分支存在。

这意味着当前工程对 `land_dev` 的定位更像：

“一组高成本、高复杂度、仍在实验中的高级动作能力”

---

## 14. 测试结构解析

当前测试覆盖比较完整，主要包括：

- [tests/test_auto_agentbox.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_auto_agentbox.py)
  - 自动执行主链路
  - affordance 相关行为
  - strategy / worker 流程
- [tests/test_discovery_provider.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_discovery_provider.py)
  - discovery 层测试
- [tests/test_strategy_manager.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_strategy_manager.py)
  - 策略管理
- [tests/test_llm_strategy.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_llm_strategy.py)
  - LLM 策略生成
- [tests/test_registration_runtime.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_registration_runtime.py)
  - hosted registration
- [tests/test_indexer_runtime.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_indexer_runtime.py)
  - indexer 读取
- [tests/test_wallet_store.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_wallet_store.py)
  - 钱包存储
- [tests/test_worker_main.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_worker_main.py)
  - worker CLI

从测试分布可以看出：

- runtime 基础能力已具备较好的单元测试覆盖
- auto_agentbox 的关键重构点也已经有回归测试
- 当前工程的自动执行层并非“只有 demo，没有保护”

---

## 15. 当前架构的关键优点

### 15.1 分层比之前清晰

当前已经形成比较明确的层次：

- runtime: 安全执行能力
- discovery: 世界状态发现
- affordances: 候选动作生成
- policy engine: 候选打分与过滤
- control plane: 状态机和执行编排

### 15.2 去掉了策略类别硬编码

这是当前最重要的架构收益之一。  
执行层已经不依赖 `agc_pickup`、`resource_trading` 这类策略类别做主判断，而改成：

- 策略偏好
- 当前世界状态
- 候选动作评分

这更接近通用 agent 的执行方式。

### 15.3 已经具备可观测性

有这些本地落盘对象后，系统具备一定可回放能力：

- runtime state
- strategy files
- action logs
- decision traces
- messages
- land projects

这对调试自动 agent 非常关键。

---

## 16. 当前架构的主要局限

### 16.1 StrategyExtractor 仍偏启发式

虽然现在策略已经结构化，但抽取器仍以关键词和正则为主，复杂策略表达能力有限。

### 16.2 DiscoveryProvider 仍是一个聚合对象

当前发现层虽然独立了，但仍聚合在一个类里，未来还可以继续拆成：

- recipe discovery
- equipment discovery
- npc discovery
- land discovery
- message signal discovery

### 16.3 PolicyEngine 评分仍较轻量

当前主要依赖：

- base score
- bias
- deny
- failure penalty
- repeat penalty

未来如果要进一步提升自治质量，可以引入更系统的 utility model，把：

- 距离
- 收益预估
- 风险
- gas 成本
- 当前技能匹配度
- 当前装备收益

这些因素做成更细致的评分函数。

### 16.4 affordance 的参数构造仍有提升空间

虽然已支持动态选参，但还可以进一步增强：

- 更大范围的目标发现
- 更复杂的候选排序
- 多步计划而非单步动作优选

---

## 17. 推荐阅读顺序

如果要继续深入当前代码，建议按这个顺序读：

1. [skill_player/main.py](/Users/jingyizou/agentbox/agentbox_skill/skill_player/main.py)
2. [agentbox_runtime/player_logic.py](/Users/jingyizou/agentbox/agentbox_skill/agentbox_runtime/player_logic.py)
3. [auto_agentbox/control_plane.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/control_plane.py)
4. [auto_agentbox/models.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/models.py)
5. [auto_agentbox/strategy_manager.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_manager.py)
6. [auto_agentbox/strategy_extractor.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/strategy_extractor.py)
7. [auto_agentbox/discovery.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/discovery.py)
8. [auto_agentbox/affordances.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/affordances.py)
9. [auto_agentbox/decision_engine.py](/Users/jingyizou/agentbox/agentbox_skill/auto_agentbox/decision_engine.py)
10. [tests/test_auto_agentbox.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_auto_agentbox.py)
11. [tests/test_discovery_provider.py](/Users/jingyizou/agentbox/agentbox_skill/tests/test_discovery_provider.py)

---

## 18. 总结

从当前代码来看，`agentbox_skill` 已经形成了一套比较完整的自治执行框架：

- skill 入口薄，runtime 厚
- runtime 提供统一安全能力
- auto_agentbox 负责策略、发现、决策和执行编排
- 执行层已经从“策略类别驱动”转成“候选动作 + policy 评分驱动”
- `DiscoveryProvider` 的引入让世界状态发现正式成为独立层

如果用一句话概括当前工程状态：

**它已经从“工具型技能项目”演进成“带有通用决策雏形的链上游戏 agent runtime”。**
