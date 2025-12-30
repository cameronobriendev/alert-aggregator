# Complete Guide to No-Code Platform Email Notifications

**Four major no-code platforms—Zapier, Make.com, Airtable, and Bubble—each send dozens of automated notifications**, from critical error alerts to billing warnings and team invitations. This comprehensive reference documents every known email type, sender address, subject line pattern, and delivery timing, enabling you to build robust monitoring systems, email filters, or automation triggers for these platforms.

The key finding: **contact@zapier.com** and **noreply@airtable.com** serve as primary senders for their respective platforms, while Make.com uses its domain without a consistently documented address, and Bubble routes through SendGrid with app-specific sender addresses. All four platforms send mandatory notifications (security, billing, legal) that cannot be disabled.

---

## Zapier Email Notifications

Zapier uses **contact@zapier.com** as its primary sending address for virtually all automated communications. The platform offers the most granular notification controls, allowing users to configure error alerts as immediate, hourly digest, or disabled entirely (though billing and security emails remain mandatory).

### Complete notification reference

| Email Type | Sender | Subject Pattern | Key Body Phrases | Timing |
|------------|--------|-----------------|------------------|--------|
| **Zap Error** | contact@zapier.com | "Your Zap [Zap Name] has an error" | "Your Zap encountered an error"; Step-by-step error details; Link to Zap history | Immediate, hourly summary, or configurable |
| **Zap Turned Off** | contact@zapier.com | "Your Zap was turned off" | "Multiple errors occur each time the Zap tries to run"; Instructions to review and fix | Immediate (Team: 24hr grace period; Enterprise: 72hr) |
| **Task Limit Warning (80%)** | contact@zapier.com | "Just a heads up: You're now over 80% of your Zapier task limit for this billing period" | "When you reach 100%...we'll start holding your tasks"; Upgrade recommendation | At 80% threshold |
| **Task Limit Reached (100%)** | contact@zapier.com | "You've reached your task limit" | "Held tasks will be stored in your Task History, but won't be completed until you upgrade" | At 100% threshold |
| **Authentication Failed** | contact@zapier.com | "We noticed that your '[Account Name] ([App Name])' account encountered an authentication problem" | "Please reconnect your account"; Link to reconnect in settings | Immediate when detected |
| **App Deprecation** | contact@zapier.com | "All Zaps using the [App] integration need to be updated to the new version" | "Once the deprecation date arrives, Zaps using that version will pause"; Migration instructions | Weeks before deadline |
| **Team Invitation** | contact@zapier.com | Team invitation notification | "Zapier will send an email notification to the user to accept the invite"; Custom note if included | Immediate |
| **Password Reset** | contact@zapier.com | Password reset request | Verification link; Security instructions | Immediate |
| **Activity Summary** | contact@zapier.com | "Your Zapier Activity Summary" | Summary of tasks performed; Task usage statistics | Never, daily, or weekly (configurable) |
| **Invoice/Receipt** | contact@zapier.com | Invoice notification | Billing receipts; Payment confirmation details | At billing events |
| **Terms/Policy Updates** | contact@zapier.com | Legal notices | Terms of service changes; Privacy policy updates | Cannot unsubscribe |

### Notification configuration options

Zapier offers four error notification modes: **Immediately** (default, email per error), **Immediately + Hourly Summary** (both alerts plus digest), **Hourly Summary** (top-of-hour compilation), and **Never** (not recommended). Settings live in Profile → Settings → Notifications. Pro/Team/Company plans unlock custom per-Zap or per-folder notification rules.

The **Zapier Manager app** provides triggers for building custom notification workflows: New Zap Error, New Halted Task, Task Usage Limit reached, Zap Turned Off, New Team Member, New Invoice, and New Zap Created.

---

## Make.com Email Notifications

