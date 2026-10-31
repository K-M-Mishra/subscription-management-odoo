# Brightloop · Gemini Prompt Pack

Prompts English mein hain kyunki Gemini code ke liye wahan zyada sahi chalta hai. Jahan `[BRACKET]` hai, wahan apni cheez bharo.

## Kaise use karna hai (4 niyam)
1. **Ek chat = ek page ya module.** Naya kaam, naya chat. Purane chat mein context ganda ho jaata hai.
2. Har naye chat mein **sabse pehle Prompt 0 (Master Context)** paste karo, uske baad kaam ka prompt.
3. Gemini ka code **seedha commit mat karo**. Pehle chalao, 6-point checklist (neeche) se check karo, phir commit.
4. Contract (`docs/API_CONTRACT.md`) aur schema (`docs/schema.sql`) sabka common sach hai. Gemini se kabhi inhe badalne mat bolo. Badalna ho toh pehle team se baat karo.

---

## Prompt 0 · Master Context (har chat mein pehle paste karo)

```
You are a senior full-stack engineer helping me build "Brightloop", a subscription management system for a hackathon. Follow everything below strictly.

PRODUCT
Brightloop Software sells software on subscription (monthly/yearly plans, add-ons, product variants). The system manages: products + variants, plans (daily/weekly/monthly/yearly billing), quotation templates, subscriptions (status: Draft -> Quotation -> Confirmed -> Active -> Closed), invoices (Draft -> Confirmed -> Paid, or Cancelled), payments (method, amount, date, note), discounts (percent or fixed, min purchase/quantity, date range, usage limit, scoped to products or whole subscriptions), taxes (auto-calculated), and a finance dashboard (active subs, revenue, outstanding, overdue). Roles: admin (everything), staff (limited, day-to-day), customer (portal: only their own subscriptions and invoices). Only admin creates discounts, products, plans, taxes and staff.

STACK
Frontend: React 18 + Vite + react-router-dom v6, plain CSS (no Tailwind, no UI library), functional components and hooks only.
Backend: [Node.js + Express + PostgreSQL — replace if team chose differently].
Data access in frontend: ONLY through functions exported from src/api.js. Never call fetch directly inside a page.

DESIGN SYSTEM (use these CSS variables from src/styles.css, do not invent new colors)
--paper #f1f3f8 (page bg), --ink #0e1b2c (text), --side #101c33 (sidebar), --loop #2748e8 (primary), --loop-soft #e3e8ff, --ok #0b8a6b, --warn #b4234a, --mute #5b6678, --line #dde2ec.
Fonts: 'Bricolage Grotesque' for headings/numbers, 'IBM Plex Sans' for body. Existing classes: .panel, .btn, .mini, .badge, .stat, .head, .grid2, .modal, .chip, table styles.
Tone of UI copy: plain English, sentence case, buttons say exactly what they do ("Record payment", not "Submit"). Errors say what went wrong and how to fix it. Empty states tell the user what to do next.

RULES
- Reuse existing components in src/ui.jsx (Badge, Stat, Head, Empty, Stepper) instead of rewriting them.
- Every page handles 4 states: loading, empty, error, success.
- Every list is paginated server-side (page, limit) and must feel fast with thousands of rows.
- Forms validate on the client AND show server field errors.
- Responsive down to 360px width, visible keyboard focus, labels on all inputs.
- Money in INR, formatted with Indian grouping (use the money() helper in src/data.js).
- Do NOT change files I did not ask about. Do NOT add new npm packages unless I approve. Output complete files, not snippets with "...rest of code".
- If something in my request is ambiguous, state your assumption in one line, then continue.
```

---

## Prompt 1 · Naya page banana (template)

```
Using the context above, build the page: [PAGE NAME]
Route: [/route]   Allowed roles: [admin / staff / customer]
File to create: src/pages/[FileName].jsx

Purpose (one line): [what the user achieves here]

Data shown: [fields / columns]
Filters and search: [list]
Actions: [buttons and what each does]
API calls it uses (from docs/API_CONTRACT.md): [e.g. GET /invoices?status=&page=, POST /invoices/:id/confirm]

Requirements:
- Use api.js functions (add the missing ones to src/api.js as small separate exports and show me only those additions).
- Loading skeleton, empty state, error state with Retry button.
- Server-side pagination with Previous/Next and total count.
- Add any needed CSS as a clearly marked block I can append to styles.css (reuse existing classes first).
Return: 1) the complete page file, 2) the api.js additions, 3) the CSS block, 4) the route line to add in App.jsx.
```

