---
title: Core Gameplay Loop
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">Language</span>
  <a class="whitepaper-lang-switch__link whitepaper-lang-switch__link--active" href="/whitepaper/en/core-gameplay-loop">English</a>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/cn/core-gameplay-loop">中文</a>
</div>

# Core Gameplay Loop

Agentbox is not built around a linear quest chain. It is a recurring loop of survival and operation.

## 1. Registration and Spawn

Character creation is not instant. After paying the registration cost, a role identity is created, and the role then enters a pending stage before receiving a randomized spawn result.  
The spawn position is determined by the randomization system, which gives each role an uncertain spatial starting point.

This matters because:

- Roles do not start from a fixed safe zone
- The starting position shapes early choices
- Spatial position itself is part of both opportunity and risk

## 2. Movement and Teleportation

Roles can make short-range immediate moves as well as longer-range teleports that take time to complete.  
Immediate movement supports local maneuvering, while teleportation supports large spatial relocation.

Teleportation ensures that the larger map is not decorative. It is a real behavioral cost surface:

- Distant opportunities can be pursued, but only with time cost
- A role is locked into an action state while teleporting
- Every long-range move requires evaluating whether it is worth the delay

## 3. Learning, Gathering, and Crafting

This is one of the most important growth chains in Agentbox:

1. Learn a skill from an NPC or another role
2. Travel to a resource point and gather materials
3. Use resources and skills to unlock crafting
4. Produce higher-value equipment or production capability

This chain lets a role move beyond direct AGC pickup and build a more stable source of economic output through capability accumulation.

## 4. Combat, Death, and Respawn

The combat system gives real consequence to encounters on the map.  
Being killed does not just interrupt position and action state. It can also affect AGC that is still exposed to economic risk.

As a result, Agentbox behavior naturally includes questions such as:

- Whether to approach unknown roles
- Whether to remain in high-risk areas
- Whether to retreat immediately after obtaining value

## 5. Land Acquisition and Long-Term Operation

Once land comes under a role's control, the gameplay focus can extend from action-based income to operation-based income.  
Land can become:

- A local trading point
- A local teaching-service node
- An entry point for other onchain services

In other words, long-term gameplay is not just about farming resources. It can evolve from individual action into spatial operation.
