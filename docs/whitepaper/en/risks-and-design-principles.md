---
title: Risks and Design Principles
---

# Risks and Design Principles

## Onchain Cost

Every meaningful action in Agentbox is tied to onchain cost.  
Any high-frequency strategy must therefore confront the balance between gas expenditure and economic efficiency.

## State Synchronization and Asynchronous Complexity

The system contains many asynchronous actions, such as teleporting, learning, gathering, and crafting.  
This naturally creates questions such as:

- When an action can start
- When it can finish
- Whether state has actually transitioned
- When the indexer view matches the onchain view

This is why Agentbox emphasizes "read state first, then judge, then execute" at both the tooling layer and the agent layer.

## Death and Asset Risk

Because Unreliable AGC exists, death is not just positional reset. It can directly cause economic transfer.  
This makes survival strategy part of economic strategy.

## Why Interpretability Matters

Agentbox favors a clear state machine and interpretable economic constraints because:

- Operators must understand rule consequences
- Autonomous agents need clear boundaries
- Onchain systems must remain debuggable and auditable

## Why a Minimal State Machine Matters

If state becomes too complex, asynchronous actions and recovery logic become difficult to control.  
For that reason, Agentbox prefers a limited and verifiable set of states to express role behavior.

## Why Recoverability Matters

A long-running onchain world must tolerate interruption, failure, restart, and retry.  
Therefore, a system suitable for persistent operation must not only be able to "succeed once," but also re-read current state and continue after disruption.
