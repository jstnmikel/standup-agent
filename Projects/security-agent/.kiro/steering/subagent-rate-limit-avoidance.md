# Subagent Rate Limit Avoidance

## Problem

Subagent invocations that pass large context files (e.g., requirements.md + design.md together) frequently hit "Too many requests" rate limit errors. This blocks progress and frustrates users.

## Rules

### 1. Never pass multiple large spec files as context to a subagent simultaneously

When invoking a subagent (e.g., `feature-requirements-first-workflow`), do NOT pass both `requirements.md` AND `design.md` as contextFiles at the same time if either file exceeds ~200 lines. Pass only the most relevant file for the current phase.

- For the `requirements` preset: pass only `requirements.md` and `.config.kiro`
- For the `design` preset: pass only `requirements.md` and `.config.kiro` (the subagent will read design.md itself if needed)
- For the `tasks` preset: pass only `design.md` and `.config.kiro` (not requirements.md)

### 2. If a subagent call fails with "Too many requests", do NOT retry immediately

Wait and then try one of these alternatives in order:
1. Reduce the contextFiles passed — remove the largest file and retry
2. If still failing, build the artifact directly without delegating to a subagent
3. Never retry the same failing call more than once without changing something

### 3. For tasks.md creation specifically, build it directly

The tasks.md file is the most common failure point because it requires both requirements.md and design.md as context. Instead of delegating to a subagent:
- Read the design.md file directly
- Write tasks.md using the `fsWrite` tool directly
- This avoids the rate limit entirely

### 4. Never respond with just "Understood" when a rate limit error occurs

When a subagent call fails with "Too many requests":
- Immediately tell the user what happened
- Explain which alternative approach will be used
- Proceed with the alternative without waiting for user confirmation

### 5. Avoid duplicate message acknowledgment loops

When the same user message appears multiple times (duplicate submissions), respond only once with the actual action taken. Do not respond "Understood" to each duplicate — this creates a loop where the user thinks nothing is happening.

## Summary

| Situation | Action |
|---|---|
| Subagent fails with rate limit | Reduce context or build directly, tell user immediately |
| tasks.md creation | Always build directly with fsWrite, never delegate |
| Large spec files needed | Pass only the most relevant one, not both |
| Duplicate user messages | Respond once with the action, not "Understood" to each |
