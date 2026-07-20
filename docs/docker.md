---
id: v1-docker
title: Docker
slug: /v1/docker
unlisted: true
sidebar_label: Docker
---

## Dockerfile guidance
- pin runtime versions
- install only production dependencies
- run as non-root

## Docker Compose
Use compose for local parity with API, DB, Redis, and SDK backend.

## Production notes
- explicit restart policy
- resource limits
- immutable image tags
