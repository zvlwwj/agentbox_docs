# Agentbox 游戏玩法说明（基于当前代码）

本文档基于当前合约实现整理，目标是帮助你从“能上手玩”到“理解链上规则细节”。

## 1. 游戏资产与身份模型

- 角色 NFT：`AgentboxRole`（ERC721），每次 `mint()` 会生成一个 `roleId`。
- 角色钱包：每个角色会自动部署一个 `AgentboxRoleWallet`（克隆合约），它才是游戏内实体地址（坐标、战斗、资源、代币余额都挂在这个地址上）。
- 资源与装备：`AgentboxResource`（ERC1155），普通资源与装备都用 token id 区分。
- 经济代币：`AgentboxEconomy`（ERC20，符号 `AGC`）。
- 游戏核心：Diamond 结构的 `Core`，包含 Role/Action/GatherCraft/Learn/Map/Social 等 facet。

关键点：  
大部分核心操作函数都以 `roleWallet` 作为参数，并通过 `onlyRoleController` 校验调用者是否有控制权（角色 owner 或 controller）。

## 2. 开局流程（单接口创建角色）

合约层流程：

1. 调用 `core.createCharacter()`，并支付 `0.01 ETH`（硬编码要求）。
2. Core 会在内部铸造 `AgentboxRole` NFT，并自动创建对应的 `roleWallet`。
3. 角色进入 `PendingSpawn`，由随机数模块异步回调 `processSpawn` 完成出生。

当前 `agentbox-openclaw` skill 推荐接入流程：

1. 先调用 `agentbox.registration.prepare`，由系统为用户创建托管钱包地址并保管私钥。
2. 提示用户向该地址转入大于 `0.01 ETH` 的余额；默认应至少保留约 `0.015 ETH`，用于覆盖注册费和 gas。
3. 用户确认到账后，调用 `agentbox.registration.confirm`。
4. 如果 gas 不足，skill 会返回补款请求，提示用户继续向同一地址转入 ETH。
5. 余额足够后，skill 才会继续执行一次 `createCharacter()` 交易。
6. 注册完成后，角色进入 `PendingSpawn`，由随机数模块异步回调 `processSpawn` 完成出生。
7. 出生后基础属性：
  - `maxHp=100`
  - `hp=100`
  - `attack=10`
  - `defense=0`
  - `speed=3`
  - `range=1`
8. 出生坐标为全图随机。
9. 前 `2000` 个注册成功的角色，若出生地块尚无主，会自动获得该地块所有权。

## 3. 地图与坐标规则

- 地图大小由配置决定（默认 `10000 x 10000`）。
- 地图是“环形”处理（toroidal）：
  - 位移越界会从另一侧回绕。
  - 战斗距离也按回绕后的最短曼哈顿距离计算。
- 土地 id 计算：`landId = y * mapWidth + x`。

## 4. 角色状态机（非常重要）

`RoleState`：

- `Idle`
- `Learning`
- `Teaching`
- `Crafting`
- `Gathering`
- `Teleporting`
- `PendingSpawn`

绝大多数主动行为要求角色是 `Idle`，行为开始后切状态，完成后回到 `Idle`。

## 5. 移动玩法

### 5.1 立即移动 `moveTo(roleWallet, targetX, targetY)`

- 只能 `Idle` 时调用。
- 目标必须在地图范围内。
- 限制：当前位置到目标点的“回绕后最短曼哈顿距离”必须 `<= speed`。
- 成功后立刻更新坐标。
- 若新坐标有地面 AGC，会自动拾取（见经济章节）。

### 5.2 异步传送 `startTeleport / finishTeleport`

- `startTeleport(roleWallet, targetX, targetY)`：
  - 目标必须在地图范围内。
  - 计算回绕后最短曼哈顿距离 `distance`。
  - 耗时区块：`ceil(distance / speed)`。
  - 状态切到 `Teleporting`。
- `finishTeleport(roleWallet)`：
  - 到达所需区块后可完成。
  - 角色瞬移到目标点并回到 `Idle`。
  - 同样会自动拾取该地块 AGC。

## 6. 战斗与死亡重生

### 6.1 攻击 `attack(attackerWallet, targetWallet)`

- 攻击方必须 `Idle`。
- 目标 `hp` 必须大于 0。
- 距离限制：回绕后 `dx + dy <= attacker.range`。
- 伤害：`max(attacker.attack - target.defense, 0)`。

### 6.2 击杀后处理

- 目标 `hp` 归零。
- 清理目标身上的学习/教学等关联状态，避免卡状态。
- 目标当前“不可靠 AGC”会转移给击杀者（见经济章节）。
- 请求随机重生，`processRespawn` 回调后：
  - 目标随机重置坐标
  - `hp` 恢复为 `maxHp`
  - 状态变回 `Idle`

## 7. 学习系统（NPC 与玩家教学）

### 7.1 向 NPC 学习

- `startLearning(roleWallet, npcId)` 条件：
  - 角色 `Idle`
  - NPC 空闲
  - 与 NPC 同坐标
  - 对应技能已配置学习区块数
- 完成 `finishLearning(roleWallet)` 后：
  - 获得技能
  - NPC 释放占用
  - 触发 NPC 随机刷新坐标（异步）

### 7.2 向玩家学习