## Prompt 2 · src/api.js banana (ek baar, ek banda)

```
Create src/api.js for the Brightloop frontend. A small fetch wrapper: base URL from import.meta.env.VITE_API_URL (default http://localhost:4000/api/v1), attaches the JWT from localStorage as a Bearer token, parses JSON, and on non-2xx throws an Error with {status, code, message, fields}. On 401, clear the token and redirect to /login. Export one function per endpoint in docs/API_CONTRACT.md (auth, staff, products, plans, taxes, discounts, templates, subscriptions, billing, invoices, payments, customers, reports, portal). List endpoints accept {page, limit, q, status, ...filters} and return {data, page, limit, total}. Complete file only.
```

---

## Ready prompts: har page ke liye (Prompt 0 ke baad paste karo)

**Auth (login, signup, forgot, reset)**
```
Build src/pages/Auth.jsx handling /login, /signup, /forgot-password, /reset-password?token=. Signup shows a live password checklist (more than 8 chars, uppercase, lowercase, special character) and blocks submit until all pass. Show the server's "email already registered" error under the email field. Forgot password always shows "If this email is registered, a reset link is on its way." After login, redirect by role: customer -> /portal, others -> /dashboard. Split-screen layout: left brand panel, right form card.
```

**Dashboard (finance lead)**
```
Build src/pages/Dashboard.jsx for admin/staff using GET /reports/summary, /reports/revenue, /reports/overdue. Top: 4 stat cards (active subscriptions, MRR, collected this month, still owed). Then a revenue bar chart for the last 6 months (pure CSS/SVG, no chart library), and an overdue invoices table with search, customer filter and a date range. A date-range filter at top reloads everything. Each overdue row links to /invoices/:id.
```

**Subscriptions list + detail**
```
Build src/pages/Subscriptions.jsx (list) and src/pages/SubscriptionDetail.jsx. List: filters by status/customer/plan, server pagination, status badges. Detail: header with number, customer, plan, dates, payment terms; a Stepper for Draft -> Quotation -> Confirmed -> Active -> Closed; one button "Move to [next status]" (calls POST /subscriptions/:id/transition); order lines table (product, quantity, unit price, tax, amount) with totals; a tab listing its invoices.
```

**New subscription form**
```
Build src/pages/SubscriptionForm.jsx at /subscriptions/new. Optional first step: "Start from a quotation template" dropdown that prefills plan and lines. Fields: customer (searchable select), plan, start date, expiry date, payment terms (Immediate / Net 15 / Net 30). Editable lines table: product, variant (price auto-adds the variant's extra price), quantity (cannot go below the plan's minimum quantity), unit price, tax. Live totals (subtotal, tax, total). Buttons: "Save as draft", "Save and send quotation".
```

**Invoices list + detail**
```
Build src/pages/Invoices.jsx and src/pages/InvoiceDetail.jsx. List: filter chips All / Draft / Confirmed / Paid / Overdue, search, pagination; overdue rows are highlighted. Detail: printable invoice layout (customer block, lines with discount and tax columns, totals), action buttons Confirm / Cancel / Send / Print / Record payment (only the ones valid for the current status), and a payments history table. Add @media print CSS so Print outputs only the invoice.
```

**Payments**
```
Build src/pages/Payments.jsx: table of all payments (date, invoice, customer, method, amount, note) with filters by method and date range and a total of the filtered rows. Also build a reusable RecordPaymentModal component (method select, amount prefilled with the amount due, date, note) used from the invoice page; it shows "Amount cannot exceed the balance due" when invalid.
```

**Products + variants (admin)**
```
Build src/pages/Products.jsx and a ProductForm modal. Fields: name, type, sales price, cost price, notes, tax. Variants editor: add rows of attribute / value / extra price (example: Brand / Odoo / +560) and show the resulting final price per variant. Show margin % (sales - cost) live.
```

**Plans (admin)**
```
Build src/pages/Plans.jsx and a PlanForm modal: name, price, billing cycle (daily/weekly/monthly/yearly), minimum quantity, available from/to, and four toggles: closes automatically at end date, can be closed early, can be paused, can be renewed. Plan cards show the cycle and the enabled behaviors as chips.
```

**Discounts (admin only)**
```
Build src/pages/Discounts.jsx with a rules table and a "New discount" form: name, type (percent/fixed), value, minimum purchase, minimum quantity, start/end date, usage limit, scope (specific products with a multi-select, or whole subscriptions). Table shows used/limit as a progress bar, and status Active / Expired / Used up computed from dates and usage.
```