Make.com (formerly Integromat) sends notifications from its **@make.com domain**, though the specific address (likely noreply@make.com) isn't consistently documented. The platform uses a **digest system**: initial error alerts fire immediately, followed by a digest email after 5 minutes containing a link to scenario history. Warnings follow a 15-minute digest pattern.

### Complete notification reference

| Email Type | Sender | Subject Pattern | Key Body Phrases | Timing |
|------------|--------|-----------------|------------------|--------|
| **Scenario Error** | @make.com | "Encountered error in [Scenario Name] scenario" | "Your scenario **[Scenario Name]** has encountered an error. The scenario has not been paused and continues to run..."; Links to Scenario, Organization, Team, Execution ID | Immediate + 5-min digest |
| **Scenario Warning** | @make.com | "Warning in [Scenario Name] scenario" | Issues requiring attention (e.g., connection problems); Links to scenario history | Immediate + 15-min digest |
| **Connection Reauthorization** | @make.com | Warning notification | "Failed to verify connection '[Connection Name]'. Invalid refresh token. Please reauthorize the connection." | Part of warning system |
| **Scenario Deactivated** | @make.com | "Make.com Scenario Has Been Stopped" / "[Scenario Name] has been stopped" | Scenario disabled due to repeated errors; Instructions to check history and reactivate | Immediate |
| **Operations Limit (75%)** | @make.com | "Approaching operations limit" | Warning at 75% of purchased credits/operations | At 75% threshold |
| **Operations Limit (90%)** | @make.com | Operations limit warning | Warning at 90% usage threshold | At 90% threshold |
| **Extra Operations Limit** | @make.com | Auto-purchasing limit notification | "You have reached the limit on extra operations auto-purchasing"; Link to top up | When limit reached |
| **Payment Invoice** | @make.com | Invoice notification | Invoice details; Payment confirmation | After each payment |
| **Payment Failed** | @make.com | Payment processing notification | Payment could not be processed; **7-day grace period** to update payment method | When payment fails |
| **Account Verification** | @make.com | Email verification | "We've sent a verification link to your email address. Please check your inbox..." | Immediate on signup |
| **Password Reset** | @make.com | Password reset | "If the supplied email address exists, an email containing a password reset link has been sent there." | On request |
| **Email Change (Current)** | @make.com | Change email address confirmation | "Change email address" button to approve | Immediate on request |
| **Email Change (New)** | @make.com | Verify new email | "Verify new email" button | After current email approved |
| **Organization Invitation** | @make.com | Team/Organization invitation | Link to join organization; Organization details | Immediate |
| **SAML Certificate Rotation** | @make.com (Enterprise) | Certificate rotation notification | Upcoming SP certificate rotation schedule | Advance notice |

### Notification preferences by scope

**Per-organization settings** (Profile → Email preferences): Deactivation notifications, Warning notifications, Error notifications. **Global settings**: Product updates about Make.com, Special offers/promotions, Make Academy announcements (all opt-in).

---

## Airtable Email Notifications

Airtable uses **noreply@airtable.com** as its primary sender for all system notifications. The platform has a **binary notification system**—users can enable or disable email notifications entirely but cannot filter by notification type. Notably, **invitation-related emails cannot be disabled** regardless of settings.

### Complete notification reference

