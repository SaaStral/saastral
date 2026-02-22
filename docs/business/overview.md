# SaaStral - Business Overview

## What is SaaStral?

**SaaStral** is an **open source SaaS management platform** that helps companies control and optimize their software spending.

### The Problem

Companies waste **20-40% of their SaaS budget** due to:

- **Orphaned Licenses** - Ex-employees still have active accounts (R$ 200-500/month per person)
- **Unused Seats** - Paid licenses nobody uses (20-30% of SaaS spend)
- **Duplicate Tools** - Multiple teams buying the same category of software (R$ 500-2,000/month)
- **Unmonitored Renewals** - Auto-renewals with price increases going unnoticed (10-20% increases)
- **Shadow IT** - Teams subscribing to tools without approval (R$ 1,000-5,000/month hidden)
- **No Cost Allocation** - Impossible to know which departments are spending what

**Result:** An average company with 100-200 employees wastes R$ 5,000-15,000/month on SaaS.

### The Solution

SaaStral provides **visibility and control** by combining three data sources:

1. **Who's in the company** - Google Workspace (employee directory, onboarding/offboarding detection)
2. **Who's using what** - Okta SSO (login events, usage frequency, last access for ALL apps)
3. **What you're paying** - Manual entry (MVP) / PDF parsing + Open Finance Brasil (future)

**Key Insights Generated:**
- "Joao left the company and still has 5 active licenses"
- "15 people have Figma, only 8 used it this month"
- "Slack renews in 30 days - time to negotiate"
- "You have Zoom AND Google Meet - consider consolidating"
- "Potential savings this month: R$ 4,200"

---

## Business Model

### Open Core Strategy

Like GitLab, Grafana, and PostHog:

```
Community Edition (AGPL-3.0)
  100% Open Source - Free - Self-hosted
  Google Workspace + Okta integration
  Full dashboard & analytics
  Employee & subscription management
  Automated alerts, savings calculator
  Email notifications, API access
  Unlimited users

Enterprise Edition (Commercial)
  Everything in Community, plus:
  Microsoft 365 + Keycloak integration
  PDF invoice parsing
  Open Finance Brasil
  SSO login for SaaStral
  Slack/Teams notifications
  Approval workflows, custom reports
  Multi-tenant
  Priority support with SLA
  Managed cloud (optional)
```

### Pricing

- **Community:** Free (self-hosted)
- **Team:** R$ 499/month (50-150 employees)
- **Business:** R$ 999/month (150-500 employees)
- **Enterprise:** R$ 2,999/month (500+ employees, custom)

**ROI Example (100 employees):**
- Cost: R$ 499/month
- Typical savings: R$ 2,500-3,000/month
- ROI: 5-6x investment
- Payback: <1 month

---

## Target Market

### Primary Persona

**CFO / Controller / Head of IT**

- Company size: 50-500 employees
- Monthly SaaS spend: R$ 10,000+
- Uses Google Workspace + Okta for SSO
- Pain: No visibility into SaaS spending
- Goal: Reduce waste, control costs

### Secondary Persona

**Office Manager (smaller companies)**
- Company size: 20-100 employees
- Manages software subscriptions
- No dedicated finance team
- Pain: Spreadsheets are chaos
- Goal: Simple way to track everything

---

## Competitive Positioning

**vs. Torii / Zylo / Productiv:**

| Aspect | SaaStral | Competitors |
|--------|----------|-------------|
| Model | Open Source | Proprietary |
| Price | Free - R$ 2,999 | $3,000-10,000/month |
| Data | Your servers | Their cloud |
| Market | Brazil + Global | US first |
| Setup | 10 minutes (Docker) | Weeks |
| Open SSO | Keycloak support | Okta only |

**Key Differentiators:**

1. **Open Source** - Auditability, trust, no lock-in
2. **Self-hosted** - Data sovereignty, LGPD compliance
3. **Brazilian market** - Local payment, support, Open Finance
4. **Price** - 5-10x cheaper than US competitors

---

## Success Metrics

### Product Metrics

- **Savings Detected** - Amount of waste identified per organization
- **Alerts Resolved** - Percentage of alerts that lead to action
- **Integration Health** - Successful sync rate (>95%)
- **Time to Value** - Days from signup to first savings

### Business Metrics (Year 1)

- **Community Adoption:** 2,000 GitHub stars, 5,000 Docker pulls, 1,000 Discord members
- **Revenue:** 60 paying customers, R$ 55k MRR, R$ 660k ARR, <5% churn
