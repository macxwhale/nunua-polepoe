# Nunua Polepole

A robust multi-tenant platform for business directory management, strategic auditing, and global administrative governance.

## Developer Documentation
- [DEVELOPER.md](./DEVELOPER.md)

## Core Features

- **Business Directory**: Comprehensive management of all registered business nodes (tenants).
- **Multi-Tenant Architecture**: Secure data isolation between different business nodes.
- **Strategic Auditing**: Deep-dive into specific business statistics, personnel, and client directories.
- **Global Governance**: Superadmin dashboard for platform-wide monitoring and control.
- **Mobile Optimized**: Responsive design ensuring all administrative tasks can be performed on any device.

## Superadmin Capabilities

- **User Management**: Unified interface to monitor and manage platform administrators.
- **Promotion Protocol**: Identify any user by name or phone across the entire platform and promote them to Superadmin.
- **Business Oversight**: Real-time status toggles and subscription tier management for all tenants.
- **Access Control**: Robust Row Level Security (RLS) policies ensuring high-level platform security.

## Local Development

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd nunua-polepoe

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Technologies

This project is built with:

- **Vite**: Frontend tooling
- **TypeScript**: Type-safe development
- **React**: UI library
- **shadcn/ui**: Component library
- **Tailwind CSS**: Styling
- **Supabase**: Backend and Database (PostgreSQL)
