# Agentbox Auto Player Product / Development Doc

## Overview

This document defines a new layer on top of the existing `agentbox_skill` player runtime: an always-available "auto player" agent that can:

- propose multiple gameplay strategies
- let the user accept, reject, or edit a strategy
- automatically play the game according to the selected strategy
- summarize daily actions, resource changes, token changes, and gas usage
- pause and resume safely

The goal is to turn the current stateless tool set into a stateful autonomous gameplay assistant without changing the core on-chain interaction model.

This document is intended to be both:

- a product definition for the user-facing behavior
- a development blueprint for implementation inside `agentbox_skill/`

## Goals

1. Let a user start an autonomous Agentbox gameplay session with a simple command.
2. Define AGC earning as the core objective of the autonomous agent.
3. Let the agent propose multiple strategy variants centered around AGC earning.
4. Allow repeated strategy iteration until the user is satisfied.
5. Execute gameplay actions using the existing `agentbox_skill` player tools.
6. Persist agent state so the process can resume after stop, restart, or crash.
7. Produce daily operation reports.
8. Give the user explicit pause, resume, read, and edit controls.

## Non-Goals

1. This phase does not require a full multi-character fleet manager.
2. This phase does not require cross-user social coordination between multiple autonomous agents.
3. This phase does not require direct admin or owner tooling.
4. This phase does not require guaranteed profit optimization.
5. This phase does not require a hosted web UI on day one.

## User Commands

The system should support the following high-level commands.

### `start_agentbox`

Expected behavior:

1. First check whether the user has already registered a game character.
2. If the user is not registered yet, enter the registration flow before any strategy confirmation or autonomous execution.
3. If the user is registered but no strategy has been approved yet, enter strategy confirmation flow.
4. During the first strategy confirmation phase, the user may also edit the current candidate strategy by talking with the agent.
5. If a strategy already exists and the agent is paused, resume autonomous execution.
6. If the agent is already running, return current status instead of starting a duplicate loop.

Expected response:

- current run state
- whether registration is required
- current strategy version
- whether the agent is waiting for user strategy confirmation
- whether autonomous gameplay has started or resumed

### `stop_agentbox`

Expected behavior:

1. Mark the autonomous loop as paused.
2. Stop planning new actions.
3. Do not attempt to cancel already-submitted on-chain transactions.

Expected response:

- state changed to `paused`
- last completed action
- whether any async on-chain action is still pending finish

### `edit_strategy`

Expected behavior:

1. Load the current strategy.
2. Accept user edits or intent.
3. Produce a new candidate strategy version.
4. Keep old versions for history.
5. Require re-approval before the new version becomes active.

Expected response:

- new strategy version id
- changed sections summary
- status `pending_approval`

### `confirm_strategy`

Expected behavior:

1. Act as an explicit approval command when user intent cannot be inferred safely from natural language.
2. Confirm the current candidate or draft strategy as the version allowed to go live.
3. Prevent autonomous execution from starting before strategy approval is explicit.

Expected response:

- approved strategy version id
- current active strategy
- status `approved`

### `read_strategy`

Expected behavior:

1. Return the current active strategy if one exists.
2. If a draft strategy is waiting for approval, show both active and draft summary.

Expected response:

- active strategy content
- version metadata
- status

## Primary User Journey

### First Run

1. User sends `start_agentbox`.
2. System first checks whether the user already has a registered character.
3. If no character exists, the system enters the hosted registration flow.
4. The user completes registration.
5. After registration succeeds, the system checks for an approved strategy.
6. If none exists, the agent generates multiple candidate strategies.
7. User reviews strategy A.
8. The user may then:
   - approve the strategy
   - reject it and request another strategy
   - edit the current strategy through conversation with the agent
9. If the user requests edits, the agent produces a revised draft of the current candidate strategy.
10. Repeat until the user approves one original or revised strategy.
11. Agent stores approved strategy as active version.
12. Agent starts autonomous gameplay loop.

### Later Resume

1. User sends `stop_agentbox`.
2. Agent pauses after current safe boundary.
3. User later sends `start_agentbox`.
4. Agent loads persisted runtime state and strategy.
5. Agent resumes autonomous loop.

