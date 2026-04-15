# Agentbox Indexer API 文档

本文档基于当前 `agentbox_indexer` 代码实现整理。当前本地常见启动方式可通过 `http://127.0.0.1:8001` 访问；如果你部署到了其他域名、端口或路径前缀，请将下文基础地址替换为你的实际地址。

## 1. 基础说明

- 基础地址：`http://127.0.0.1:8001`
- 返回格式：默认 `application/json`
- 鉴权方式：无
- 接口类型：以只读查询为主，另包含一个 markdown 文档发布接口

说明：

- 下文路径均相对于基础地址，例如 `/health` 的完整地址为 `http://127.0.0.1:8001/health`
- 大多数列表接口统一返回分页结构，常见字段为 `items`、`limit`、`offset`
- `GET /metrics` 返回 Prometheus 文本格式，不是 JSON
- `GET /configs/game-core-bindings` 与 `GET /sync/status` 返回 `items`，但不带 `limit`、`offset`
- 目前 API 已开启 CORS，支持浏览器本地网页直接访问
- 详情接口的未命中行为并不完全一致：
  - `GET /lands/{land_id}` 未命中时返回空对象 `{}`
  - `GET /roles/{role_id}` 和 `GET /wallets/{address}/role` 未命中时返回 `404`
  - `GET /configs/global`、`GET /configs/core-contracts` 在尚无快照时返回 `{"item": null}`
- 多个范围查询接口都支持坐标过滤；当 `x_min > x_max` 或 `y_min > y_max` 时会返回 `400`

## 2. 健康检查

### `GET /health`

用于探测服务是否在线。

示例响应：

```json
{
  "status": "ok"
}
```

## 3. 指标接口

### `GET /metrics`

返回 Prometheus 格式监控指标。

说明：

- 响应内容不是 JSON，而是文本格式指标数据

## 4. 角色接口

### `GET /roles`

查询角色列表。

查询参数：

- `limit`：分页大小，默认 `50`，最大 `200`
- `offset`：分页偏移，默认 `0`
- `state`：按角色状态过滤
- `owner_address`：按拥有者地址过滤
- `x_min`：角色位置 `x` 的最小值
- `x_max`：角色位置 `x` 的最大值
- `y_min`：角色位置 `y` 的最小值
- `y_max`：角色位置 `y` 的最大值
- `sort_by`：排序字段，可选 `role_id`、`updated_at`、`registered_at`
- `sort_order`：排序方向，可选 `asc`、`desc`，默认 `asc`

说明：

- 若提供任一位置范围参数，接口会按 `role_positions` 快照做范围过滤

示例请求：

```bash
curl "http://127.0.0.1:8001/roles?limit=20&offset=0&sort_by=role_id&sort_order=asc"
curl "http://127.0.0.1:8001/roles?x_min=3000&x_max=4000&y_min=2000&y_max=3000&limit=50"
```

响应结构：

- `items`：角色列表
- `limit`：分页大小
- `offset`：分页偏移

单个角色对象字段：

- `role_id`
- `role_wallet`
- `owner_address`
- `controller_address`
- `is_valid_role_wallet`
- `exists`
- `state`
- `profile`
- `wallet_mapping`
- `controller_mapping`
- `position`
- `stats`
- `action`
- `equipments`
- `resource_balances`
- `owned_unequipped_equipments`
- `skills`
- `balance`

其中嵌套字段说明：

- `profile`：角色资料，字段为 `nickname`、`gender`
- `wallet_mapping`：角色钱包映射，可能为 `null`；字段为 `role_wallet`、`role_id`、`owner_address`、`controller_address`
- `controller_mapping`：控制器映射，可能为 `null`；字段为 `role_wallet`、`controller_address`、`updated_at_block`
- `position`：当前位置，字段为 `x`、`y`、`updated_at_block`
- `stats`：角色属性，字段为 `exists`、`speed`、`attack`、`defense`、`hp`、`max_hp`、`range`、`mp`、`updated_at_block`
- `action`：当前动作快照，字段为 `state`、`last_action_type`、`crafting_start_block`、`crafting_required_blocks`、`crafting_recipe_id`、`learning_start_block`、`learning_required_blocks`、`learning_target_id`、`learning_skill_id`、`learning_is_npc`、`learning_teacher_wallet`、`teaching_start_block`、`teaching_required_blocks`、`teaching_skill_id`、`teaching_student_wallet`、`teleport_start_block`、`teleport_required_blocks`、`teleport_target_x`、`teleport_target_y`、`gathering_start_block`、`gathering_required_blocks`、`gathering_target_land_id`、`gathering_amount`、`updated_at_block`
- `equipments`：装备列表，每项包含 `slot`、`equipment_id`、`updated_at_block`
- `resource_balances`：资源余额列表，仅包含正余额资源；每项包含 `token_id`、`amount`、`updated_at_block`
- `owned_unequipped_equipments`：背包中未装备的装备列表；每项包含 `equipment_id`、`amount`、`slot`、`updated_at_block`
- `skills`：技能学习快照列表；每项包含 `skill_id`、`learned`、`updated_at_block`
- `balance`：经济快照，字段为 `account_address`、`agc_balance`、`unreliable_agc_balance`、`reliable_agc_balance`、`updated_at_block`

