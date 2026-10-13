---
name: Groq output limits
description: Account-tier output-token constraints that affect streamed Gadus completions.
---

Streamed Gadus completions should use a conservative per-request output cap because Groq on-demand accounts can reject larger reservations with a 429 output-tokens-per-minute error even when the model is accessible.

**Why:** The accessible model returned a request-too-large rate-limit error when the route reserved 4096 output tokens, while a 768-token cap allowed all 12 specialized modes to complete successfully.

**How to apply:** If the configured Groq model or account tier changes, re-check the provider’s output-token limit before increasing the stream cap.