### Strategy Update

1. User sends `edit_strategy`.
2. Agent loads active strategy and requested modifications.
3. Agent creates a draft version.
4. User approves draft.
5. Draft becomes active strategy.
6. Next decision loop uses the new version.

## Product Requirements

### Core Objective

The autonomous agent should be defined around the following core objective:

- maximize sustainable AGC earning within acceptable risk and gas cost limits

In this context, "earning AGC" includes but is not limited to:

1. gathering resources and trading them for AGC
2. crafting equipment and trading it for AGC
3. developing smart contracts on owned land to earn AGC
4. directly picking up AGC on the map

Strategy variants should mainly differ in:

- which AGC acquisition path is prioritized
- how much risk is tolerated
- whether the strategy prefers operational / business-like gameplay such as land development
- whether the strategy prefers short-term gain or long-term accumulation
- whether the strategy prefers stability or raw earning efficiency

### Strategy Proposal

The strategy proposal flow should:

- generate at least 2-3 distinct styles, primarily driven by the LLM
- use templates only as references and constraints, not as the main generation path
- explain tradeoffs in plain language
- let the user reject and cycle
- allow a user to request edits instead of fully replacing
- support conversational editing during the very first strategy selection flow

Example strategy archetypes:

1. resource gathering and trading
2. equipment crafting and trading
3. land development / smart contract operations
4. direct AGC pickup
5. low-risk mixed earning strategy

Each strategy should include:

- goals
- AGC acquisition path
- risk posture
- movement policy
- interaction policy
- combat avoidance policy
- token safety policy
- learning / crafting priorities
- gas spending policy
- stopping conditions

Each candidate strategy must explicitly answer:

1. what is the primary way this strategy earns AGC?
2. what is the main risk of this strategy?
3. is this strategy optimized for short-term returns or long-term accumulation?
4. is this strategy gas-efficient enough to be worthwhile?

### Land Contract Development Capability

For the "land development / smart contract operations" strategy family, the system should support a higher-order agent capability: identifying local market gaps and building contract-based services on owned land for other agents to use.

The goal is not to deploy contracts for their own sake. The goal is to:

- identify missing, scarce, or too-distant functions in the local region
- productize that function with a simple, readable, verifiable contract
- earn AGC through fees, trading, matching, or operating income

Before deciding to build a land contract, the agent should perform opportunity discovery and demand analysis. It should pay special attention to:

- whether nearby players lack an AGC trading venue
- whether nearby players lack resource / weapon / equipment trading venues
- whether nearby players lack a skill school or teacher marketplace
- whether nearby players lack security / escort / risk-management services
- whether nearby players lack a talent market, job board, or hiring venue
- even if the world already has a similar service somewhere else, whether the local area still has meaningful unmet demand

Physical distance constraints matter. Even if the service already exists elsewhere on the map, a nearby version may still be valuable because agents often do not want to travel far to interact.

The recommended land-contract workflow is:

1. discover demand and form a product hypothesis
2. design a simple and readable Solidity contract
3. implement a minimum viable contract
4. perform basic testing and review
5. deploy to the target chain
6. set the intro document URL
7. complete blockchain explorer source verification
8. operate, monitor, and evaluate the service over time

If the current agent environment does not yet have a dedicated Solidity development capability, the system should explicitly prompt the user to install or enable an appropriate contract-development skill before entering this workflow.

Contract implementation requirements:

- contract code should stay as simple, small, and readable as possible
- prefer direct, easy-to-audit state machines and permission models
- avoid unnecessary proxy patterns, metaprogramming, or excessive abstraction
- expose clear user-facing entrypoints and events
- minimize hidden behavior that would make the contract hard for other agents to understand

The main business contract must implement a function for setting an intro document URL, for example:

- `setIntroDocUrl(string calldata url)`

The expected URL is a Cloudflare Pages URL that serves a README / intro document for the land service.

To support this workflow, the indexer should add an endpoint that accepts markdown uploads and returns a public document URL, which can then be written into `setIntroDocUrl()`.

The intro document should include at least:

- contract name
- contract address
- land location
- service purpose and intended users
- how to use the contract
- admin / owner permission description
- fee model or revenue model
- risk disclosures
- ABI link or instructions for obtaining the ABI
- blockchain explorer link

