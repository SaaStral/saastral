# SaaStral Frontend Structure

This document describes the React frontend structure that has been created for SaaStral.

## Overview

The frontend follows Next.js 14 App Router conventions with a clean, modular structure. It implements the "Forest Theme" design from the HTML mockups with a dark green color palette.

## Structure Created

```
apps/web/src/
├── app/
│   ├── layout.tsx                      # Root layout with fonts
│   ├── page.tsx                        # Landing page
│   ├── globals.css                     # Global styles with Forest Theme
│   └── (dashboard)/                    # Dashboard route group
│       ├── layout.tsx                  # Dashboard layout wrapper
│       ├── dashboard/page.tsx          # Main dashboard
│       ├── employees/page.tsx          # Employee management
│       ├── subscriptions/page.tsx      # Subscription management
│       ├── alerts/page.tsx             # Alerts center
│       ├── reports/page.tsx            # Reports & analytics
│       └── settings/page.tsx           # Settings
│
└── components/
    ├── layout/
    │   ├── Sidebar.tsx                 # Reusable sidebar navigation
    │   ├── Header.tsx                  # Reusable header/navbar
    │   └── DashboardLayout.tsx         # Main layout component
    │
    └── ui/
        └── EmptyState.tsx              # Reusable empty state component
```

## Design System

### Color Palette (Forest Theme)

The design uses a dark forest green theme with the following key colors:

- **Primary**: `#059669` (Emerald 600)
- **Primary Light**: `#10b981` (Emerald 500)
- **Secondary**: `#0d9488` (Teal 600)
- **Background Dark**: `#022c22`
- **Background Darker**: `#011a14`
- **Text Primary**: `#f0fdf4`
- **Text Secondary**: `#a7f3d0`

### Typography

- **Headings**: Sora (sans-serif, bold)
- **Body**: Outfit (sans-serif)
- **Code/Numbers**: JetBrains Mono (monospace)

### Spacing & Borders

- Sidebar Width: `260px`
- Header Height: `64px`
- Border Radius: `6px` (sm), `10px` (md), `16px` (lg)
- Transitions: `150ms` (fast), `250ms` (base)

## Components

### Layout Components

#### `Sidebar.tsx`
- Fixed sidebar navigation with logo
- Active state highlighting with gradient background
- Navigation items with icons (from lucide-react)
- Integration status indicators
- Footer with help links

#### `Header.tsx`
- Sticky header with backdrop blur
- Search button with keyboard shortcut indicator
- Notification bell with badge
- Help button
- User avatar

#### `DashboardLayout.tsx`
- Wrapper that combines Sidebar + Header
- Main content area with max-width
- Used by all dashboard pages

### UI Components

#### `EmptyState.tsx`
- Reusable component for empty pages
- Accepts icon, title, description
- Optional action button
- Optional children for additional content

## Pages

All dashboard pages currently show empty states with:

1. **Dashboard** - Shows 3 KPI cards (subscriptions, spend, alerts)
2. **Employees** - Employee management placeholder
3. **Subscriptions** - SaaS subscription tracking placeholder
4. **Alerts** - Smart alerts center with alert types
5. **Reports** - Analytics & reports with feature cards
6. **Settings** - Configuration page with integration status

## Navigation Structure

```
/                           # Landing page with features
└── /dashboard              # Protected dashboard area
    ├── /dashboard          # Main dashboard
    ├── /employees          # Employee list
    ├── /subscriptions      # Subscription list
    ├── /alerts             # Alerts feed
    ├── /reports            # Reports & analytics
    └── /settings           # Settings & integrations
```

## Key Features

### Responsive Design
- Sidebar collapses on smaller screens
- Grid layouts adjust for mobile
- Touch-friendly interactive elements

### Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all interactive elements

### Performance
- Next.js 14 App Router for optimal performance
- Font optimization with `next/font`
- Server components by default
- Client components only where needed

## Next Steps

To add functionality to these pages:

1. **Connect to tRPC API**
   - Set up tRPC client in `apps/web/src/lib/trpc.ts`
   - Create feature-specific components in `components/features/`
   - Replace empty states with data-driven components

2. **Add Data Fetching**
   - Use tRPC's `useQuery` for data fetching
   - Implement loading states
   - Add error boundaries

3. **Implement Features**
   - Employee table with filtering/sorting
   - Subscription cards with usage metrics
   - Alert cards with actions
   - Charts for reports page

4. **Add Interactivity**
   - Modals for create/edit forms
   - Confirmation dialogs
   - Toast notifications
   - Real-time updates

## Design Decisions

1. **Dark Theme**: Matches the "Forest Theme" from HTML mockups
2. **Component Composition**: Small, reusable components
3. **Route Groups**: `(dashboard)` for shared layout without affecting URL
4. **Client Components**: Only where interactivity is needed
5. **Tailwind Classes**: Direct usage for rapid development (could extract to components later)

## Running the Frontend

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Visit http://localhost:3000
```

The landing page will be at `/` and the dashboard at `/dashboard`.

---

Created: December 2024
