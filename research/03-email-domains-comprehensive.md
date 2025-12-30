# Email Whitelisting Guide for No-Code Automation Platforms

**For email filtering and whitelisting purposes**, this report identifies all sender domains, addresses, and email infrastructure used by Zapier, Make.com, Airtable, and Bubble.io. Each platform uses a combination of primary domains, subdomains, and third-party email service providers that must be whitelisted for reliable notification delivery.

---

## Zapier: Most complex email infrastructure with four ESP providers

Zapier operates the most sophisticated email infrastructure among these platforms, utilizing **four major third-party email service providers**: HubSpot, SendGrid, Mailgun, and SparkPost. Their SPF record for mail.zapier.com confirms this multi-provider architecture.

### Primary domains and subdomains

| Domain | Purpose | Source |
|--------|---------|--------|
| **@zapier.com** | All system notifications, billing alerts, error notifications, activity summaries | Zapier Help Center |
| **@mail.zapier.com** | Transactional email sending subdomain | SPF record analysis |
| **@zapiermail.com** | Outbound emails via "Email by Zapier" action (format: no-reply.xxxxx@zapiermail.com) | Zapier documentation |
| **@robot.zapier.com** | Email Parser addresses | Zapier Help articles |
| **@*.interfaces.zapier.com** | Zapier Interfaces login codes (e.g., no-reply@em9537.interfaces.zapier.com) | Community forums |
| **@parser.zapier.com** | Email parser service | Zapier documentation |

### Specific sender addresses

| Address | Notification Type |
|---------|-------------------|
| contact@zapier.com | Vendor forms, support ticket replies |
| support@zapier.com | Customer support communications |
| phishing@zapier.com | Security concern responses |
| press@zapier.com | Press inquiry responses |

### Third-party email providers (from SPF record)

Zapier's mail.zapier.com SPF record reveals the complete sending infrastructure:

```
v=spf1 include:7462085.spf03.hubspotemail.net include:sendgrid.net include:mailgun.org exists:%{i}._spf.sparkpostmail.com -all
```

| Provider | Domain to Whitelist | Purpose |
|----------|---------------------|---------|
| **HubSpot** | hubspotemail.net | Marketing and sales emails |
| **SendGrid** | sendgrid.net | Transactional emails |
| **Mailgun** | mailgun.org | Inbound email parsing, delivery |
| **SparkPost** | sparkpostmail.com | Email delivery |

**Recommended wildcard patterns for Zapier:**
- `*@zapier.com`
- `*@*.zapier.com`
- `*@zapiermail.com`
- `*@robot.zapier.com`

---

## Make.com: Regional zone-based sender addresses

Make.com (formerly Integromat, rebranded February 2022) does not publish an official whitelist document, but research confirms they send from both current and legacy domains across **multiple regional zones**.

### Primary and legacy domains

| Domain | Status | Purpose |
|--------|--------|---------|
| **make.com** | Active | Current primary domain |
| **integromat.com** | Legacy | May still be used for migrated accounts |
| **make.celonis.com** | Active | Enterprise Celonis integration |

### Regional zone subdomains

Make.com assigns users to specific regional zones at account creation, affecting which subdomain their notifications originate from:

| Zone | Region | Expected Sender Pattern |
|------|--------|------------------------|
| **eu1.make.com** | Europe Region 1 | noreply@eu1.make.com |
| **eu2.make.com** | Europe Region 2 | noreply@eu2.make.com |
| **us1.make.com** | US Region 1 | noreply@us1.make.com |
| **us2.make.com** | US Region 2 | noreply@us2.make.com |
| **eu1.make.celonis.com** | Celonis Enterprise EU | Enterprise notifications |
| **us1.make.celonis.com** | Celonis Enterprise US | Enterprise notifications |

### Notification types from Make.com

Based on official help documentation (help.make.com/manage-your-email-preferences):

- **Error Notifications**: Sent immediately when scenario errors occur, followed by digest email after 5 minutes
- **Warning Notifications**: Connection problems and issues requiring attention, digest after 15 minutes
- **Deactivation Notifications**: Sent when Make disables a scenario due to recurring errors
- **Platform Updates**: Feature announcements, special offers, Make Academy updates

**Recommended whitelist configuration:**
```
*@make.com
*@*.make.com
*@integromat.com
*@*.integromat.com
*@make.celonis.com
*@*.make.celonis.com
```

---

## Airtable: Two primary domains with official whitelist guidance

Airtable provides the clearest official guidance, explicitly recommending whitelisting **airtable.com** and **airtableemails.com** in their account verification documentation.

### Officially recommended domains

| Domain | Purpose | Source |
|--------|---------|--------|
| **airtable.com** | Primary domain for system emails, support, collaboration | Airtable Support Docs |
| **airtableemail.com** | Automation-generated emails | Official "Send Email" action documentation |
| **sync.airtable.com** | Emailed Data Sync integration (CSV attachments) | Airtable Sync documentation |

### Specific sender addresses