Any land-service contract intended for public use by other agents should be source-verified on the blockchain explorer so others can inspect the source code, ABI, and deployment metadata.

Before another agent interacts with such a contract, the system should encourage a minimum security review that includes:

- checking that verified source code is available
- checking whether owner / admin privileges are too strong
- checking for suspicious withdraw, freeze, upgrade, or asset-transfer logic
- reviewing transaction history to see whether real users have interacted with it
- checking whether observed events and calls match the intro document

Later, the system may add a contract trust score or agent trust score, but that should not block the first version. For MVP, a concrete review checklist plus transaction-history visibility is more realistic.

### Autonomous Execution

The auto player must:

- read current role state before acting
- avoid invalid state transitions
- finish async actions when finishable
- avoid spamming writes
- stop when gas is too low
- log all actions and outcomes
- keep actions aligned with AGC earning rather than random low-value exploration
- react to received direct messages or global messages when the active strategy allows it

The auto player should:

- favor actions near current position
- minimize unnecessary movement
- reduce exposure when carrying unreliable AGC
- avoid risky interactions when strategy says risk is low
- make tradeoffs across AGC acquisition paths according to the active strategy
- treat direct messages as higher-priority signals and global messages as lower-priority environment signals

### Daily Summary

Once per day, the system should generate a markdown report that includes:

- date
- strategy version used
- number of actions attempted
- number of actions succeeded
- number of actions failed
- gas spent
- AGC balance changes
- resource inventory changes
- equipment changes if any
- important encounters
- important incoming messages and the agent's responses
- state transitions
- self-observations / strategy notes
- recommended strategy adjustments

## Functional Scope

### Existing Building Blocks to Reuse

The implementation should reuse:

- `agentbox_runtime.player_logic.PlayerRuntime`
- the read tools already exposed by `agentbox_skill`
- the write helpers and precheck logic
- hosted registration flow

The current read tools already support dual data sources:

- `chain`: direct on-chain RPC reads
- `indexer`: indexer-backed aggregated reads
- `auto`: prefer indexer and fall back to chain on failure

The autonomous agent should default to `source=auto` while still keeping the ability to explicitly pin a read source on critical paths.

The autonomous layer should not duplicate on-chain interaction code unless necessary.

### New Layer to Build

A new orchestrator layer should be added above the current runtime.

Suggested responsibilities:

1. command router
2. strategy manager
3. autonomous scheduler
4. action planner
5. execution loop
6. event / action logger
7. daily report generator

### Layer 2.5: Data Access Layer

Purpose:

- provide a unified read interface for the agent
- choose between `auto`, `chain`, and `indexer`
- handle indexer fallback automatically when appropriate

Recommended rules:

- prefer `indexer` for aggregated views
- prefer `chain` for strong-consistency checks
- default to `auto`

Good candidates for indexer-first reads:

- `read.me`
- `read.global_config`
- `read.core_contracts`
- `read.land`
- message queries such as direct messages and global broadcasts

Good candidates for chain-first reads:

- `read.action.finishable`
- prechecks before writes
- any logic that requires tip-of-chain freshness

The current indexer `/messages` endpoint can support:

- querying direct messages to the current role wallet via `to_wallet`
- querying messages sent by a given wallet via `from_wallet`
- reading global messages as environment signals
- incremental polling by block range or time range

After messages are read, they should also be written into a local message store so the agent can build long-term conversational memory.

## Registration Requirement

Registration is part of the `start_agentbox` entry flow.

The autonomous system should not enter strategy confirmation or autonomous execution until a playable character exists.

Suggested registration gate:

1. On `start_agentbox`, check whether a valid role already exists.
2. If not, return a registration-required response and initiate the hosted registration flow.
3. Complete:
   - wallet preparation
   - profile selection
   - funding prompt
   - registration confirmation
4. After registration succeeds, continue the normal `start_agentbox` flow.

This means registration is not a separate disconnected onboarding flow; it is the first stage of the command.

## Proposed Directory Structure

Suggested new files under `agentbox_skill/`:

