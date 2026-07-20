---
id: v1-whatsapp
title: WhatsApp
slug: /v1/whatsapp
unlisted: true
sidebar_label: WhatsApp
---

## Identity and session
WhatsApp identity can seed customer lookup and session reuse.

## Invocation flow
- incoming message
- resolve customer
- authorize if required
- invoke tool
- send concise response

## Rich response guidance
Return compact JSON suitable for friendly chat summaries and follow-up prompts.
