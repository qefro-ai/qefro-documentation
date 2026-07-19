# Qefro Examples Workspace

Production-oriented, runnable SDK backends that demonstrate domain-specific tools and auth behavior.

## Run any example
1. cd examples/<example>
2. cp .env.example .env
3. npm install
4. npm start

## One-command verification

Each example includes `scripts/smoke.sh` that:
- starts the local server
- sends signed `ping`, `tools.list`, and `tool.invoke` requests
- validates success responses

Run:

```bash
cd examples/<example>
./scripts/smoke.sh
```

All examples expose POST /qefro and include:
- customer lookup and authorization handlers
- authenticated business tools
- strict input checks and structured results

## Example matrix
- basic-sdk: minimal framework pattern with session context helpers
- rest-api: REST-shaped order query tools
- ecommerce: order tracking, return creation, invoice URL generation
- crm: lead listing, note creation, escalation ticket flow
- erp: inventory visibility, PO drafts, sales-order ETA
- helpdesk: ticket intake plus KB search
- banking: account balance and beneficiary validation
- healthcare: appointment slot search and booking
- education: catalog search and enrollment checks
- multilingual: locale detection and response localization
- whatsapp: template preview and send simulation
- internal-portal: KPI snapshot and approval workflow