1. 学生请求：`requestLearningFromPlayer(student, teacher, skillId)`
  - 双方同坐标
  - 老师已掌握该技能
  - 学生未掌握该技能
  - 学生进入 `Learning`（`startBlock=0`，等待老师接受）
2. 老师接受：`acceptTeaching(teacher, student)`
  - 老师 `Idle`
  - 学生处于待接受状态且指定老师正确
  - 双方同坐标
  - 开始正式计时
3. 学生完成：`finishLearning(student)`
  - 到达所需区块后获得技能
  - 老师从 `Teaching` 回到 `Idle`

规则差异：玩家教学耗时 = NPC 基础学习耗时 * 2。

## 8. 采集与制作

### 8.1 资源点

- 管理员可在固定坐标设置资源点：`resourceType`。
- 当前资源类型映射：`1=木头`、`2=羊毛`、`3=石头`。
- 角色必须在资源点坐标上，且已掌握对应资源技能，才能采集。

### 8.2 即时采集 `gather(roleWallet)`

- 每次采集 `1` 单位。
- 当前资源点不再扣减库存，成功后直接 mint 对应 ERC1155 资源到角色钱包。

### 8.3 持续采集 `startGather / finishGather`

- `startGather(roleWallet, amount)`：
  - 预先检查库存足够并立即扣库存。
  - 耗时 = `amount * 2` 区块（固定）。
  - 状态进入 `Gathering`。
- `finishGather(roleWallet)`：
  - 到时后 mint 对应数量资源给角色钱包，状态恢复 `Idle`。

### 8.4 制作装备 `startCrafting / finishCrafting`

- 配方包含：
  - 消耗资源类型数组
  - 消耗数量数组
  - 需求技能
  - 耗时区块
  - 产出装备 id
- `startCrafting` 时会立即检查并销毁材料，状态进入 `Crafting`。
- `finishCrafting` 到时后产出 1 件装备（ERC1155），状态回 `Idle`。

## 9. 装备系统

- `equip(roleWallet, equipmentId)` 需角色 `Idle` 且背包里有该装备。
- 装备配置包含 `slot` 与属性加成（speed/attack/defense/maxHp/range，可正可负）。
- 同槽位已有装备时，会先卸下旧装备（属性回退，旧装备返还到背包），再装备新装备（新装备从背包 burn）。
- `unequip(roleWallet, slot)` 会移除属性并将装备返还到背包。
- 若卸装导致 `hp > maxHp`，会自动把 `hp` 截断到 `maxHp`。

## 10. 土地系统

### 10.1 购买地块

- 调用 `buyLand(roleWallet, x, y)` 条件：
  - 当前地块不是资源点
  - 地块尚未被拥有
  - 角色必须站在该坐标上
  - 支付方式：燃烧角色钱包的“可靠 AGC”（`landPrice`，默认 500 AGC）
- 地块所有权记录在 `AgentboxLand`（ERC721）中，owner 为 `roleWallet` 地址。

### 10.2 出售地块

- `sellLand(roleWallet, x, y)` 条件：
  - 调用者必须是 `roleWallet` 对应角色的 owner/controller
  - `roleWallet` 必须是该地块 NFT 的 owner
  - 角色站在该坐标上
- 当前实现中 `sellLand` 已禁用（调用会 `LandBurnDisabled` revert），地块不能销毁。

### 10.3 绑定地块合约

- 地主通过角色上下文调用 `setLandContract(roleWallet, x, y, contractAddress)` 绑定一个合约地址到地块。
- 一个合约地址同一时间只能绑定一块地。
- 被绑定合约可被视为“地图实体”，具备固定坐标（用于资源空间转账限制）。

## 11. AGC 经济系统（重点）

### 11.1 地面掉落与拾取

- 任意人可调用 `triggerMint()`，满足 `mintIntervalBlocks` 才会成功。
- 成功后请求随机数，在随机地块增加地面 AGC（`groundTokens[landId]`）。
- 当前实现每次掉落数量读取 `config.mintAmount`（默认初始化示例为 `50 AGC`，18 位精度）。
- 最大掉落次数 `160000`（达到后停止新增）。

角色在以下时机会自动拾取所在地块 AGC：

- `move` 成功后
- `finishMove` 成功后

### 11.2 可靠 / 不可靠余额

拾取到的 AGC 初始记为“不可靠余额”（unreliable）：

- 余额条目带 `obtainedBlock`。
- 达到 `stabilizationBlocks` 后可稳定化（`stabilizeBalance`）。
- 账户的 ERC20 总余额包含可靠+不可靠，但转账/燃烧只能使用可靠部分。

可靠余额计算逻辑：

- `reliable = ERC20余额 - unreliableBalanceOf(account)`（下限 0）

### 11.3 死亡转移规则

- 角色死亡时，死者全部不可靠余额会转移给击杀者。
- 转移通过核心特权逻辑处理，不受普通可靠性限制。

## 12. 资源（ERC1155）空间转账限制

`AgentboxResource` 对普通转账做了空间钩子校验：

- from 与 to 都必须是已注册实体（角色钱包或已绑定地块合约）。
- from 与 to 必须在同一坐标，才能转账成功。

因此，资源/装备交易天然是“同地块面对面”或“与同地块合约交互”的形式。

## 13. 社交

- `sendMessage(roleWallet, toWallet, message)`：点对点消息事件。
- `sendGlobalMessage(roleWallet, message)`：全局广播事件。

这两者目前只发事件，不在链上存历史消息结构。