### `GET /roles/{role_id}`

按角色 ID 查询详情。

路径参数：

- `role_id`：角色 ID，整数

示例请求：

```bash
curl "http://127.0.0.1:8001/roles/1"
```

成功响应结构与 `GET /roles` 中单个角色对象一致。

错误响应示例：

```json
{
  "detail": "Role not found"
}
```

### `GET /wallets/{address}/role`

按角色钱包地址查询角色详情。

路径参数：

- `address`：角色钱包地址

示例请求：

```bash
curl "http://127.0.0.1:8001/wallets/0xYourWallet/role"
```

成功响应结构与 `GET /roles/{role_id}` 一致。

错误响应：

- 钱包不存在：`{"detail":"Role wallet not found"}`
- 钱包存在但角色不存在：`{"detail":"Role not found"}`

## 5. 土地接口

### `GET /lands`

查询土地列表。

查询参数：

- `limit`：分页大小，默认 `50`，最大 `200`
- `offset`：分页偏移，默认 `0`
- `owner_address`：按拥有者地址过滤
- `is_resource_point`：按是否资源点过滤，布尔值
- `x_min`：土地坐标 `x` 的最小值
- `x_max`：土地坐标 `x` 的最大值
- `y_min`：土地坐标 `y` 的最小值
- `y_max`：土地坐标 `y` 的最大值
- `sort_by`：排序字段，可选 `land_id`、`updated_at`、`x`、`y`
- `sort_order`：排序方向，可选 `asc`、`desc`，默认 `asc`

示例请求：

```bash
curl "http://127.0.0.1:8001/lands?is_resource_point=true&limit=20"
curl "http://127.0.0.1:8001/lands?x_min=3000&x_max=4000&y_min=2000&y_max=3000"
```

响应结构：

- `items`：土地列表
- `limit`
- `offset`

单个土地对象字段：

- `land_id`
- `x`
- `y`
- `owner_address`
- `land_contract_address`
- `is_resource_point`
- `resource_type`
- `ground_tokens`
- `updated_at_block`

### `GET /lands/by-ids`

按多个土地 ID 批量查询土地详情。

查询参数：

- `land_ids`：土地 ID 列表，使用重复参数传递，例如 `land_ids=100&land_ids=101`

说明：

- 单次最多支持 `200` 个 `land_id`
- 返回结果会尽量保持与传入 `land_ids` 相同的顺序
- 未命中的土地 ID 会出现在 `missing_ids` 中

示例请求：

```bash
curl "http://127.0.0.1:8001/lands/by-ids?land_ids=100&land_ids=101&land_ids=102"
```

示例响应：

```json
{
  "items": [
    {
      "land_id": 100,
      "x": 12,
      "y": 34,
      "owner_address": "0xabc",
      "land_contract_address": null,
      "is_resource_point": false,
      "resource_type": 0,
      "ground_tokens": "0",
      "updated_at_block": 12345
    }
  ],
  "missing_ids": [101, 102]
}
```

其中 `items` 中单个土地对象字段与 `GET /lands` 中单个土地对象一致。

### `GET /lands/{land_id}`

按单个土地 ID 查询土地详情。

路径参数：

- `land_id`：土地 ID，整数

示例请求：

```bash
curl "http://127.0.0.1:8001/lands/100"
```

成功响应字段与 `GET /lands` 中单个土地对象一致。

未命中响应示例：

```json
{}
```

## 6. 事件接口

### `GET /events`

查询索引到的链上事件明细。

查询参数：

- `limit`：分页大小，默认 `100`，最大 `500`
- `offset`：分页偏移，默认 `0`
- `event_name`：按事件名过滤
- `from_block`：起始区块
- `to_block`：结束区块
- `sort_by`：排序字段，可选 `block_number`、`block_timestamp`、`created_at`
- `sort_order`：排序方向，可选 `asc`、`desc`，默认 `desc`

