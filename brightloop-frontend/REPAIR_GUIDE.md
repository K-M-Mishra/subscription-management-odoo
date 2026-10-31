# Brightloop: repair and run guide

This repair was prepared from GitHub commit `34fd2e2623529874e97aeab8bcfa78e67411c2eb` of `K-M-Mishra/subscription-management-odoo`.

## 1. Kaunsa folder use karna hai

- Project root: wahi folder jisme `backend`, `brightloop-frontend`, `frontend`, aur root `package.json` hain.
- Working UI: **brightloop-frontend/**.
- Working API: **backend/**.
- Purana **frontend/** folder unchanged hai; isse run mat karo.
- `test.txt`, `App.jsxy`, `product.jsx`, old CSS files aur unused pages ko delete/replace karne ki zaroorat nahi. Active imports unhe use nahi karte.

## 2. Code paste karne ka tareeka

Open **Brightloop_Filewise_Code.html**. Har entry par exact path, NEW/REPLACE, aur Copy full file button hai.

- **REPLACE**: existing file kholo → Select All → poora naya code paste → Save.
- **NEW**: exact folder/path par file banao → poora code paste → Save. Capital letters bhi same rakho.
- File ke andar aadha purana aur aadha naya code mix mat karo.
- `package-lock.json` manually type mat karo: ZIP se matching lockfiles copy karo, ya install command se regenerate karao.
- Backend aur frontend ek saath contract follow karte hain. Sab required files lagane ke baad app run karo.

Fast alternative: ZIP mein `APPLY_REPAIR.py` har required file ko individually copy karta hai, pehle existing versions ka dated backup project ke bahar banata hai. Unlisted files untouched rehti hain. Script Git par commit/push nahi karta. Team ke unpublished edits hon to backup aur diff review karo.

```bash
# Terminal: apne EXISTING project root mein ho.
python3 ~/Downloads/Brightloop_Repair/APPLY_REPAIR.py "$PWD"
```

Agar extracted folder Downloads mein nahi hai, script ka actual path use karo. Whole backend/frontend folder ko Finder se REPLACE mat karo: ZIP mein sirf changed/new files hain, poora repository nahi.

## 3. Install and start

Node **22.13 or later** required (`node --version`). Node 24/26 works. Old Node par built-in `node:sqlite` missing ho sakta hai.

Root terminal:

```bash
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173**. `npm run dev` frontend aur backend dono start karta hai. Pehle se chal rahe old dev servers ko `Ctrl+C` se stop karo; port 4000/5173 free hone chahiye.

Database `backend/data/brightloop.sqlite` automatically banta hai. PostgreSQL, Docker, `docs/schema.sql`, aur manual migration ab local demo ke liye required nahi hain. Existing PostgreSQL data automatically migrate nahi hota. Provided repository mein working schema/routes nahi the, isliye this repair uses SQLite for a self-contained demo.

`.env` optional hai local demo ke liye. Bina stable `JWT_SECRET` ke server restart par login dobara karna padega. `backend/.env.example` se local `backend/.env` bana sakte ho; `.env` Git mein commit mat karna. Old DATABASE_URL variable ab use nahi hota.

## 4. Local demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@brightloop.test | Brightloop@123 |
| Staff | staff@brightloop.test | Brightloop@123 |
| Customer | customer@brightloop.test | Brightloop@123 |

Demo users, one product with an Odoo +560 variant, one plan, one sample tax, and one template seed only on an empty development database. No fake subscriptions/payments are inserted: create them through the UI. Sample tax is demo configuration, not tax advice.

## 5. Judge demo: complete flow

1. Admin login → Products: inspect Business Workspace and Odoo variant.
2. Plans: monthly/daily/weekly/yearly cycles; set fee/minimum quantities/plan controls.
3. Customers: use Acme Studio or add a customer with initial portal password.
4. Discounts: optionally create a dated fixed/percentage rule. Best eligible single rule applies; no stacking.
5. Subscriptions → New: select Business Starter template, Acme Studio, dates and quantity → Create draft.
6. Detail → **Move to Quotation → Move to Confirmed → Move to Active**.
7. **Run due billing** → open linked invoice. Repeat run: same period is not billed twice.
8. **Confirm invoice**, download/print PDF, send invoice (see email setup below).
9. Record partial payment → remaining balance updates. Pay remainder → status Paid.
10. Dashboard shows actual received payments, balances, overdue invoices and current recurring value.
11. Customer login → own subscriptions/invoices only. View invoice and pause/resume/renew where the plan allows.
12. Staff login → customer/subscription/billing operations work; admin configuration and staff creation are rejected by the API.

## 6. Email, scheduling and hosting

- **Local email mode**: without SMTP, reset emails and invoice emails save as `.eml` in `backend/outbox/`. Open the email file to follow the reset link. These are NOT delivered to a real inbox.
- **Real email**: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in backend/.env. Set FRONTEND_URL to the actual frontend URL. Real SMTP delivery was not tested because credentials were not supplied.
- Password reset links expire in 30 minutes, work once, and invalidate older login sessions.
- Scheduler checks due subscriptions every minute **while Node is running**. Missed dates are caught up on restart, max 500 new invoices per run, with subsequent runs continuing the backlog.
- Calendar dates and automated billing use UTC consistently.
- Bills cover `[startDate, expiryDate)`: expiry date itself is not billed. Paused cycles are skipped. Resume continues the original calendar anchor. January 31 -> February last day -> March 31.
- Invoice line prices/taxes and plan rules are snapshots at subscription creation. Editing a catalog product/plan does not silently rewrite existing subscriptions. Discount rules are evaluated for each billing period.
- Cancelled invoices are not regenerated automatically for the same period. Do not cancel a genuine receivable unless intended.
- Payments are manual records of money already received; no payment gateway/card charging is implemented.
- MRR is the monthly equivalent of current active subscription subtotal before taxes/discounts, not accounting revenue recognition. Dashboard date filters apply to invoice issue date and payment receipt date; active subscriptions are current.
- **GitHub commits do not host a Node backend. GitHub Pages alone cannot run this application.**
- Single-server deployment: `npm run setup`, `npm run build`, `npm start`; then open the server URL on port 4000. Backend serves compiled frontend plus API. Use a persistent writable disk for SQLite and a continuously running Node process. Production needs NODE_ENV=production, a strong JWT_SECRET, SMTP, FRONTEND_URL and initial ADMIN_EMAIL/ADMIN_PASSWORD on a new database. Use HTTPS at the host. Never deploy demo credentials as real admin accounts.
- This implementation is a tested hackathon application for one Node server, not a distributed, multi-region billing platform. No external hosting deployment has been performed.

## 7. Verify before commit

```bash
npm test
npm run build
git diff --check
git status --short
```

Automated tests cover authentication/roles, strict password rules, duplicate email, authoritative prices and variants, quote validity, duplicate billing, discounts and usage limits, partial/duplicate/over-payments, customer isolation, PDF output, email generation, pause/resume/renew, calendar anchors, catch-up/auto close and password reset reuse/session revocation. Local list/report timing is checked against 2 seconds with 3,000+ subscriptions; this is not a guarantee for every host or concurrent load.

Browser validation also passed: ten admin/staff navigation pages, the complete UI subscription-to-invoice-to-payment flow, customer portal and role redirects, zero page JavaScript errors, and a 390px mobile viewport without horizontal overflow. Desktop/mobile screenshots were inspected. Backend and frontend dependency audits reported zero known vulnerabilities at verification time.

## 8. Commit in sensible groups

Only after the entire code pack is in place and checks pass:

```bash
git add .gitignore package.json package-lock.json scripts backend REPAIR_GUIDE.md
git commit -m "Implement Brightloop backend and local setup"
git add brightloop-frontend
git commit -m "Connect Brightloop UI to working subscription billing API"
```

Review `git diff --cached --stat` before each commit if teammates have local edits. This repair contains no deletions of the unused frontend. Push to your current team's agreed branch; it does not require switching to a new branch. No commit or push has been performed by this repair.

## 9. If something fails locally

- Cannot reach backend: run commands from the project root; check both processes in the terminal.
- `node:sqlite` not found: Node is too old; use Node >=22.13.
- `EADDRINUSE` / port in use: stop the old process, then run again.
- “Log in to continue” after restart: sign in again; set a stable JWT_SECRET to retain sessions across restarts.
- Vite default page: you launched `frontend/`; launch from root with `npm run dev`.
- Invoices empty: subscription must be Active, start date due, and not paused/expired; click Run due billing.
- Payment rejected: invoice must be Confirmed, amount >0 and no greater than remaining balance; date cannot be in future.
- No actual reset email: configure SMTP or inspect local backend/outbox.
