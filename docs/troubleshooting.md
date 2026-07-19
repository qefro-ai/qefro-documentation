---
id: v1-troubleshooting
title: Troubleshooting
slug: /v1/troubleshooting
sidebar_label: Troubleshooting
---

## SDK not connecting
- verify webhook URL
- verify signing secret
- verify HTTPS reachability

## Signature mismatch
- confirm secret parity
- confirm timestamp skew window

## Authentication failure
- validate lookup and authorize logic
- validate resume response handling

## Protocol mismatch
- align protocol headers and payload protocol version

## Tool discovery missing
- ensure tool registration before listen
- run Sync Tools again
