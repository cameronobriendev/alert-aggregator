# Usage Alert Email Formats and Gmail API: A Technical Reference

No-code platforms send predictable notification emails at standardized thresholds, making historical email analysis viable for tracking usage patterns. **Gmail API's `gmail.readonly` scope provides full search and body access**, but requires Google verification for production apps with 100+ users. The four major platforms - Zapier, Make.com, Airtable, and Bubble - all send alerts at 80-100% thresholds, with consistent sender addresses and parseable body structures that have remained stable since at least 2020.

---

## Platform email formats reveal consistent patterns

Each platform uses a primary notification address for usage alerts, with subject lines that typically include usage percentages and body content containing absolute numbers, billing context, and upgrade CTAs.

### Zapier

**Sender**: `contact@zapier.com` serves as the primary address for all usage and billing notifications. Display name appears simply as "Zapier." The same address handles support replies and system notifications, with marketing emails coming from a separate `blog@send.zapier.com` domain.

| Threshold | Subject Pattern | Body Key Phrase |
|-----------|-----------------|-----------------|
| **80%** | "Nearing your subscription's task limit" | "Just a heads up: You're now over 80% of your Zapier task limit" |
| **100%** | "You've reached your task limit" | "we'll start holding your tasks" |
| **Overage** | "You're now using tasks above your plan's limit" | "surpassed your subscription's task limit" |
| **Pay-per-task 80%** | (Same pattern) | Additional overage warning |

The email body includes personalized greeting with first name, **absolute usage statement** (implicit percentage-based), consequence warning ("held tasks will be stored in your Task History"), a Task History link with UTM tracking (`utm_source=mailgun&utm_campaign=mlgn-gbl-notif-txn-limit_warning`), and an "Upgrade My Account" CTA button. Emails use HTML format delivered via Mailgun infrastructure.

**Format stability**: Core messaging has remained consistent since at least 2020. January 2024 introduced pay-per-task billing notifications adding 80% and 100% overage threshold emails.

### Make.com (formerly Integromat)

**Sender**: Official documentation doesn't publicly list exact addresses, but emails originate from `@make.com` domain (legacy accounts may still receive from `@integromat.com`). Expected patterns include `noreply@make.com` or `notifications@make.com`.

| Threshold | Alert Type | Timing |
|-----------|-----------|--------|
| **75%** | "Approaching operations limit" | Within 15 minutes of hitting threshold |
| **90%** | Critical approaching limit | Within 15 minutes |
| **100%** | Limit reached / Scenarios paused | Immediate |

The body includes an **operations usage visualization chart**, current count vs limit (e.g., "4,500/5,000 operations"), percentage used, organization name, dashboard links, and upgrade options.

**Critical terminology change**: As of August 2024, Make.com replaced "operations" with "credits" as the billing unit - subject lines and email content now reflect this change.

### Airtable

**Sender**: `noreply@airtable.com` for most notifications; `automation@mail.airtable.com` for automation-related emails. Display name: "Airtable."

| Alert Type | Thresholds | Subject Pattern |
|------------|------------|-----------------|
| Automation execution | 80%, 90%, 100% | "Your automation [Name] has failed [X] time in [Table] on [Date]" |
| API rate limits | At limit | "API billing plan limit exceeded" |
| Email sending | At limit | "Sending this email would exceed the daily limit..." |

Airtable monitors multiple usage vectors: automation runs per month, records per base, API calls (Free: 1,000/workspace/month), and storage (Free: 2GB, Team: 5GB, Business: 20GB per base). Emails include links to failed run history in Automation history, workspace settings page links, and plan tier information.

### Bubble

**Sender**: Emails delivered via SendGrid; display name "Bubble." Exact sender address varies by SendGrid configuration.

| Threshold | Trigger Condition | Alert Type |
|-----------|-------------------|------------|
| **75%** | Monthly WU allowance | Standard alert |
| **100%** | Monthly WU allowance | Overages begin notification |
| **Spike detection** | >3% of monthly WU in last hour | Spike alert |
| **Spike detection** | >6% in 6 hours, >10% in 12 hours | Extended spike |

Sample body content (capacity alert):
> "Hello, We are sending this email to let you know that your application [app_name] has hit its maximum capacity usage for 57 minutes over the last 24 hours."

Bubble's alert system is highly configurable - users can set custom thresholds by WU amount (minimum 1,000) and time period (hour, day, week, month) in Settings > Notifications.

---

## Gmail API provides comprehensive historical access

The Gmail API offers **no time limit on historical email access** - you can retrieve emails from account creation (2004 for earliest accounts). The critical constraint is scope verification requirements.

### Authentication scopes from least to most permissive

