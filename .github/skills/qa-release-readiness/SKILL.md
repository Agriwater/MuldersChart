---
name: qa-release-readiness
description: 'Run QA and release-readiness checks before shipping. Use for smoke testing, deployment verification, regression checks, persistence checks, API validation, and shipping decisions for production readiness.'
argument-hint: 'Describe the release candidate, environment, or area you want validated before shipping.'
---

# QA Release Readiness

Use this skill before shipping changes to production or signing off a release candidate.

## When To Use
- Before merging deployment-affecting changes
- Before promoting a build to production
- After bug fixes that touch routing, assets, API, or persistence
- After infrastructure changes such as Render config updates

## Primary Goal
Catch issues that are easy to miss when code builds but is not actually production ready.

## Procedure
1. Build the app locally with `npm run build`.
2. Check the repository for obvious uncommitted or accidental changes.
3. Validate runtime-critical paths:
   - root page loads
   - `/api/health` responds
   - `/api/graph` loads
   - save flow still works for the chosen environment constraints
4. Verify environment assumptions:
   - free tier versus persistent storage
   - host binding
   - production asset serving
5. Perform a UI smoke test:
   - sliders move
   - graph renders
   - relationship editor appears
   - save action behaves as expected
6. Record residual risks clearly if the environment itself limits behavior.
7. Do not call something production ready if persistence, caching, or startup behavior is still uncertain.

## Required Checks
- Build success
- No new runtime errors caused by the change
- Deployed URL works in a fresh browser session
- API routes return expected data
- Environment limitations are documented

## References
- [release-checklist](./references/release-checklist.md)
