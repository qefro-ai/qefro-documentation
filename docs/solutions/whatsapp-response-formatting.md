---
id: whatsapp-response-formatting
title: WhatsApp response formatting
description: Style guide for Marketplace App flow messages delivered via WhatsApp.
sidebar_label: WhatsApp response formatting
---

# WhatsApp response formatting

This guide explains how to write flow `message` and `ask` steps that look professional when delivered via WhatsApp. It covers the formatting syntax the runtime actually supports, style recommendations for mobile readability, and reusable response patterns.

**Core principle:** WhatsApp responses should be concise, structured, and easy to scan on a mobile screen.

## What the runtime supports

Before writing any formatted messages, understand the conversion pipeline.

### Markdown-to-WhatsApp conversion

Every message sent via WhatsApp passes through `to_whatsapp_text()`, which converts standard Markdown to WhatsApp's native formatting:

| Markdown in flow YAML | WhatsApp renders |
|---|---|
| `**bold text**` | *bold text* |
| `__bold text__` | *bold text* |
| `## Heading` | *Heading* |
| `- list item` | • list item |
| `* list item` | • list item |

This conversion is automatic. Write standard Markdown in your flow YAML; the runtime handles the rest.

### Template variables

Message steps support `{{variable}}` interpolation:

```yaml
- type: message
  message: "Booking {{booking_reference}} confirmed for {{travel_date}}."
```

- Simple fields: `{{name}}`, `{{date}}`, `{{status}}`
- Dotted paths: `{{booking.booking_reference}}`, `{{package.name}}`
- List rendering: `{{items_text}}` (auto-generated from entity list results)
- Unknown variables render as empty string

### Image delivery

When an entity has `type: image` fields and the tool step output includes `__media_fields`, images are delivered automatically alongside the text message. Up to 3 images per message. Images are sent as separate WhatsApp media messages with the entity data.

### What is NOT supported

- No italic, strikethrough, or monospace conversion from Markdown
- No conditional logic inside message text (`{% if %}` etc.)
- No formatting filters (`{{price | currency}}`)
- No per-channel message variants in a single flow
- No interactive buttons from flow YAML (buttons come from `choices` on `ask` steps)
- No image captions from flow message text (images are sent separately)

## Style recommendations

These are guidelines for writing effective WhatsApp messages. They are not enforced by the runtime.

### Lead with the answer

Avoid filler phrases. State the result immediately.

**Avoid:**

```text
Sure, I can definitely help you with that. Let me check our available properties for you.
```

**Prefer:**

```yaml
message: |
  **Available Properties**

  I found 3 properties matching your request.
  {{items_text}}
```

### Use short sections

One concept per line. Clear separation between sections.

```yaml
message: |
  **Property Details**

  **{{property.title}}**
  Location: {{property.city}}
  Price: {{property.currency}} {{property.price}}
  Bedrooms: {{property.bedrooms}}
  Bathrooms: {{property.bathrooms}}
```

### Use emojis as visual markers

Emojis improve scanability when used sparingly as section markers. Do not decorate every word.

**Recommended emoji vocabulary:**

| Context | Emoji |
|---|---|
| Property / listing | 🏠 |
| Location | 📍 |
| Price / amount | 💰 |
| Date | 📅 |
| Time | ⏰ |
| Person / guest | 👤 |
| Phone | 📞 |
| Email | 📧 |
| Success | ✅ |
| Warning | ⚠️ |
| Error | ❌ |
| Search | 🔍 |
| Details | 📋 |
| Viewing / appointment | 📅 |
| Travel | ✈️ |
| Restaurant | 🍽️ |
| Clinic / health | 🏥 |

**Avoid emoji overload:**

```text
🏠🏠🏠 PROPERTY 🏠🏠🏠
```

**Prefer:**

```text
🏠 **Property Details**
```

### Keep messages mobile-friendly

- Short paragraphs (1-2 sentences)
- One field per line for structured data
- Compact lists over wide tables
- Clear blank-line separation between sections
- No decorative separators (`---`, `===`)

### Avoid exposing internals

Never show customers:

- Stack traces or Rust errors
- Internal capability names (`entity.property.list`)
- Database UUIDs
- Internal service names
- Raw JSON

## Response patterns

Reusable patterns for common flow scenarios. Adapt these to your app's domain.

### Welcome

```yaml
- type: message
  message: |
    👋 **Welcome to {{app_name}}!**

    I can help you with:

    🔍 Search
    📅 Book an appointment
    📋 View details

    What would you like to do?
```

### Search results

```yaml
- type: message
  message: |
    🔍 **Results**

    I found {{count}} matches.
    {{items_text}}

    Would you like more details on any of these?
```

### Single entity detail

```yaml
- type: message
  message: |
    🏠 **{{property.title}}**

    📍 {{property.city}}
    💰 {{property.currency}} {{property.price}}
    🛏️ {{property.bedrooms}} bedrooms
    🛁 {{property.bathrooms}} bathrooms

    Would you like to schedule a viewing?
```

### Confirmation

```yaml
- type: message
  message: |
    ✅ **Viewing Scheduled**

    🏠 **Property:** {{property_title}}
    📅 **Date:** {{date}}
    ⏰ **Time:** {{time}}

    We'll see you then!
```

### No results

