# Lipia Pole Pole - Project Architecture

A credit management system built with React, TypeScript, and Supabase.

---

## 📁 Domain Structure

```
├── src/
│   ├── api/                    # API layer - Supabase queries
│   │   ├── clients.api.ts      # Client CRUD operations
│   │   ├── invoices.api.ts     # Invoice CRUD operations
│   │   ├── notifications.api.ts # Notification queries
│   │   ├── payments.api.ts     # Payment details CRUD
│   │   ├── products.api.ts     # Product CRUD operations
│   │   └── tenant.api.ts       # Tenant/business queries
│   │
│   ├── components/             # Shared UI components
│   │   ├── auth/               # Authentication components
│   │   │   ├── SignUpForm.tsx
│   │   │   └── UnifiedLoginForm.tsx
│   │   ├── clients/            # Client-specific components
│   │   │   ├── ClientDialog.tsx
│   │   │   ├── ClientsTable.tsx
│   │   │   ├── ClientTopUpDialog.tsx
│   │   │   └── ...
│   │   ├── invoices/           # Invoice-specific components
│   │   │   ├── InvoiceDialog.tsx
│   │   │   └── InvoicesTable.tsx
│   │   ├── products/           # Product-specific components
│   │   │   ├── ProductDialog.tsx
│   │   │   └── ProductsTable.tsx
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── AppSidebar.tsx      # Main navigation sidebar
│   │   ├── GlobalSearch.tsx    # Command palette search
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   └── NotificationDropdown.tsx
│   │
│   ├── features/               # Feature-based modules
│   │   └── clients/
│   │       └── components/
│   │           ├── ClientActions.tsx
│   │           └── ClientRow.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.tsx         # Authentication state
│   │   ├── useClients.ts       # Client data hooks
│   │   ├── useInvoices.ts      # Invoice data hooks
│   │   ├── useNotifications.ts # Notification hooks
│   │   ├── usePayments.ts      # Payment hooks
│   │   ├── useProducts.ts      # Product hooks
│   │   ├── useGlobalSearch.ts  # Search functionality
│   │   ├── useUserRole.ts      # Role-based access
│   │   └── use-mobile.tsx      # Responsive hooks
│   │
│   ├── integrations/           # External service integrations
│   │   └── supabase/
│   │       ├── client.ts       # Supabase client (auto-generated)
│   │       └── types.ts        # Database types (auto-generated)
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── pdfGenerator.ts     # Invoice PDF generation
│   │   ├── queryClient.ts      # React Query configuration
│   │   ├── utils.ts            # General utilities (cn, etc.)
│   │   └── whatsapp.ts         # WhatsApp integration
│   │
│   ├── pages/                  # Route components
│   │   ├── Auth.tsx            # Login/Signup page
│   │   ├── Clients.tsx         # Client management
│   │   ├── ClientDashboard.tsx # Client portal
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Invoices.tsx        # Invoice management
│   │   ├── NotFound.tsx        # 404 page
│   │   ├── Payments.tsx        # Payment settings
│   │   └── Products.tsx        # Product management
│   │
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── components/
│   │   │   └── DeleteConfirmDialog.tsx
│   │   ├── hooks/
│   │   │   └── useTenant.ts
│   │   └── utils/
│   │       ├── currency.ts     # Currency formatting
│   │       ├── date.ts         # Date formatting
│   │       └── index.ts        # Barrel export
│   │
│   ├── App.tsx                 # Root component & routing
│   ├── App.css                 # Global styles
│   ├── index.css               # Design system tokens
│   └── main.tsx                # Entry point
│
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── create-client-user/ # Create client auth user
│   │   ├── reset-password/     # Password reset
│   │   ├── resolve-login-email/# Email resolution
│   │   └── setup-tenant/       # Tenant initialization
│   ├── migrations/             # Database migrations
│   └── config.toml             # Supabase configuration
│
├── public/                     # Static assets
├── index.html                  # HTML entry point
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies
```

---

## 🏗️ Architecture Pattern

**Hybrid Layered + Feature-Based Architecture**

### Layers

| Layer | Purpose | Location |
|-------|---------|----------|
| **Pages** | Route-level components | `src/pages/` |
| **Components** | Reusable UI components | `src/components/` |
| **Hooks** | Data fetching & state logic | `src/hooks/` |
| **API** | Database queries | `src/api/` |
| **Lib** | Utilities & helpers | `src/lib/` |
| **Shared** | Cross-cutting utilities | `src/shared/` |

### Data Flow

```
Page → Hook → API → Supabase
  ↓
Component (UI)
```

---

## 🎨 Design System

### Tokens Location
- **CSS Variables**: `src/index.css`
- **Tailwind Config**: `tailwind.config.ts`

### Brand Colors
| Token | Purpose |
|-------|---------|
| `--primary` | Green - Trust & Growth |
| `--secondary` | Red - Urgency & Action |
| `--success` | Positive states |
| `--destructive` | Errors & deletions |

### Typography
- **Display**: Outfit (headings)
- **Body**: Plus Jakarta Sans

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `tenants` | Business/organization entities |
| `profiles` | User profiles linked to tenants |
| `clients` | Customer accounts |
| `products` | Product catalog |
| `invoices` | Client invoices |
| `transactions` | Payment transactions |
| `payment_details` | M-Pesa payment configurations |
| `notifications` | User notifications |
| `user_roles` | Role-based access control |

### User Roles
- `admin` - Full access
- `user` - Standard access
- `client` - Client portal access

---

## 🔐 Authentication

- **Provider**: Supabase Auth
- **Methods**: Email/Password
- **Auto-confirm**: Enabled for non-production

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-router-dom` | Routing |
| `@tanstack/react-query` | Data fetching |
| `@supabase/supabase-js` | Backend client |
| `recharts` | Charts & graphs |
| `jspdf` | PDF generation |
| `sonner` | Toast notifications |
| `tailwindcss` | Styling |
| `shadcn/ui` | Component library |

---

## 🚀 Edge Functions

| Function | Purpose |
|----------|---------|
| `create-client-user` | Create auth user for client |
| `reset-password` | Handle password resets |
| `resolve-login-email` | Resolve user email from phone |
| `setup-tenant` | Initialize new tenant |

---

## 📝 Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `use{Name}.ts`
- API: `{domain}.api.ts`
- Utils: `camelCase.ts`

### Component Structure
```tsx
// Imports
import { ... } from "...";

// Types
interface Props { ... }

// Component
export function ComponentName({ ... }: Props) {
  // Hooks
  // State
  // Handlers
  // Render
}
```

### Styling
- Use Tailwind semantic tokens
- Never use direct colors (e.g., `text-white`)
- Always use design system tokens (e.g., `text-foreground`)
