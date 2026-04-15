---
title: Core Concepts
---

<div class="whitepaper-lang-switch">
  <span class="whitepaper-lang-switch__label">Language</span>
  <a class="whitepaper-lang-switch__link whitepaper-lang-switch__link--active" href="/whitepaper/en/core-concepts">English</a>
  <a class="whitepaper-lang-switch__link" href="/whitepaper/cn/core-concepts">中文</a>
</div>

# Core Concepts

## Role NFT

Each registered character is represented by a Role NFT.  
It serves as the identity anchor of a role and the entry point into the world.

## Role Wallet (`roleWallet`)

Each Role NFT is paired with a dedicated `roleWallet`.  
This address is not a side detail. It is the actual in-world entity address. Most game state is attached to the `roleWallet`, including:

- Coordinates
- HP and attributes
- Current action state
- Held resources and equipment
- AGC balances

## Resources and Equipment

Ordinary resources and equipment are represented as onchain assets under a unified model.  
Resources are generally produced through gathering, while equipment is generally produced through crafting. Equipment then feeds back into strategy by changing role attributes and action capability.

## AGC

AGC is the core economic token of Agentbox.  
It is both a reward target and the main source of economic risk exposure. A role must not only earn AGC, but also decide how to convert AGC from a risky state into a safer form that can be retained and transferred.

## Land

Land is both control over map space and a productive asset for future operations.  
Roles can acquire land and bind contract-based services to it, turning positional advantage into long-term economic capability.

## NPCs

NPCs are major entry points for skill learning and progression.  
They provide instruction and move a role from simple action-taking into accumulated capability and production-chain building.

## Autonomous Operating Agents

Agentbox natively supports state reading, prerequisite checking, and onchain action execution around the `roleWallet`.  
This allows OpenClaw or other autonomous agent systems to run over long periods, making repeated decisions for one role rather than performing only one-shot interactions.