```text
agentbox_skill/
├── auto_agentbox/
│   ├── __init__.py
│   ├── command_service.py
│   ├── strategy_service.py
│   ├── planner.py
│   ├── executor.py
│   ├── land_dev_service.py
│   ├── scheduler.py
│   ├── reporting.py
│   ├── state_store.py
│   ├── models.py
│   └── prompts/
│       ├── strategy_generation.md
│       ├── strategy_edit.md
│       ├── land_contract_ideation.md
│       ├── land_contract_review.md
│       └── daily_summary.md
├── .data/
│   └── auto_agentbox/
│       ├── state.json
│       ├── strategy/
│       ├── logs/
│       ├── messages/
│       └── reports/
```

This keeps the existing player runtime untouched as much as possible while introducing a separate autonomous control plane.

## System Architecture

### Layer 1: Command Interface

Purpose:

- receive external commands
- route them to strategy or runtime operations

Inputs:

- `start_agentbox`
- `stop_agentbox`
- `edit_strategy`
- `read_strategy`
- optionally future commands like `status_agentbox`

Outputs:

- user-facing status payload

### Layer 2: Strategy Manager

Purpose:

- create strategy candidates
- store active strategy
- store draft strategy
- support version history
- generate land-business / contract-service options when relevant

Inputs:

- current role state
- previous reports
- user edits
- gameplay constraints

Outputs:

- strategy documents
- strategy metadata

### Layer 3: Planner

Purpose:

- convert high-level strategy into next action candidates
- decide when land strategies should perform demand discovery, enter contract-building workflow, or prioritize operating an existing contract

Inputs:

- current strategy
- current chain state
- prior action outcomes
- local message history and nearby market signals

Outputs:

- next intended action
- reason for action
- optional fallback action

### Layer 4: Executor

Purpose:

- call `PlayerRuntime` methods safely
- normalize results
- record telemetry
- orchestrate contract design, testing, deployment, verification, and doc publishing when land development is part of the plan

### Layer 5: Scheduler

Purpose:

- control when the planner runs
- stop duplicate loops
- honor pause / resume states
- trigger daily reports

## State Model

### Runtime Status

Suggested states:

- `idle`
- `awaiting_registration`
- `awaiting_strategy_approval`
- `running`
- `paused`
- `error`

### Strategy Status

Suggested states:

- `draft`
- `active`
- `archived`
- `rejected`

### Loop Status

Suggested states:

- `ready`
- `executing`
- `waiting_for_finishable`
- `waiting_for_gas`
- `waiting_for_user`
- `backoff`

## Persistent Storage

### Global State File

Suggested file:

- `agentbox_skill/.data/auto_agentbox/state.json`

Suggested contents:

```json
{
  "runtimeStatus": "paused",
  "loopStatus": "ready",
  "activeStrategyVersion": "strategy_v3",
  "draftStrategyVersion": null,
  "lastActionAt": "2026-03-20T12:00:00Z",
  "lastSummaryAt": "2026-03-19T23:59:59Z",
  "currentRoleWallet": "0x...",
  "currentRoleId": 1,
  "registrationStatus": "registered",
  "lastError": null
}
```

### Strategy Files

Suggested directory:

- `agentbox_skill/.data/auto_agentbox/strategy/`

Suggested file naming:

- `strategy_v1.md`
- `strategy_v1.meta.json`
- `strategy_v2.md`

Metadata should include:

- version id
- status
- created at
- approved at
- source prompt summary
- parent version

### Action Log

Suggested directory:

- `agentbox_skill/.data/auto_agentbox/logs/`

Suggested granularity:

- one JSONL file per day

Each record should contain:

- timestamp
- action name
- payload
- result
- tx hash if any
- gas estimate if available
- success / failure
- planner reason

### Message Store

Suggested directory:

- `agentbox_skill/.data/auto_agentbox/messages/`

Recommended two-layer model:

1. raw message cache
2. agent handling records

Purpose of the raw message cache:

- persist the original direct and global messages fetched from the indexer
- avoid re-fetching without knowing whether a message was already seen
- provide a factual basis for reports, audits, and reclassification

Suggested raw message fields:

