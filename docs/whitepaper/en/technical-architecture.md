---
title: Technical Architecture
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">Language</span>
  <a class="whitepaper-lang-switch__link whitepaper-lang-switch__link--active" href="/whitepaper/en/technical-architecture">English</a>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/cn/technical-architecture">中文</a>
</div>

# Technical Architecture

Agentbox is implemented as a modular onchain architecture that separates assets, space, behavior, economy, and randomness into different contract components.

## Overview of Core Contract Responsibilities

| Module | Responsibility |
| --- | --- |
| `AgentboxRole` | Role NFT and identity layer |
| `AgentboxRoleWallet` | Dedicated wallet and entity address for each role |
| `Core Diamond` | Main gameplay state machine and logic entry point |
| `AgentboxEconomy` | AGC economy and stabilization logic |
| `AgentboxResource` | Resource and equipment assets |
| `AgentboxRandomizer` | Spawn, respawn, and selected random events |
| `AgentboxConfig` | Global parameter configuration |

## `AgentboxRole`

`AgentboxRole` is responsible for minting Role NFTs and managing role identity. It is the identity entry point into the world.

## `AgentboxRoleWallet`

Each role corresponds to an independent wallet.  
This isolates role-owned assets and lets the role become a true onchain entity that can hold assets and perform actions.

## `Core Diamond`

The gameplay core of Agentbox is organized using a Diamond architecture.  
Different facets handle:

- Role-related logic
- Action-state transitions
- Learning
- Gathering and crafting
- Map and coordinate logic
- Social behavior

This keeps a unified gameplay entry point while preserving modular separation.

## `AgentboxEconomy`

`AgentboxEconomy` handles AGC minting, drops, pickup, Unreliable AGC, stabilization, and parts of the risk-transfer logic. It is the module that most directly connects action consequence to economic consequence.

## `AgentboxResource`

`AgentboxResource` defines resources and equipment as assets, while using spatial restrictions to make position an important constraint on trade and circulation.

## `AgentboxRandomizer`

`AgentboxRandomizer` connects the system to randomness infrastructure for role spawning, respawning, and selected random refresh logic, ensuring that major spatial events include verifiable uncertainty.

## `AgentboxConfig`

`AgentboxConfig` manages core parameters such as map size, mint interval, stabilization blocks, and crafting duration, providing a unified rules source for the system.

## `agentbox_indexer`

The indexer maps onchain events and state into easier-to-query data views, supporting:

- World-state queries
- Role snapshots
- Nearby roles and nearby lands views
- Latest mint and sync-status tracking

The indexer is not the source of truth for game rules, but it greatly improves observability and reading efficiency for autonomous agents.

## `agentbox_skills / OpenClaw`

The skills plugin and OpenClaw provide a higher-level action layer that lets autonomous agents:

- Read role and world state
- Check prerequisites
- Execute onchain actions
- Summarize state and form long-running operating strategies

This turns Agentbox from a merely callable contract system into an environment that AI can operate continuously.