| Email Type | Sender | Subject Pattern | Key Body Phrases | Timing |
|------------|--------|-----------------|------------------|--------|
| **Base Shared** | noreply@airtable.com | "[User] shared a base with you" | Base name; Access link | Immediate |
| **Workspace Invite** | noreply@airtable.com | "[User] invited you to [Workspace]" | Workspace name; Access link | Immediate (**cannot disable**) |
| **Interface Invite** | noreply@airtable.com | "[User] invited you to [Interface]" | Interface access details | Immediate (**cannot disable**) |
| **User Group Added** | noreply@airtable.com | "You've been added to [Group Name]" | Group details; Workspace info | Immediate (**cannot disable**) |
| **@Mention** | noreply@airtable.com | "[User] mentioned you in [Base Name]" | Record details; Comment text; Link to record | Immediate (5-min cooldown for same cell) |
| **User Field Assignment** | noreply@airtable.com | "[User] assigned you to [Record]" | Record name; Base name; Link | Batched for efficiency |
| **Comment Notification** | noreply@airtable.com | "New comment on [Record Name]" | Comment text; Commenter name | Immediate (when watching) |
| **Form Submission** | noreply@airtable.com | "Airtable forms: someone has responded to [Form Name]" | Form data; Timestamp | Immediate (per-form toggle) |
| **Automation Failed** | noreply@airtable.com | "Something went wrong with an automation" | "Your automation [Name] has failed [X] time(s) in [Table] on [Date] at [Time]"; "View failure" button | Immediate (**cannot disable while ON**) |
| **Payment Failed** | noreply@airtable.com | "Unable to process your Airtable payment" | "Your workspace has been moved to the Airtable Free plan, and you no longer have access to paid plan features." | After 14 days past due |
| **AI Credit Limit (75%)** | noreply@airtable.com | AI credit warning | Alert when workspace exceeds 75% of AI credit limit | At threshold |
| **Email Limit Warning** | noreply@airtable.com | Email limit notification | Warning when approaching daily email send limits | Near limit |
| **API Key Deprecation** | Airtable Team | "Reminder: Airtable API Key Deprecation" | "You're receiving this reminder because you are still using a legacy Airtable API Key. Starting [Date], users will no longer be able to create new API keys." | Weeks/months before deadline |
| **Invoice/Receipt** | noreply@airtable.com | "Your Airtable invoice" | Invoice details; Amount; Billing period | Monthly/when changes made |
| **Collaborator Report** | noreply@airtable.com | "Your collaborator report is ready" | Audit details; Permissions | ~10 minutes after request |
| **Email Verification** | noreply@airtable.com | "Verify your email address" | Verification link | Immediate on signup |
| **Password Reset** | noreply@airtable.com | "Reset your password" | Reset link (expires) | Immediate on request |

### Critical behavior notes

Automation failure emails go to whoever **last toggled the automation ON**. If that collaborator leaves the workspace, notifications cascade to **all workspace owners**. Interface-only collaborators only receive mentions made within interfaces, not base-layer mentions. Notifications older than **180 days are automatically deleted**. Unsubscribe links are user-specific—forwarding an email and having someone else click unsubscribe removes notifications for the original recipient.

---

## Bubble.io Email Notifications

Bubble.io uses **SendGrid** for all email delivery, with sender addresses following the pattern **[app-name]@sendgrid-mail.bubble.io** for apps without custom domains. Platform-level notifications come from Bubble's system without a consistently documented specific address. Community members have reported **timing delays of up to 24 hours** for workload spike notifications, though Bubble has stated they're working on improvements.

### Complete notification reference

