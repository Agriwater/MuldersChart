---
name: production-scrutiny
description: 'Scrutinize code and deployment changes for production risk. Use for pre-ship review, operational risk checks, caching behavior, persistence assumptions, failure modes, deployment safety, and hard questions before release.'
argument-hint: 'Describe the change or release candidate you want scrutinized for production risk.'
---

# Production Scrutiny

Use this skill when a normal code review is not enough and the goal is to pressure-test release quality.

## When To Use
- Before shipping customer-facing changes
- After deployment bugs
- When changing infrastructure, persistence, routing, or asset delivery
- When a fix appears correct but needs adversarial review

## Review Standard
Assume the change will fail in the least convenient way unless proven otherwise.

## Procedure
1. Identify the exact production surface area changed.
2. Challenge the assumptions behind the change:
   - caching
   - persistence
   - startup order
   - environment variables
   - public URL behavior
   - rollback safety
3. Look for silent failure modes:
   - stale HTML referencing missing assets
   - build succeeds but runtime fails
   - health checks pass too early or too late
   - environment-specific behavior differs from local
4. Verify user impact explicitly, not indirectly.
5. Produce findings ordered by severity.
6. Call out residual risk even when no blocking issue is found.

## Focus Areas For This Repo
- Render free-tier cold start and ephemeral storage
- asset caching versus deploy rollouts
- Express SPA fallback behavior
- API-backed save flow using a filesystem target
- production host and port binding

## References
- [scrutiny-checklist](./references/scrutiny-checklist.md)