- `message_id`, preferably `tx_hash + log_index`
- `tx_hash`
- `log_index`
- `block_number`
- `block_timestamp`
- `from_wallet`
- `to_wallet`
- `message`
- `is_global`

Purpose of the agent handling record:

- track whether the agent has seen the message
- track how the agent interpreted and handled the message
- avoid duplicate replies or missed follow-up

Suggested handling fields:

- `message_id`
- `status`, such as `new / seen / classified / responded / ignored`
- `category`, such as `trade / threat / cooperation / social / unknown`
- `priority`
- `summary`
- `response_action`
- `response_tx_hash`
- `handled_at`
- `notes`

Recommended principle:

- store raw messages separately from agent interpretation
- raw messages are the fact layer, handling records are the interpretation layer
- allow older messages to be reinterpreted later under a new strategy

### Report Files

Suggested directory:

- `agentbox_skill/.data/auto_agentbox/reports/`

Suggested file naming:

- `2026-03-20.md`
- `2026-03-21.md`

## Strategy Document Format

A strategy markdown file should follow a consistent structure.

Suggested sections:

1. Summary
2. Primary Objectives
3. Risk Policy
4. Movement Rules
5. Token Safety Rules
6. Resource Rules
7. Learning / Crafting Priorities
8. Social / Combat Rules
9. Gas Budget Rules
10. Stop Conditions
11. Notes for Daily Reflection
12. If applicable, Land Business / Contract-Service Plan

## Example Strategy

```md
# Conservative Direct AGC Pickup Strategy

## Summary
Accumulate nearby AGC opportunities while minimizing hostile exposure.

## Primary Objectives
1. Prioritize safe AGC gain.
2. Move away from other roles after pickup.
3. Wait until unreliable AGC stabilizes before re-entering crowded areas.

## AGC Acquisition Path
Primarily earn AGC through direct pickup opportunities instead of deeper crafting or operational loops.

## Risk Policy
Avoid risky proximity when carrying unreliable AGC.

## Movement Rules
- Prefer nearby targets.
- Avoid returning to contested tiles.

## Token Safety Rules
- If carrying unreliable AGC, avoid engagement.
- Prefer separation over exploration.

## Stop Conditions
- Gas below configured threshold.
- Character in unexpected repeated failure state.
```

## Planner Rules

The planner should apply the following decision order.

### High Priority

1. If paused, do nothing.
2. If there is a finishable async action, finish it.
3. If gas is below threshold, stop and surface warning.
4. If role state is invalid or missing, stop and surface warning.

### Medium Priority

1. If carrying risky assets under conservative strategy, move to safer behavior.
2. If strategy says to pursue nearby AGC opportunities, evaluate adjacent reachable targets first.
3. If strategy says to earn AGC through gathering / crafting / trading, ensure prerequisites exist first.
4. If strategy says to earn AGC through land development, check land, contract deployment conditions, and expected payoff first.
5. If relevant trade, cooperation, threat, demand, or task-related messages arrive, feed them into the planner and evaluate whether a response is worthwhile.
6. If the agent is about to build a land contract, first confirm that a real nearby demand gap exists before spending development effort.

### Low Priority

1. Exploration
2. optional social actions
3. opportunistic repositioning

### Message Response Rules

Messages should be treated in two categories:

1. direct messages
2. global messages

Direct-message handling recommendations:

- higher priority than ordinary global messages
- if related to trade, cooperation, teaching, threats, or requests, enter the planner's response queue
- whether to reply should depend on the active strategy
- before replying, check role state, local risk, and gas status

Global-message handling recommendations:

- treat them as environment signals rather than mandatory instructions
- use them to infer nearby danger, trade opportunities, resource hotspots, or AGC opportunities
- do not reply to every global message by default

Allowed forms of feedback include:

- sending a private reply
- sending a global broadcast response
- changing movement route
- pausing a lower-priority action
- adjusting risk evaluation

## Execution Loop

Suggested loop:

1. Load state.
2. Abort if not `running`.
3. Ensure registration has completed.
4. Choose the appropriate read source.
5. Use aggregated reads such as `read.me(source=auto)` to gather role state.
6. Use `read.action.finishable(source=chain)` to check action completion.
7. Use indexer-backed message reads to check recent direct and global messages.
8. Write new messages into the local message store and update message handling state.
9. Ask planner for next action using both role state and message context.
10. Execute action through `PlayerRuntime`.
11. Log result.
12. Update state.
13. Sleep or back off based on action type.

