# Research: Usage Alert Email Formats + Gmail API for Historical Analysis

## Mission

I'm building a SaaS that connects to users' Gmail, finds usage alert emails from no-code platforms, and:
1. Parses historical alerts to show trends ("You've been hitting limits for 18 months")
2. Predicts future overages based on velocity
3. Aggregates anonymized data for business intelligence

I need exact email specifications and Gmail API capabilities.

---

## Part 1: Email Format Research

For each platform below, find the EXACT email format for usage/limit alerts.

### Platforms to Research

1. **Zapier**
2. **Make.com** (formerly Integromat)
3. **Airtable**
4. **Bubble**

### For EACH Platform, Document:

#### A. Sender Information
- **From address**: Exact email (e.g., `notifications@zapier.com`)
- **From name**: Display name shown
- **Reply-to**: If different from sender
- **Are there multiple sender addresses?** (e.g., different for billing vs usage alerts)

#### B. Subject Line Patterns
- **Exact subject lines** for usage alerts at each threshold
- **Variables in subject**: Does it include percentage? Plan name? Account name?
- **Examples**:
  ```
  "You've used 80% of your Zapier tasks"
  "Action required: 100% of tasks used"
  "[Account Name] - Usage Alert"
  ```

#### C. Email Body Structure
- **Format**: HTML, plain text, or both?
- **Key data points included**:
  - Current usage percentage
  - Absolute numbers (e.g., "1,600 of 2,000 tasks")
  - Days remaining in billing cycle
  - Plan name/tier
  - Billing cycle dates
  - Link to upgrade
  - Link to usage dashboard
- **Provide example snippets** of the HTML/text structure

#### D. Threshold Alerts Sent
- What percentage thresholds trigger emails? (50%? 75%? 80%? 90%? 100%?)
- Are there "approaching limit" vs "limit reached" variants?
- Are there "overage" alerts (went OVER the limit)?
- Weekly/monthly summary emails? What do those contain?

#### E. Historical Consistency
- Have these email formats changed in the last 2-3 years?
- Are there known format variations (A/B tests, regional differences)?
- How stable are subject lines vs body content?

---

## Part 2: Gmail API Research

### A. Authentication & Scopes

1. **Minimum scopes needed** to:
   - Search emails by sender/subject
   - Read email content (body)
   - Access emails from any time period (not just recent)

2. **Scope options** (list from least to most permissive):
   ```
   gmail.readonly - Full read access (broad)
   gmail.metadata - Headers only (limited)
   gmail.labels - Label access only
   ```

3. **Can we use restricted scopes?**
   - Is there a way to ONLY access emails from specific senders?
   - Does Google offer "filtered read" access?

4. **OAuth consent screen implications**:
   - What does user see when granting access?
   - "Sensitive" vs "Restricted" scope classification
   - Google verification requirements for Gmail scopes

### B. Search Capabilities

1. **Gmail search operators available via API**:
   ```
   from:notifications@zapier.com
   subject:"usage"
   after:2022/01/01
   before:2024/01/01
   ```

2. **Can we search by sender domain?** (e.g., `from:*@zapier.com`)

3. **Rate limits for search queries**

4. **Pagination for large result sets** (user has 3 years of emails)

### C. Historical Access

1. **How far back can we access?** Any time limits?
2. **Performance for old emails** - Same speed as recent?
3. **Batch operations** - Can we fetch multiple emails efficiently?
4. **Message format options** - Full, metadata, minimal?

### D. Rate Limits & Quotas

1. **Queries per second/minute/day**
2. **Per-user vs per-application limits**
3. **Strategies for scanning years of email history efficiently**

---

## Part 3: Data Extraction Patterns

### For Each Platform, Provide:

1. **Regex patterns** to extract:
   - Usage percentage (e.g., `(\d+)%`)
   - Absolute usage numbers (e.g., `(\d+,?\d*)\s*of\s*(\d+,?\d*)`)
   - Plan/tier name
   - Billing cycle dates
   - Days remaining

2. **Example parsing code** (JavaScript/Python) for one platform

3. **Edge cases to handle**:
   - Number formatting (1,000 vs 1000)
   - Percentage formatting (80% vs 80 percent)
   - Date formats (Jan 1 vs 1/1 vs 2024-01-01)

---

## Part 4: Business Intelligence Opportunities

### What aggregate insights can we derive?

From historical email data across many users, what patterns could we detect:

1. **Platform tenure**: First alert date = proxy for "started using platform"
2. **Usage velocity**: Are alerts getting more frequent over time?
3. **Platform stacking**: Which platforms are commonly used together?
4. **Churn signals**: Alerts stopped = likely churned from platform
5. **Upgrade patterns**: Do people upgrade after hitting limits, or leave?
6. **Seasonal patterns**: More usage in Q4? Summer slowdowns?

### Privacy considerations for aggregate data

1. What can we collect/analyze ethically with user consent?
2. How to anonymize for aggregate insights?
3. GDPR/privacy implications of email content analysis?

---

## Part 5: Alternative Email Providers

Brief overview for future expansion:

### Microsoft Outlook/365
- **Graph API** equivalent capabilities
- Authentication differences
- Search operator differences

### Other providers
- Yahoo Mail API status
- Apple iCloud Mail API status (probably none?)
- Generic IMAP as fallback?

---

## Output Format

Provide findings in this structure:

```
## [Platform Name] Email Specification

### Sender Details
- From: [exact address]
- From Name: [display name]

### Subject Line Patterns
| Threshold | Subject Line |
|-----------|--------------|
| 80%       | "[exact subject]" |
| 100%      | "[exact subject]" |

### Body Data Points
- [ ] Usage percentage: Yes/No - Location in email
- [ ] Absolute numbers: Yes/No - Format
- [ ] Billing cycle dates: Yes/No - Format
- [ ] Plan name: Yes/No
- [ ] Days remaining: Yes/No

### Extraction Patterns
```javascript
// Regex for this platform
const usagePattern = /pattern/;
```

### Sample Email (anonymized)
[Provide redacted example if available]

### Format Stability
- Last known change: [date or "stable"]
- Confidence level: High/Medium/Low
```

---

## Priority

Research in this order:
1. **Zapier** (most common, likely best documented)
2. **Make.com** (good API = likely good email docs too)
3. **Airtable** (widely used)
4. **Bubble** (smaller user base, less documentation)

Then Gmail API details, then extraction patterns.

---

## Sources to Check

- Official platform documentation/help centers
- Platform community forums (users share email screenshots)
- Reddit threads about usage alerts
- GitHub projects that parse these emails
- Email marketing analysis tools that have documented these formats
- Zapier's own documentation (they send emails AND have email parsing tools)
