---
id: v1-authentication
title: Authentication
slug: /v1/authentication
sidebar_label: Authentication
---

## Ownership model
Authentication is owned by your backend framework handlers.

Qefro does not:
- send OTP
- verify OTP
- issue customer passwords

## Session reuse
Qefro reuses valid auth context until token expiry.

## Challenge and resume
Use challenge for interactive verification, then continue with tool.resume.
