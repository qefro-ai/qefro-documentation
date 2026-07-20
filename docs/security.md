---
id: v1-security
title: Security
slug: /v1/security
unlisted: true
sidebar_label: Security
---

## SDK signing
Validate:
- X-Qefro-Signature
- X-Qefro-Timestamp
- protocol headers

## Secrets
- store in secret manager
- rotate regularly
- avoid plaintext in source control

## Least privilege
- narrow tool permissions
- separate staging and production credentials

## Production recommendations
- short token lifetimes
- access logs and audit review
- periodic secret rotation drills