```yaml
- type: message
  message: |
    🔍 **No Results Found**

    I couldn't find anything matching those criteria.

    Try a different city or property type.
```

### Error

```yaml
- type: message
  message: |
    ⚠️ **Something Went Wrong**

    I couldn't complete that request right now.
    Please try again.
```

### Ask (single question)

```yaml
- type: ask
  field: date
  message: |
    📅 **Choose a date**

    When would you like to visit?
```

### Multi-step collection

Keep each question focused on one field:

```yaml
- type: ask
  field: destination
  message: "Where would you like to travel? (e.g., Dubai, Maldives, Istanbul)"

- type: ask
  field: travel_date
  message: "When are you planning to travel?"

- type: ask
  field: travelers_count
  message: "How many travelers?"
```

## Domain-specific examples

### Real estate

```yaml
message: |
  🏠 **Property 1**

  **Sunrise Residency**
  📍 Ramanathapuram
  💰 ₹35,00,000
  🛏️ 2 bedrooms
  🛁 2 bathrooms

  ---

  🏠 **Property 2**

  **Green View Villa**
  📍 Madurai
  💰 ₹68,00,000
  🛏️ 3 bedrooms
  🛁 3 bathrooms

  Which property would you like to know more about?
```

### Clinic

```yaml
message: |
  ✅ **Appointment Booked**

  👤 **Patient:** {{patient_name}}
  👨‍⚕️ **Doctor:** {{practitioner_name}}
  📅 **Date:** {{date}}
  ⏰ **Time:** {{time}}

  Please arrive 10 minutes early.
```

### Travel

```yaml
message: |
  ✅ **Booking Confirmed**

  📋 **Reference:** {{booking.booking_reference}}
  ✈️ **Package:** {{package.name}}
  📅 **Travel Date:** {{booking.travel_date}}
  👤 **Travelers:** {{booking.travelers_count}}
  💰 **Total:** {{booking.currency}} {{booking.total_amount}}

  Our team will confirm your booking shortly.
```

### Restaurant

```yaml
message: |
  ✅ **Reservation Booked**

  👤 **Guest:** {{guest_name}}
  📅 **Date:** {{date}}
  👥 **Party size:** {{guest_count}}

  See you soon!
```

## Complete conversation example

A realistic multi-turn flow conversation via WhatsApp:

**User:** "I want to see properties"

**Assistant:**

```text
🏠 **Find a Property**

What type of property are you looking for?
```

**User:** "Apartment"

**Assistant:**

```text
📍 **Location**

Which city would you prefer?
```

**User:** "Madurai"

**Assistant:**

```text
🔍 **Properties Found**

I found 2 apartments in Madurai:

**1. Green View Apartment**
💰 ₹48,00,000
🛏️ 2 BHK

**2. Lake View Apartment**
💰 ₹55,00,000
🛏️ 3 BHK

Which one would you like to know more about?
```

## Flow YAML and formatting

Message steps use standard YAML string values. The runtime interpolates `{{variable}}` references, then the WhatsApp delivery layer converts Markdown to WhatsApp formatting.

```yaml
- id: show_property
  type: message
  message: |
    🏠 **{{property.title}}**

    📍 {{property.city}}
    💰 {{property.currency}} {{property.price}}
    🛏️ {{property.bedrooms}} bedrooms

    Would you like to schedule a viewing?
```

What happens at delivery time:

1. `{{property.title}}` is replaced with the actual value from flow state
2. `**text**` is converted to `*text*` (WhatsApp bold)
3. The result is sent via Meta Cloud API as a WhatsApp text message

This conversion applies to all WhatsApp-bound messages regardless of source (flow message, AI reply, or system notification).

## Metadata architecture principle

Formatting guidance belongs to the flow YAML authoring layer. The Marketplace App remains metadata-driven — the runtime executes the metadata and handles channel-specific rendering automatically.

Do not add domain-specific formatting logic to the runtime. Instead, write well-formatted messages directly in your flow YAML using the Markdown syntax documented above.

## What not to do

**Don't** use excessive emojis:

```text
🏠🏠🏠🏠🏠
WELCOME!!!
😊😊😊😊😊
```

**Don't** return raw JSON to customers:

```text
{"id": "abc-123", "status": "confirmed", "total": 4500}
```

**Don't** expose internal capability names:

```text
Calling entity.property.list with filter status=active...
```

**Don't** expose UUIDs or internal IDs:

```text
Your booking a3f7c891-4e2d-... has been confirmed.
```

**Don't** write huge paragraphs:

```text
I have searched through our entire database of properties and I found several that match your criteria including apartments, villas, and commercial spaces in various locations around the city with different price ranges and amenities...
```

**Don't** repeat information:

```text
Your booking BK-1001 has been confirmed.
Confirmation number: BK-1001
Your reference BK-1001 is now confirmed.
```

## Cross-references

- [Flow steps](/docs/solutions/workflows) — full `message` and `ask` step reference
- [Entity schema](/docs/solutions/entity-schema) — `type: image` fields and media delivery
- [Flow parameters](/docs/solutions/flow-parameters) — `input_map`, constants, and template variables
- [Runtime execution](/docs/solutions/runtime-execution) — how flows are executed end-to-end
- [Manifest reference](/docs/solutions/manifest) — app metadata structure
