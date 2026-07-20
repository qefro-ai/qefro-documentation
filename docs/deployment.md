---
id: v1-deployment
title: Deployment
slug: /v1/deployment
unlisted: true
sidebar_label: Deployment
---

## Production checklist
- HTTPS everywhere
- environment-specific secrets
- SDK connection healthy
- tool sync complete
- backups configured

## Recommended topology
- API service
- portal service
- SDK backend service
- PostgreSQL
- Redis
- reverse proxy

## Health checks
- API health endpoint
- SDK connection Test Connection
- tool sync validation
