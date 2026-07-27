# Luma Learning Platform

An original, responsive learning-management platform for Basic 4–9 learners, teachers and administrators in Ghana.

## Local setup

1. Install Node.js 22.13+ and dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` when payment and messaging providers are added.
3. Run `npm run dev` and open the printed local address.
4. Use the “Preview as” selector to explore Student, Teacher and Administrator workspaces.

## Data and storage

Structured platform state uses D1/SQLite through Drizzle. Private lesson files, submissions, schemes and lesson notes use the `LEARNING_FILES` object-storage binding. Generate migrations with `npm run db:generate` after schema changes.

## Payments

Use a hosted Paystack or Flutterwave test checkout. Create transactions server-side, persist unique references, verify signed webhooks idempotently and activate entitlements only after independent provider verification. Store provider secrets only in server runtime environment variables. Never collect PINs, CVVs or full card numbers.

See `ARCHITECTURE.md` for the information architecture, permission matrix, design system and production security boundaries.
