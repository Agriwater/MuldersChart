# Scrutiny Checklist

## Ask These Questions
- What breaks first on a fresh deploy?
- What breaks only in production and not locally?
- What happens if the browser has cached old HTML?
- What happens if the service restarts?
- What happens if persistence disappears?
- What happens on the first request after a cold start?

## Deployment Risk Checks
- HTML caching policy is deliberate
- asset caching policy is deliberate
- startup logs confirm host, port, and data file path
- health checks reflect real readiness

## Product Risk Checks
- critical user flow works in a fresh session
- errors degrade clearly instead of silently
- environment limitations are visible to the team

## Output Expectations
- findings first
- assumptions second
- summary last