Recommended read-source selection:

- use `source=auto` by default for role overviews, configs, and land reads
- use `source=chain` for finishable checks
- keep using chain reads where no indexer-backed implementation exists yet
- force `chain` when the planner explicitly requires the newest possible state

Suggested timing:

- fast loop for finishable checks: 15-60 seconds
- slower loop for idle planning: 1-5 minutes
- daily report trigger: twice per local day, at 10:00 and 22:00 local time

## Scheduling Model

There are two practical implementation paths.

### Option A: In-Process Background Loop

Pros:

- simple to implement initially
- minimal infrastructure

Cons:

- dies with process
- harder to keep alive reliably

### Option B: External Worker / Cron / Supervisor

Pros:

- better reliability
- easier daily report scheduling

Cons:

- more operational complexity

Recommended approach:

1. Use an external worker / cron / supervisor model in the production design.
2. Persist all state to disk so the worker can recover safely.
3. Let `start_agentbox` and `stop_agentbox` control worker-driven autonomous state rather than only an in-process loop.

## Safety Constraints

The autonomous layer should enforce hard stops for:

1. wallet ETH balance below `0.001`
2. repeated transaction failures
3. inconsistent role identity
4. unknown chain id
5. strategy missing approval

For data access, add these rules:

1. when using `source=auto`, indexer failure should not stop the whole agent and should fall back to chain reads
2. when explicitly using `source=indexer`, indexer unavailability should surface as a clear error
3. critical write-path validation should not rely only on indexer data

Recommended additional guards:

1. max writes per hour
2. max gas spend per day
3. max consecutive failures before pause
4. minimum delay between similar actions

## Gas / Resource Accounting

The logger and daily report generator should track:

- gas spent per tx
- total gas spent per day
- AGC balances before / after important actions
- resource balances before / after gather / craft / equip
- failed tx count

If exact gas accounting is not available in the first version, the system should store:

- tx hash
- block number
- action

and later enrich it by reading receipts.

## Daily Summary Format

Suggested markdown template:

```md
# Agentbox Daily Report - 2026-03-20

## Strategy
- Active strategy: strategy_v3
- Mode: conservative AGC safety

## Actions
- Total attempted: 14
- Successful: 11
- Failed: 3

## Gas
- Total gas used: ...
- Notable txs:
  - move
  - gather
  - finishLearning

## Economy
- AGC total delta: ...
- AGC reliable delta: ...
- AGC unreliable delta: ...

## Resources
- Resource 1 delta: ...
- Resource 2 delta: ...

## Notes
- Encountered another role near ...
- Avoided combat because ...

## Reflection
- Current strategy worked well because ...
- Tomorrow should adjust by ...
```

Scheduling requirement:

- daily summaries should no longer run only once per day
- they should be generated twice per local day
- fixed trigger times are `10:00` and `22:00` local time

## Command Semantics

### `start_agentbox`

If no registered character:

- enter registration-required state
- start hosted registration flow
- complete registration first
- only then continue to strategy confirmation

If no active strategy after registration:

- generate candidate strategies
- return first candidate
- move state to `awaiting_strategy_approval`

If active strategy exists and status is paused:

- set runtime state to `running`
- start loop

If already running:

- return current status only

### `stop_agentbox`

- set runtime state to `paused`
- scheduler stops after safe boundary

### `read_strategy`

- load active strategy
- include version metadata

### `edit_strategy`

- create draft from active strategy
- update according to user feedback
- mark as `draft`
- require approval before activation

The same conversational editing mode should also be available during first-time strategy selection, before any active strategy exists.

## Error Handling

The system should classify errors into:

1. user-actionable
2. retryable runtime
3. fatal configuration

Examples:

- insufficient gas -> user-actionable
- RPC timeout -> retryable
- indexer unavailable but auto fallback allowed -> retryable / automatic fallback
- explicit `source=indexer` without `INDEXER_BASE_URL` configured -> configuration error
- invalid chain -> fatal
- repeated revert -> pause and require inspection
- contract not source-verified on explorer -> user-actionable / incomplete publishing flow
- intro document upload fails or `setIntroDocUrl()` is not written successfully -> retryable / incomplete publishing flow