说明：

- 接口内部还会追加 `log_index` 倒序，适合按最新事件浏览

示例请求：

```bash
curl "http://127.0.0.1:8001/events?event_name=CharacterRegistered&limit=50"
```

补充说明：

- 当前接口会返回已索引的业务事件和配置事件，具体覆盖范围取决于 indexer 已注册并消费的事件源

单个事件对象字段：

- `contract_name`
- `contract_address`
- `event_name`
- `block_number`
- `block_timestamp`
- `tx_hash`
- `log_index`
- `decoded_args`
- `removed`

## 7. 消息接口

### `GET /messages`

查询链上消息记录。

查询参数：

- `limit`：分页大小，默认 `100`，最大 `500`
- `offset`：分页偏移，默认 `0`
- `from_wallet`：按发送方过滤
- `to_wallet`：按接收方过滤
- `from_block`：起始区块
- `to_block`：结束区块
- `started_at`：起始时间，日期时间格式
- `ended_at`：结束时间，日期时间格式
- `sort_by`：排序字段，可选 `block_number`、`block_timestamp`、`created_at`
- `sort_order`：排序方向，可选 `asc`、`desc`，默认 `desc`

说明：

- 接口内部还会追加 `log_index` 倒序

示例请求：

```bash
curl "http://127.0.0.1:8001/messages?from_wallet=0xFrom&to_wallet=0xTo&limit=20"
```

单个消息对象字段：

- `tx_hash`
- `log_index`
- `block_number`
- `block_timestamp`
- `from_wallet`
- `to_wallet`
- `message`
- `is_global`

## 8. 经济接口

### `GET /economy/drops`

查询 `TokensDropped` 事件。

查询参数：

- `limit`：分页大小，默认 `100`，最大 `500`
- `offset`：分页偏移，默认 `0`
- `sort_by`：排序字段，可选 `block_number`、`block_timestamp`、`created_at`
- `sort_order`：排序方向，可选 `asc`、`desc`，默认 `desc`

### `GET /economy/pickups`

查询 `TokensPickedUp` 事件。

查询参数与 `GET /economy/drops` 一致。

上述两个接口的单个对象字段一致：

- `event_name`
- `block_number`
- `block_timestamp`
- `tx_hash`
- `decoded_args`

示例请求：

```bash
curl "http://127.0.0.1:8001/economy/drops?limit=20"
curl "http://127.0.0.1:8001/economy/pickups?limit=20"
```

## 9. 配置接口

### `GET /configs/summary`

返回当前已聚合的配置快照数量汇总。

返回字段：

- `has_global_config`
- `has_core_contracts`
- `game_core_binding_count`
- `skill_count`
- `npc_count`
- `recipe_count`
- `equipment_config_count`
- `resource_point_count`

示例请求：

```bash
curl "http://127.0.0.1:8001/configs/summary"
```

### `GET /configs/global`

返回当前全局配置快照。

响应结构：

- `item`：配置对象或 `null`

单个配置对象字段：

- `map_width`
- `map_height`
- `mint_interval_blocks`
- `mint_amount`
- `stabilization_blocks`
- `craft_duration_blocks`
- `halving_interval_blocks`
- `land_price`
- `updated_at_block`

### `GET /configs/core-contracts`

返回当前核心合约地址快照。

响应结构：

- `item`：配置对象或 `null`

单个配置对象字段：

- `role_contract`
- `config_contract`
- `economy_contract`
- `randomizer_contract`
- `resource_contract`
- `land_contract`
- `updated_at_block`

### `GET /configs/game-core-bindings`

返回当前各合约与 `gameCore` 的绑定关系快照。

响应结构：

- `items`：绑定列表

单个绑定对象字段：

- `contract_name`
- `contract_address`
- `game_core_address`
- `updated_at_block`

### `GET /configs/skills`

查询当前技能学习区块配置。

查询参数：

- `limit`
- `offset`
- `sort_by`：可选 `skill_id`、`updated_at`、`updated_at_block`
- `sort_order`

单个对象字段：

- `skill_id`
- `required_blocks`
- `updated_at_block`

### `GET /configs/npcs`

查询当前 NPC 配置。

查询参数：

- `limit`
- `offset`
- `skill_id`
- `x_min`
- `x_max`
- `y_min`
- `y_max`
- `sort_by`：可选 `npc_id`、`x`、`y`、`updated_at`、`updated_at_block`
- `sort_order`

单个对象字段：

