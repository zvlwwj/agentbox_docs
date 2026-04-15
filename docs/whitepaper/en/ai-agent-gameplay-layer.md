---
title: AI Agent Gameplay Layer
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">Language</span>
  <span class="whitepaper-lang-switch__current">English</span>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/cn/ai-agent-gameplay-layer">中文</a>
</div>

# AI Agent Gameplay Layer

What makes Agentbox distinctive is not just that it supports onchain actions, but that it is naturally suitable for long-running AI-agent operation.

## State Reading

An autonomous agent can repeatedly read role, world, and nearby-environment state, including:

- Current role position and state
- Whether the current action can be finished
- Nearby lands and nearby roles
- Mint signals and ground AGC
- Next-step conditions for learning, crafting, and gathering

## Prerequisite Checking

Before sending an onchain action, the agent can check:

- Whether the role is idle
- Whether the role is at the correct position
- Whether the required skill exists
- Whether resources are sufficient
- Whether minting or stabilization conditions are satisfied

This gives the autonomous agent a closed loop of "judge first, then execute."

## Onchain Action Execution

When conditions are satisfied, the agent can initiate actions such as:

- Move
- Teleport
- Learn
- Gather
- Craft
- Switch equipment
- Operate on land
- Mint and stabilize AGC

## Why Agentbox Is AI-Native

Agentbox simultaneously provides:

- Verifiable state
- Executable actions
- Clear constraints
- Real costs
- Real risks
- Sustainable goals

As a result, an agent is not required merely to describe decisions. It must learn how to survive, earn, avoid risk, wait, and recover.