| Address | Notification Type | Source |
|---------|-------------------|--------|
| **noreply+automations@airtableemail.com** | All "Send Email" automation action emails | Official documentation—cannot be changed |
| **noreply@airtable.com** | System notifications, mentions, workspace invites, collaboration | Community forums |
| **support@airtable.com** | Customer support responses, service credit requests | SLA page |
| **team@airtable.com** | Support team communications, base access sharing | Community threads |
| **[custom]-[hash]@sync.airtable.com** | Emailed Data Sync feature | Sync integration docs |

### Notification trigger thresholds

Airtable sends automated alerts at specific usage thresholds that administrators should expect:

- **Automation limits**: Workspace owners notified at **80%, 90%, and 100%** of automation usage
- **AI credits**: Alerts when usage exceeds **75%** of credit limit
- **Data retention**: Notifications at **30, 60, and 90 days** before inactive base deletion
- **Automation failures**: Sent to the last person who edited/toggled the automation

**Important note**: Automation emails always display as "Airtable Automations" in the From field and will always originate from `noreply+automations@airtableemail.com`—this cannot be customized.

---

## Bubble.io: SendGrid-powered with app-specific sender addresses

Bubble.io uses **SendGrid (Twilio)** as their email infrastructure provider. Their sender addresses are unique because app-generated emails include the application name in the sender address.

### Primary domains

| Domain | Purpose | Source |
|--------|---------|--------|
| **bubbleapps.io** | All app-generated emails (default Bubble sender) | Official Bubble Manual |
| **bubble.io** | Corporate/system emails, forum notifications | Crunchbase, forum |
| **bubble.is** | Legacy domain (may still be in use) | Forum discussion |

### App-generated email format

Bubble's default sender format for app emails is dynamic: `[your-appname]-no-reply@bubbleapps.io`

Examples observed in forum discussions:
- `marketplace-formation-1234-no-reply@bubbleapps.io`
- `test-app-no-reply@bubbleapps.io`
- `my-saas-app-no-reply@bubbleapps.io`

### System and corporate addresses

| Address | Purpose |
|---------|---------|
| **noreply@bubble.io** | Forum summary notifications, system notifications |
| **support@bubble.io** | Support communications |
| **admin-no-reply@bubble.is** | Legacy system emails |

### SendGrid infrastructure details

For comprehensive whitelisting, include SendGrid's infrastructure:

| Domain | Purpose |
|--------|---------|
| **sendgrid.net** | Primary email delivery infrastructure |
| **url6878.bubble.io** | Email link tracking for forum notifications |

**SPF consideration**: Bubble-sent emails authenticate through SendGrid. The SPF include statement is:
```
include:sendgrid.net
```

### Workload alert thresholds

Bubble sends capacity notifications at these thresholds:
- **75% WU usage**: Warning notification
- **100% WU usage**: Alert notification
- **App offline**: Notification when app taken offline due to workload limits

**Note for enterprise users**: Paid Bubble plans allow configuration of custom SendGrid API keys, which changes the sender to `admin@[yourdomain.com]` with proper domain verification.

---

## Complete whitelisting reference

### Master domain list (all four platforms)

For organizations needing to whitelist all four platforms, here is the consolidated list:

**Zapier:**
```
zapier.com, mail.zapier.com, zapiermail.com, robot.zapier.com,
interfaces.zapier.com, parser.zapier.com,
hubspotemail.net, sendgrid.net, mailgun.org, sparkpostmail.com
```

**Make.com:**
```
make.com, eu1.make.com, eu2.make.com, us1.make.com, us2.make.com,
integromat.com, make.celonis.com
```

**Airtable:**
```
airtable.com, airtableemail.com, airtableemails.com, sync.airtable.com
```

**Bubble.io:**
```
bubble.io, bubbleapps.io, bubble.is, sendgrid.net
```

### Technical recommendations for IT administrators

**Wildcard whitelisting** provides the most reliable coverage since these platforms frequently use dynamic subdomains and sender addresses. If your email system supports wildcards:

- Use `*@domain.com` patterns for each primary domain
- Use `*@*.domain.com` patterns to capture all subdomains
- Include third-party ESP domains (sendgrid.net, mailgun.org, etc.) for platforms that route through them

**SPF-based whitelisting** offers an alternative approach—rather than whitelisting domains, allow emails that pass SPF authentication for these platforms. This automatically adapts when platforms change their sending infrastructure.

**Header inspection** for Zapier emails specifically: check the `Received` headers for sendgrid.net, mailgun.org, or sparkpostmail.com references, as Zapier routes different notification types through different providers.

---

## Conclusion

The four platforms vary significantly in email infrastructure transparency. **Airtable** provides the clearest official guidance with just two domains to whitelist. **Zapier** has the most complex infrastructure with four ESP providers requiring additional domains. **Make.com** lacks official whitelist documentation but operates predictably through regional zone subdomains. **Bubble.io** uniquely incorporates app names into sender addresses, requiring wildcard patterns for `*@bubbleapps.io`.

For maximum reliability, domain-level wildcard whitelisting is recommended over specific address whitelisting, as these platforms frequently add new notification types and update their email infrastructure. Organizations with strict security requirements should also whitelist the underlying ESP domains (SendGrid, Mailgun, HubSpot, SparkPost) to prevent delivery failures when platforms route through different providers.