| Scope | Classification | Body Access | Search Support |
|-------|----------------|-------------|----------------|
| `gmail.labels` | Non-sensitive | No | No |
| `gmail.metadata` | **Restricted** | No | No (no `q` parameter) |
| `gmail.readonly` | **Restricted** | Yes | Yes |
| `gmail.modify` | Restricted | Yes | Yes |
| `mail.google.com` | Restricted | Yes | Yes (full access) |

**Minimum scope for your use case**: `gmail.readonly` is required for searching by sender/subject AND reading message bodies. The `gmail.metadata` scope does NOT support the `q` (search query) parameter - you cannot use search operators like `from:` with metadata-only access.

**Critical limitation**: Gmail scopes operate at the mailbox level. You cannot restrict API access to specific senders via OAuth; filtering must be done application-side via search queries.

### OAuth verification requirements

Apps in production with **100+ users** accessing restricted scopes require:
- Brand verification (2-3 business days)
- Sensitive scope verification (weeks to months)
- **Annual CASA Tier 2/3 security assessment** (~$500/year or free self-scan)

Apps under 100 users or in "Testing" mode are exempt.

### Search capabilities match Gmail web interface

The API supports all standard Gmail search operators via the `q` parameter:

```
# Multi-platform usage alerts from last 3 years
(from:*@zapier.com OR from:*@make.com OR from:noreply@airtable.com) subject:(usage OR limit OR alert) newer_than:3y

# Zapier-specific with date range
from:contact@zapier.com subject:task after:2022/01/01 before:2025/01/01
```

**Key operators**: `from:*@domain.com` (wildcard works), `subject:`, `after:`/`before:` (YYYY/MM/DD), `newer_than:`/`older_than:` (y/m/d units), Boolean `OR`/`NOT` (must be uppercase).

### Rate limits allow efficient bulk scanning

| Limit Type | Value |
|------------|-------|
| Per project | 1,200,000 quota units/minute |
| Per user | 15,000 quota units/minute |
| `messages.list` cost | 5 units |
| `messages.get` cost | 5 units |

**3-year scan estimate** (10,000 emails): ~50,500 quota units total, completing in approximately 4 minutes within per-user limits.

**Best practices**: Use `maxResults=500` (maximum per page), request `format=metadata` initially then fetch `full` only when needed, batch requests (up to 100 per batch), and implement exponential backoff for 429 errors.

### Message format options

| Format | Returns | Use Case |
|--------|---------|----------|
| `minimal` | ID and labels only | Fast listing |
| `metadata` | Headers (From, To, Subject, Date) | Header analysis |
| `full` | Complete MIME structure with body | Content extraction |
| `raw` | Base64url RFC 2822 message | Archival |

Email bodies arrive in MIME format within the `payload` field - typically `multipart/alternative` containing `text/plain` and `text/html` parts, each base64url encoded.

---

## Alternative APIs offer viable fallbacks

### Microsoft Graph API emerges as the best Gmail alternative

Microsoft Graph provides comparable capabilities with some differences:

| Capability | Gmail API | Microsoft Graph |
|------------|-----------|-----------------|
| Search syntax | Gmail operators | KQL (Keyword Query Language) |
| Minimum scope | `gmail.readonly` | `Mail.Read` |
| Historical access | Full | Full (no archive mailboxes) |
| Rate limits | 15K units/user/min | ~10K requests/10min/user/app |
| Search result limit | Paginated | 275 items per folder per search |
| Verification | Google verification + CASA | Publisher verification (multi-tenant) |

**Microsoft authentication**: Work/school accounts have full access; personal Outlook.com accounts support delegated permissions with some restrictions. Multi-tenant apps require Publisher verification via Microsoft AI Cloud Partner Program.

### Yahoo and iCloud lack modern APIs

**Yahoo Mail**: No REST API exists. Access requires IMAP with OAuth 2.0, must apply for commercial access via developer form, and searches are capped at **1,000 records** on recipient fields.

**iCloud Mail**: No public API. Access via IMAP only (`imap.mail.me.com:993`) requiring app-specific passwords generated at appleid.apple.com. Daily sending limit of 1,000 emails.

### IMAP provides universal fallback

IMAP SEARCH (RFC 3501) supports: `FROM`, `SUBJECT`, `BODY`, `TEXT`, `BEFORE`/`SINCE`/`ON`, `HEADER <field> <string>`. Operators use Polish notation: `OR FROM john FROM jane`, `NOT DELETED`.

**Recommended libraries**: Python's `IMAPClient` (Pythonic wrapper) or `aioimaplib` (async); Node.js's `ImapFlow` (modern Promise-based) or `node-imap` (mature, IDLE support).

