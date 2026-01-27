# User Roles & Permissions

This document outlines the security architecture and role-based access control (RBAC) system for the Nunua Polepole platform.

## Role Hierarchy

The system uses a tiered approach to distinguish between platform administrators, business owners, staff, and end-clients.

| Level | Role | DB Enum (`app_role`) | Description |
| :--- | :--- | :--- | :--- |
| **0** | **Superadmin** | `superadmin` | Platform Owner. Has global visibility across all tenants & revenue analytics. |
| **1** | **Owner** | `admin` | Business Owner. Full control over their specific tenant and settings. |
| **2** | **Staff** | `user` | Standard Employee. Handles day-to-day operations (Invoices, Clients, Products). |
| **3** | **Client** | `client` | End Customer. Can only view and pay their own invoices. |

---

## Detailed Permissions

### Superadmin
- **Infrastructure**: View and manage all businesses (Tenants).
- **Global Analytics**: Access aggregate revenue data grouped by subscription tier.
- **Support**: Can "impersonate" or view data from any tenant to provide technical support.
- **Assignment**: Manually assigned via database migrations or restricted backend functions.

### Owner (Admin)
- **Business Identity**: Manage business name, phone number, and subscription details.
- **Payment Settings**: Configure Paybill, Till Numbers, and STK Push credentials.
- **Team Management**: (Future) Manage staff access.
- **Assignment**: Automatically assigned to the **first user** who registers a new business organization (Tenant).

### Staff (User)
- **Sales Operations**: Create, update, and delete Clients, Invoices, and Products.
- **Dashboard**: View business-specific analytics (Sales trends, top clients).
- **Restrictions**: Cannot access the **Payments** settings or **Superadmin** dashboard.

### Client
- **Personal Portal**: View their outstanding balance and invoice history.
- **Payments**: Initiate payments for their specific invoices.
- **Assignment**: Assigned to users created via the `create-client-user` edge function when an owner registers a new client.

---

## Implementation Details

### Database Level (RLS)
Role-based access is enforced at the database layer using Supabase Row Level Security (RLS). 
- Policies check for roles using the `public.has_role(auth.uid(), 'role_name')` function.
- Most tables are scoped by `tenant_id`, except for `superadmin` policies which allow crossing tenant boundaries.

### Frontend Level (React)
- **`useUserRole` Hook**: The primary source of truth for the UI. It maps database enums to semantic boolean flags (`isOwner`, `isStaff`, etc.).
- **Navigation**: The `AppSidebar` filters menu items based on the active role.
- **Routes**: `App.tsx` uses a `ProtectedRoute` wrapper that can require specific roles (e.g., `requireSuperAdmin`).

---

## Modifying Roles
To change a user's role manually in Supabase:
```sql
-- Example: Elevate a user to Superadmin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('user-uuid-here', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;
```