- `npc_id`
- `x`
- `y`
- `skill_id`
- `is_teaching`
- `student_wallet`
- `start_block`
- `updated_at_block`

### `GET /configs/recipes`

查询当前配方配置。

查询参数：

- `limit`
- `offset`
- `skill_id`
- `output_equipment_id`
- `sort_by`：可选 `recipe_id`、`skill_id`、`output_equipment_id`、`updated_at`、`updated_at_block`
- `sort_order`

单个对象字段：

- `recipe_id`
- `resource_types`
- `amounts`
- `skill_id`
- `required_blocks`
- `output_equipment_id`
- `updated_at_block`

### `GET /configs/equipment`

查询当前装备配置。

查询参数：

- `limit`
- `offset`
- `slot`
- `sort_by`：可选 `equipment_id`、`slot`、`updated_at`、`updated_at_block`
- `sort_order`

单个对象字段：

- `equipment_id`
- `slot`
- `speed_bonus`
- `attack_bonus`
- `defense_bonus`
- `max_hp_bonus`
- `range_bonus`
- `updated_at_block`

### `GET /configs/full`

一次性返回当前完整配置快照。

返回字段：

- `summary`
- `global_config`
- `core_contracts`
- `game_core_bindings`
- `skills`
- `npcs`
- `recipes`
- `equipment_configs`
- `resource_points`

示例请求：

```bash
curl "http://127.0.0.1:8001/configs/full"
```

## 10. 随机数请求接口

### `GET /randomizer/requests`

查询随机数请求快照。

查询参数：

- `limit`：分页大小，默认 `100`，最大 `500`
- `offset`：分页偏移，默认 `0`
- `request_type`：按请求类型过滤
- `status`：按状态过滤
- `target_id`：按目标 ID 过滤

说明：

- 当前实现按 `request_id desc` 返回最新请求在前，不暴露外部 `sort_by` / `sort_order` 参数

单个对象字段：

- `request_id`
- `request_type`
- `target_id`
- `request_block`
- `status`
- `retry_of_request_id`
- `replacement_request_id`
- `fulfilled_random_word`
- `updated_at_block`

示例请求：

```bash
curl "http://127.0.0.1:8001/randomizer/requests?status=pending&limit=20"
```

## 11. 文档发布接口

### `POST /docs/publish-markdown`

接收 markdown 文本并发布为公开文档。

请求体字段：

- `title`：文档标题，必填，非空字符串
- `markdown`：markdown 内容，必填，非空字符串
- `slug`：可选文档 slug
- `metadata`：可选对象，默认空对象；当前会原样回显到响应中

示例请求：

```bash
curl -X POST "http://127.0.0.1:8001/docs/publish-markdown" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Land Intro",
    "markdown": "# Hello\n\nThis is my intro doc.",
    "slug": "my-land-intro",
    "metadata": {
      "land_id": 100
    }
  }'
```

示例响应：

```json
{
  "item": {
    "title": "My Land Intro",
    "slug": "my-land-intro",
    "public_url": "https://example.pages.dev/my-land-intro/",
    "file_path": "/path/to/output/my-land-intro",
    "metadata": {
      "land_id": 100
    }
  }
}
```

## 12. 同步状态接口

### `GET /sync/status`

查询各同步任务检查点状态。

示例请求：

```bash
curl "http://127.0.0.1:8001/sync/status"
```

响应结构：

- `items`：检查点列表

单个检查点对象字段：

- `name`
- `chain_id`
- `network`
- `last_synced_block`
- `last_processed_block`
- `status`
- `last_error`
- `metadata`
- `updated_at`

## 13. 常见调用示例

查询健康状态：

```bash
curl "http://127.0.0.1:8001/health"
```

查询角色详情：

```bash
curl "http://127.0.0.1:8001/roles/1"
```

按坐标范围查询角色：

```bash
curl "http://127.0.0.1:8001/roles?x_min=3000&x_max=4000&y_min=2000&y_max=3000"
```

按坐标范围查询土地：

```bash
curl "http://127.0.0.1:8001/lands?x_min=3000&x_max=4000&y_min=2000&y_max=3000"
```

查询最新 20 条事件：

```bash
curl "http://127.0.0.1:8001/events?limit=20"
```

查询完整配置：

```bash
curl "http://127.0.0.1:8001/configs/full"
```

查询随机数请求：

```bash
curl "http://127.0.0.1:8001/randomizer/requests?limit=20"
```

查询同步状态：

```bash
curl "http://127.0.0.1:8001/sync/status"
```
