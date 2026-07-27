# Luma Learning product architecture

## Information architecture

- Public: landing, catalogue preview, pricing, help, sign in, registration, password recovery.
- Student: dashboard, learning, subjects, course overview, lesson workspace, assessments, assignments, results, calendar, achievements, messages, resources, subscription, payments, profile.
- Teacher: dashboard, classes, courses, lesson builder, assessments, assignments, lesson notes, schemes, gradebook, students, analytics, messages, resources.
- Administrator: dashboard, users, classes, subjects, teacher assignments, academic setup, content, schemes, lesson-note vetting, monitoring, subscriptions, payments, financial reports, analytics, settings, audit logs, backup.
- Learning hierarchy: class level → subject → course → module/week → lesson → activity → milestone.

## Role-permission matrix

| Capability | Student | Teacher | Administrator |
|---|---:|---:|---:|
| View entitled learning content | Own | Assigned classes | All |
| Submit work / attempt assessment | Own | No | No |
| Create and publish learning content | No | Assigned courses | All |
| Grade and give feedback | No | Assigned learners | All |
| Submit lesson notes | No | Own | View |
| Approve/return lesson notes | No | No | Yes |
| View progress | Own | Assigned learners | All |
| Manage users, roles and academic setup | No | No | Yes |
| View subscription status | Own | Access flag only | All |
| View payment details and financial reports | Own masked records | No | Authorised admin |
| Change subscription or refund | No | No | Authorised admin + reason |
| View secrets, full card data or MoMo PIN | Never | Never | Never |

## Security boundaries

Authentication, authorization, entitlement checks, assessment scoring, signed file URLs and payment verification run server-side. Premium blobs use private R2 keys and short-lived signed access after an entitlement check. Browser redirects never activate access. Webhooks require provider signature verification, unique event IDs, amount/currency/customer/plan validation and an atomic idempotent update. Gateway secret keys are runtime secrets, never client variables.

The demo interface uses realistic sample data. Production identity should use an approved public authentication path with secure password hashing, rotating sessions, CSRF protection, rate limits and recovery-token expiry. Payment integration must use Paystack or Flutterwave test mode until merchant verification and webhook tests pass.

## Design system

- Typography: Inter/Geist-style system sans, 9–31px type scale, strong numeric hierarchy.
- Palette: Navy `#101D2F`, teal `#0D9F91`, blue `#3D77E8`, orange `#ED8B3A`, green `#35A36F`, surface `#F5F7FA`.
- Components: collapsible sidebar, sticky header, course cards, progress rings/bars, status badges, tables, filter bars, plans, curriculum rail, empty/error/payment states.
- Responsive: four columns collapse to two and one; sidebar becomes a mobile drawer; learning outline hides below 780px; tables suppress secondary fields while retaining primary actions.
- Accessibility: semantic controls, visible focus rings, contrast-safe statuses, reduced-motion support, keyboard-selectable cards and non-colour status labels.

## Production modules still requiring provider configuration

Public authentication, transactional email/SMS, gateway checkout and webhook secrets, scheduled subscription expiry, file-virus scanning, PDF/Excel export and observability require deployment credentials and provider accounts. They must not be simulated as successful production operations.
