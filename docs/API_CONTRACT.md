# Brightloop · API Contract (v1)
Base: `/api/v1` · JSON · Auth: `Authorization: Bearer <JWT>` · Lists: `?page=1&limit=25&q=&status=` → `{ data:[], page, limit, total }`
Roles: **A**=admin, **S**=staff, **C**=customer (sirf apna data). Error: `{ error:{ code, message, fields? } }`

## Auth
| Method | Path | Role | Kaam |
|---|---|---|---|
| POST | /auth/signup | public | email+password → customer account (409 agar email exists, 422 password rule) |
| POST | /auth/login | public | → `{ token, user }` |
| POST | /auth/forgot-password | public | reset link email par (hamesha 200, email leak nahi) |
| POST | /auth/reset-password | public | `{ token, password }` |
| GET | /auth/me | all | current user |
| POST | /staff | A | naya staff member (sirf admin) |
| GET | /staff | A | staff list |

## Catalog
| Method | Path | Role | Kaam |
|---|---|---|---|
| GET/POST | /products | S,A read · A write | list / create (variants nested) |
| GET/PUT/DELETE | /products/:id | A write | detail, edit, deactivate |
| GET/POST | /plans | S,A read · A write | list / create |
| GET/PUT | /plans/:id | A write | edit (auto_close, can_pause, can_renew, can_close_early) |
| GET/POST/PUT | /taxes | A | tax rules |
| GET/POST/PUT | /discounts | A | rules, `product_ids[]` scope ke saath |
| GET/POST | /templates, /templates/:id | S,A | quotation templates (plan + lines + validity_days) |

## Subscriptions
| Method | Path | Role | Kaam |
|---|---|---|---|
| GET | /subscriptions | S,A (C = apni) | list + filters: status, customer, plan, date range |
| POST | /subscriptions | S,A | naya (ya `template_id` se prefilled) |
| GET/PUT | /subscriptions/:id | S,A (C read) | detail + lines + invoices |
| POST | /subscriptions/:id/transition | S,A | `{ to:'quotation'|'confirmed'|'active'|'closed' }` — sirf aage ka valid step |
| POST | /subscriptions/:id/pause, /resume, /renew, /close | C,S,A | plan ke flags check karke, warna 403 |

## Invoices & Payments
| Method | Path | Role | Kaam |
|---|---|---|---|
| POST | /billing/run | A,S | due subscriptions ke invoices; `{ created, skipped }`. Idempotent (UNIQUE period). Discount + tax auto |
| GET | /invoices | S,A (C = apni) | filters: status, overdue=true, customer, date range |
| GET | /invoices/:id | S,A,C | detail + lines + payments |
| POST | /invoices/:id/confirm, /cancel, /send | S,A | draft→confirmed, cancel, email bhejna |
| GET | /invoices/:id/pdf | S,A,C | print/download |
| POST | /invoices/:id/payments | S,A | `{ method, amount, paid_on, note }`; poora paid ⇒ status paid |
| GET | /payments | S,A | list + filters (method, date) |

## Customers & Reports
| Method | Path | Role | Kaam |
|---|---|---|---|
| GET/POST | /customers, /customers/:id | S,A | list, create, detail |
| GET | /reports/summary | S,A | active subs, MRR, collected, outstanding, overdue count |
| GET | /reports/revenue?from&to&group=month | S,A | revenue series |
| GET | /reports/overdue | S,A | overdue invoices list |
| GET | /portal/subscriptions, /portal/invoices | C | customer ka apna data |

## Business rules (backend ke andar, frontend par bharosa nahi)
1. Password: 9+ chars, upper, lower, special. Email case-insensitive unique.
2. Subscription status sirf Draft→Quotation→Confirmed→Active→Closed; peeche nahi.
3. Invoice: Draft→Confirmed→Paid; Cancelled alag. Paid invoice edit nahi hota.
4. Billing run: transaction mein, `INSERT … ON CONFLICT (subscription_id, period_start) DO NOTHING`.
5. Discount: date range + usage_limit + min qty/purchase check; `used_count` atomic UPDATE se badhta hai (race-safe).
6. Tax: line ke tax_id (ya default tax) se; total server calculate karta hai.
7. Overdue derived hota hai, stored nahi.