**Customer portal**
```
Build src/pages/Portal.jsx (+ PortalSubscription.jsx) for customers only. My subscriptions as cards with status Stepper and next billing date; detail page with Pause / Renew / Close buttons that appear only if the plan allows them (flags come from the API), each with a confirmation dialog. My invoices table with status badges and a Download/Print button. Warm, simple, minimal copy; a non-technical person must understand everything.
```

---

## Polish prompts (page chal jaane ke baad, ek-ek karke)

**UI polish**
```
Here is my page: [paste code]. Improve visual polish WITHOUT changing logic or data flow: spacing rhythm, type hierarchy, table readability (aligned numbers, sticky header), hover/focus states, consistent badge colors, better empty-state copy. Use only existing CSS variables. Return the full updated file and a short list of what you changed.
```

**Loading / empty / error states**
```
Review this page: [paste code]. Add skeleton loaders (no spinners alone), an empty state with a clear next action, an error state with a Retry button, and disable buttons while a request is in flight to prevent double-click submits. Return the full file.
```

**Responsive + accessibility**
```
Audit this page for 360px mobile and keyboard use: [paste code + CSS]. Fix horizontal overflow (wrap tables in a scroll container), tap targets of at least 40px, label/aria attributes, focus trapping in modals, Escape to close, and color contrast of at least 4.5:1. Return only the changed code with line-level notes.
```

**Performance (2-second rule)**
```
This list page must stay under 2 seconds with 10,000+ records: [paste code]. Make sure it uses server-side pagination, debounces search by 300ms, cancels stale requests when filters change, and never renders more than 25 rows. Point out anything else that would slow it down.
```

**Form validation**
```
Add robust validation to this form: [paste code]. Inline errors under each field, validate on blur and on submit, map server field errors from the API response onto the fields, scroll to the first error, and keep entered values on failure.
```

---

## Backend prompts

**Module banana**
```
Using the context above and docs/schema.sql, write the backend module for [MODULE e.g. products] in Node + Express + PostgreSQL (pg library, parameterized queries only). Create routes, controller, service and validation (zod) following docs/API_CONTRACT.md exactly: same paths, roles, request/response shapes, pagination format and error format. Include role-check middleware use (admin/staff/customer). Return each file separately with its path.
```

**Billing engine (sabse zaroori)**
```
Write the billing service for POST /billing/run. In ONE database transaction: select active, non-paused subscriptions whose next_billing_date <= today; for each, build the invoice with lines from subscription_lines, apply the best eligible discount (active, within dates, used_count < usage_limit, min quantity/purchase met, scope matches), calculate tax per line from tax rules, compute totals on the server, insert with ON CONFLICT (subscription_id, period_start) DO NOTHING, increment discount used_count with an atomic UPDATE ... WHERE used_count < usage_limit, then advance next_billing_date by the plan cycle. Return {created, skipped}. Running it twice must create nothing the second time. Also write 5 test cases proving that.
```

**Seed data**
```
Write a seed script that inserts realistic demo data: 1 admin, 2 staff, 15 customers with Indian company names, 4 products with variants, 4 plans, 3 taxes, 3 discounts, 40 subscriptions in every status, 60 invoices (some overdue), and payments with mixed methods. Also a flag to generate 5,000 subscriptions to demonstrate performance.
```

---

## Commit se pehle 6-point checklist
1. `npm run dev` chala, page khula, console mein koi error nahi.
2. Loading, empty aur error teeno state dekhe (network band karke error check karo).
3. Sirf wahi files badli jo tumhari thi (`git status` dekho).
4. Contract ke mutabiq paths aur fields hain; Gemini ne koi nayi cheez gadh nahi di.
5. Koi naya npm package toh nahi aaya? Aaya toh team ko batao.
6. Phone-size (360px) par ek baar dekha.

Phir: `git add . && git commit -m "feat(invoices): add invoice detail with print layout"` aur push.

## Gemini ki aam galtiyan (dhyan rakho)
- Nakli package ya function ka naam bana deta hai. Import error aaye toh pehle yahi shak karo.
- "...baaki code same" likh ke file adhoori chhod deta hai. Hamesha "complete file" maango.
- Lamba chat hone par design tokens bhool jaata hai. Naya chat kholo aur Prompt 0 dobara paste karo.
- Contract se alag field naam rakh deta hai (`customerId` vs `customer_id`). Review mein yahi pakdo.