**Key limitation**: IMAP offers no relevance ranking, attachments typically aren't indexed for search, and there's no batch API - requests are connection-based rather than quota-based.

---

## Data extraction patterns for parsing email content

### Regex patterns for key fields

**Usage percentage**:
```javascript
// Matches: 80%, 80 percent, 80pct, 80 per cent
/(\d+(?:\.\d+)?)\s*(?:%|percent|pct|per\s*cent)/gi
```

**Absolute usage numbers**:
```javascript
// Matches: "1,600 of 2,000 tasks", "4,500/5,000 operations"
/([\d,]+)\s*(?:of|out\s*of|\/)\s*([\d,]+)\s*(\w+)?/gi
```

**Plan tier names**:
```javascript
// Matches: Professional Plan, Team, Enterprise Tier
/\b(Free|Starter|Basic|Standard|Professional|Pro|Team|Business|Enterprise|Premium)\s*(?:Plan|Tier)?/gi
```

**Billing dates** (multiple formats):
```javascript
// US: MM/DD/YYYY
/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{2,4})\b/g

// Written: January 15, 2024
/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/gi
```

**Days remaining**:
```javascript
// Matches: "5 days remaining", "3 days left"
/(\d+)\s*days?\s*(?:remaining|left|until)/gi
```

### Platform-specific identifiers

| Platform | Sender Pattern | Subject Keywords | UTM/Link Markers |
|----------|---------------|------------------|------------------|
| Zapier | `contact@zapier.com` | "task limit", "held tasks" | `utm_source=mailgun`, `limit_warning` |
| Make.com | `*@make.com` | "operations", "credits" | `make.com`, `eu1.make.com` |
| Airtable | `noreply@airtable.com` | "automation", "failed" | `airtable.com/workspace` |
| Bubble | via SendGrid | "capacity", "workload" | "Logs Tab", "Best, Bubble" |

### Edge case handling

**Number format detection** (US vs European):
```python
def normalize_number(num_str, format_hint=None):
    commas, periods = num_str.count(','), num_str.count('.')

    if commas and periods:
        # Both present: last separator indicates decimal
        if num_str.rfind(',') > num_str.rfind('.'):
            return float(num_str.replace('.', '').replace(',', '.'))  # EU
        return float(num_str.replace(',', ''))  # US
    elif commas and not periods:
        return float(num_str.replace(',', ''))  # US thousands
    elif periods and not commas:
        # Check if period is thousands separator (EU) or decimal
        parts = num_str.split('.')
        if all(len(p) == 3 for p in parts[1:]):
            return float(num_str.replace('.', ''))  # EU thousands
        return float(num_str)  # Decimal
    return float(num_str)
```

---

## Privacy and GDPR require explicit consent for email analysis

Email content constitutes personal data under GDPR Article 4. Analysis requires one of two legal bases:

**Consent (Article 6(1)(a))**: Must be freely given, specific, informed, and unambiguous. Implement double opt-in, provide simple withdrawal mechanisms, and maintain documentary evidence.

**Legitimate Interest (Article 6(1)(f))**: Requires documented Legitimate Interests Assessment (LIA) balancing organizational needs against individual rights. Generally applies to transactional/service email analysis but requires easy opt-out.

### Key compliance requirements

- **Data minimization**: Extract only fields necessary for stated purpose
- **Purpose limitation**: Cannot repurpose collected data without new consent
- **Retention limits**: Delete data when no longer needed (no fixed GDPR maximum)
- **Data subject rights**: Must support access, rectification, erasure, portability requests
- **Breach notification**: Report to supervisory authority within **72 hours** if risk to individuals

### Anonymization vs pseudonymization

**Pseudonymization** (encryption, tokenization, hashing) keeps data under GDPR scope - it's reversible with the key. **Anonymization** removes data from GDPR entirely but requires irreversibility: the individual cannot be identified "by all means reasonably likely to be used."

For aggregate usage insights, pseudonymization is typically sufficient. Strip email addresses, replace account identifiers with random tokens, aggregate percentages across time windows, and store the mapping key separately with strict access controls.

---

## Conclusion

Historical email analysis for no-code platform usage tracking is technically feasible with predictable email formats across all major platforms. **Zapier offers the most stable, well-documented format** with consistent sender addresses and subject patterns since 2020. Gmail API's `gmail.readonly` scope provides the necessary access for search and body extraction, though production apps face verification overhead.

For cross-platform implementations, prioritize Gmail API for Google Workspace users and Microsoft Graph for Outlook users, falling back to IMAP for Yahoo and iCloud. Build regex extractors that handle US/EU number formats and multiple date patterns. Document your legal basis under GDPR, implement consent collection, and apply pseudonymization when storing extracted data for aggregate analysis.
