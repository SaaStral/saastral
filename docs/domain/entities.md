# SaaStral - Domain Entities

## Core Entities

### 1. Organization

The tenant - a company using SaaStral.

**Business Rules:**
- Each organization is isolated (multi-tenancy)
- Has departments (hierarchical structure)
- Can have multiple integrations

### 2. Employee

A person who works (or worked) at the organization.

**Business Rules:**
- Status: `active` or `offboarded`
- Linked to Google Workspace/Microsoft 365 via `externalId`
- When offboarded, trigger alert if has active subscriptions
- Track which subscriptions they use

### 3. Subscription

A SaaS tool the company pays for (e.g., Slack, GitHub, Figma).

**Business Rules:**
- Has a `totalSeats` and `usedSeats`
- Billing cycle: monthly, quarterly, yearly, one-time
- Cost stored in cents (avoid floating point)
- Renewal date triggers alerts (30, 15, 7 days before)
- Usage rate calculated from Okta login events

### 4. Subscription Member

Assignment of an employee to a subscription license.

**Business Rules:**
- Links Employee <-> Subscription
- Tracks `lastUsedAt` (from Okta events)
- If not used for 30+ days -> trigger alert
- If employee offboarded -> becomes orphaned license

### 5. Alert

A notification about something that needs attention.

**Alert Types:**
- **Offboarding** - Employee left, still has licenses
- **Renewal Soon** - Subscription renews in X days
- **Unused License** - No login for 30+ days
- **Low Adoption** - Less than 50% of seats used
- **Duplicate Tool** - Multiple tools in same category
- **Overspending** - Anomaly detected

**Severities:** Low, Medium, High, Critical

**Statuses:** Pending, Acknowledged, Resolved, Dismissed

### 6. Integration

Connection to external provider (Google, Okta, etc.).

**Types:**
- `google_workspace` - Employee directory
- `microsoft_365` - Employee directory (Enterprise)
- `okta` - SSO events and usage data
- `keycloak` - SSO events (Enterprise, open source alternative)

**Business Rules:**
- Only one integration per type per organization
- Must sync periodically (background jobs)
- Store encrypted credentials in `config` field
- Track sync status and errors

### 7. Login Event

Record of an employee logging into a SaaS app via SSO.

**Business Rules:**
- Sourced from Okta/Keycloak
- Used to calculate usage rate
- Determines if license is "unused"
- Updates `lastUsedAt` on Subscription Member
