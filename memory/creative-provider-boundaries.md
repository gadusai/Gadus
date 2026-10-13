---
name: Creative provider boundaries
description: Durable integration rules for Gadus image, video, and live web providers.
---

Gadus creative and browsing providers are accessed by the API server, while the client receives safe result URLs, source metadata, and user-facing recovery messages.

**Why:** Provider credentials and provider-specific failures should never leak into the browser or raw user-facing errors.

**How to apply:** Add new provider calls behind API routes, keep media mutations explicit, and preserve a friendly fallback when an external service is unavailable.