# Tech Defaults & Agent Behaviour

## Model Defaults
- Prefer `opus` for reasoning-heavy tasks.
- Use `sonnet` for subagents (low-cost long context).

## Thinking & Context
- Extended thinking ON unless explicitly disabled.
- Keep outputs high-information-density.
- Use `/compact` rules if context nears threshold.

## Tools & MCP Usage
- Only load MCP Chrome DevTools when explicitly needed.
- Prefer file-based / API-based ingestion for email parsing.
- Avoid unnecessary file reads.

## Verification
- Use reviewer subagent to re-evaluate outputs with zero shared context.
- Use qa subagent to assert invariants:
  - Case object includes mandatory fields.
  - SLA timers set.
  - No action marked as “executed”.

## Safety
- Never perform destructive edits without explicit instruction.
- Never send external network calls unless tool-enabled.