| Email Type | Sender | Subject Pattern | Key Body Phrases | Timing |
|------------|--------|-----------------|------------------|--------|
| **Workload 75% Warning** | Bubble System | Workload usage notification | Notification that app has consumed 75% of monthly WU allowance | At 75% threshold |
| **Workload 100% Warning** | Bubble System | Workload usage notification | Notification that app has consumed 100%; Overages starting | At 100% threshold |
| **Workload Spike Detected** | Bubble System | "Workload usage spike detected" | Alert when consumption exceeds thresholds (2x-3x average, or 3%/6%/10% of monthly WU in 1/6/12 hours) | Real-time (delays reported) |
| **Custom Workload Alert** | Bubble System | Custom workload notification | User-defined threshold reached (minimum 1,000 WU) | When threshold hit |
| **App Offline** | Bubble System | App taken offline notification | "Your app has been taken offline" (when overages disabled and WU limit reached) | Immediate |
| **Capacity Alert (Legacy)** | Bubble | "Your application has reached its allocated capacity" | "...your application [app_name] has hit its maximum capacity usage for [X] minutes over the last 24 hours. You can add more capacity..." | Once daily (~5 AM) |
| **Database Storage Alert** | Bubble Enterprise | Storage warning | "Less than 50GB of storage left on your box"; Database backup guidance | When <50GB remaining |
| **CPU Usage Alert** | Bubble Enterprise | CPU usage warning | "Average application CPU usage has been over 70% during X periods of 30 minutes in the last day"; Server crash warning | When 70% CPU exceeded |
| **Collaborator Invitation** | Bubble System | App collaboration invitation | Invitation to collaborate on [app_name]; Permission details | Immediate |
| **App Ownership Transfer** | Bubble System | Ownership transfer notification | "You are now the owner of [application]" | Immediate |
| **Password Reset** | [app-name]@sendgrid-mail.bubble.io | Customizable subject | Customizable body + "Reset here" link (expires 24 hours); URL: https://domain/reset_pw?reset=[token] | Immediate |
| **Email Confirmation** | [app-name]@sendgrid-mail.bubble.io | Customizable subject | Confirmation link with verification token | Immediate on signup |
| **Email Rate Limit Warning** | Bubble System | Email rate limit exceeded | "You have exceeded the email rate limit of 20 email destinations per day. To continue sending, please install a custom SendGrid key" | When limit hit |

### Workload spike detection thresholds

Bubble triggers spike alerts based on five criteria: consumption exceeding **2x average of last 7 days** (for apps averaging >30,000 WU/day), **3x average** (apps >300 WU/day), **>3% of monthly allowance in 1 hour**, **>6% in 6 hours**, or **>10% in 12 hours**. Custom alerts require a minimum threshold of 1,000 WU and can be set per hour, day, week, or month.

### Notable limitations

Bubble does **not** send automatic emails for: deployment/publish notifications, API connector errors, security breach alerts, plugin deprecations, or individual workflow errors (these appear only in server logs). Email rate limits: **20 unique non-collaborator recipients per day** and **50 recipients per email** maximum on shared SendGrid. These limits don't apply with a custom SendGrid key.

---

## Cross-Platform Comparison

| Feature | Zapier | Make.com | Airtable | Bubble |
|---------|--------|----------|----------|--------|
| **Primary Sender** | contact@zapier.com | @make.com | noreply@airtable.com | [app]@sendgrid-mail.bubble.io |
| **Error Notification Timing** | Immediate/Hourly (configurable) | Immediate + 5-min digest | Immediate | Real-time (delays reported) |
| **Usage Alert Thresholds** | 80%, 100% | 75%, 90% | 75% (AI credits) | 75%, 100% + spike detection |
| **Digest Options** | Never/Daily/Weekly | 5-min (errors), 15-min (warnings) | None (binary on/off) | None |
| **Mandatory Emails** | Security, billing, legal | Security, billing | Invitations, automation errors, billing | Workload alerts, security |
| **Grace Period (Errors)** | Team: 24hr, Enterprise: 72hr | None documented | None | None |

---

## Conclusion

Each platform takes a distinct approach to notifications. **Zapier offers the most flexibility** with configurable timing and per-Zap/folder rules, plus the Zapier Manager app for building custom notification workflows. **Make.com's digest system** (5-minute error rollup, 15-minute warning rollup) prevents alert fatigue while maintaining visibility. **Airtable's binary system** is simpler but less flexible—you're either all-in or all-out on notifications, though invitations bypass preferences entirely. **Bubble's workload spike detection** is the most sophisticated capacity monitoring system, though users report timing reliability issues.

For building email filters or automation triggers, the key sender addresses to whitelist are: **contact@zapier.com**, **@make.com** domain, **noreply@airtable.com**, and **@sendgrid-mail.bubble.io** patterns. All platforms send mandatory security, billing, and legal communications that cannot be disabled through user preferences.