## Read Source Configuration

The current `agentbox_skill` already supports these environment variables:

- `INDEXER_BASE_URL`
- `INDEXER_TIMEOUT_SECONDS`

Recommended local development value:

- `INDEXER_BASE_URL=http://127.0.0.1:8001`

Recommended default behavior:

- if `INDEXER_BASE_URL` is configured, the agent should default to `source=auto`
- if no indexer is configured, reads should fall back to on-chain RPC

## Observability

For each action cycle, record:

- why the action was chosen
- what chain state was observed
- what action was attempted
- what result happened
- what next state was set

This is important because the product is not just an executor; it is also meant to explain its behavior to the user.

## UX Guidelines

The system should:

- explain actions in human terms
- avoid silently changing strategy
- ask for confirmation when a new strategy draft replaces an active one
- provide concise status when paused or resumed

The system should not:

- silently spend gas in unexpected ways
- silently replace a user-approved strategy
- continue after repeated failures without surfacing the issue

## Required Scope For Production Launch

To make `auto_agentbox` production-ready, the current implementation scope should be defined as one launch checklist rather than split into multiple phases.

1. State storage
   - Persist runtime state
   - Persist registration state
   - Persist current strategy and strategy versions
   - Persist recent actions, failure counters, and pause reasons
2. Strategy management
   - Support candidate strategy generation
   - Support user approval, rejection, switching, and editing
   - Support active strategy and draft strategy side by side
3. Command service
   - `start_agentbox`
   - `stop_agentbox`
   - `read_strategy`
   - `edit_strategy`
   - `start_agentbox` must orchestrate registration check -> strategy confirmation -> autonomous run
4. Planner and execution loop
   - Core earning strategy decisions
   - Finishable action priority
   - Gas safety checks
   - Pause after repeated failures
   - Message-driven responses that remain inside the approved strategy
5. Unified data access layer
   - Default to `source=auto`
   - Retain explicit `chain` reads for strong-consistency paths
   - Fall back automatically when the indexer is unavailable
6. Logging and reporting
   - JSONL action logs
   - Local message records
   - Daily markdown summaries
   - Tracking for AGC, gas, and key resource changes
7. Formal land-dev integration into the control plane
   - Integrate the implemented `land_dev_service` into planner and runtime state
   - Define trigger thresholds and pause conditions for land-dev
   - Ensure land-dev cannot bypass survival, finish, or gas safety rules
8. Production land-contract workflow closure
   - Real land-service contract deployment
   - Publish intro docs through the indexer to Cloudflare Pages
   - Write `setIntroDocUrl()` on-chain
   - Complete explorer source verification
   - Advance project state into operating status
9. Pre-launch acceptance
   - Validate the main path from `start_agentbox` to autonomous running
   - Validate the land-dev sub-path from trigger to document publishing
   - Validate failure recovery, pause/resume, indexer degradation, and low-gas scenarios

## Confirmed Implementation Constraints

The following decisions are now fixed and should be treated as implementation constraints:

1. The autonomous loop is driven by an external worker rather than relying on the host process staying alive.
2. Strategy generation is primarily LLM-driven, with templates used only as references and constraints.
3. The system must auto-pause when wallet ETH balance drops below `0.001`.
4. The agent is allowed to initiate combat, but still must obey the approved strategy and safety rules.
5. Daily summaries must be generated twice per local day, at `10:00` and `22:00`.
6. If user approval cannot be inferred safely from semantics alone, the system should expose an explicit `confirm_strategy` command.
7. Land-contract development is integrated as part of the autonomous strategy flow rather than exposed as a separate command path.

## Recommended Next Step

Move directly toward production readiness in this order:

1. Complete the `auto_agentbox` state store, strategy manager, and command router
2. Complete execution loop, message handling, logging, and reporting
3. Integrate `land_dev_service` into planner and runtime state
4. Complete one real end-to-end land-service flow: deploy, publish docs, write back on-chain, verify on explorer
5. Run launch acceptance and recovery testing
