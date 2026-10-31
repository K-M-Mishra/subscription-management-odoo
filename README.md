# Brightloop – Subscription Management System 🔄

Build one system to run plans, subscriptions, and recurring billing in one place.

Brightloop is a unified software platform designed to handle the full lifecycle of a subscription-based business. From setting up products and plans to sending invoices, collecting payments, and reporting revenue, Brightloop serves as the digital backbone for modern recurring revenue businesses.

## 🚀 The Challenge We Solved

Before Brightloop, subscription management meant tracking renewals in spreadsheets, manually typing out invoices, matching payments by scrolling through bank statements, and struggling to calculate monthly recurring revenue.

Brightloop automates these workflows, ensuring renewals are never missed, invoices are perfectly accurate, and the finance team has real-time visibility into the company's health.

## ✨ Key Features (A Month at Brightloop)

### 🔐 Secure Authentication & Role-Based Access

Strict Security: Sign-ups require robust passwords (min 8 chars, uppercase, lowercase, special char). Password reset flows via email.

Three-Tier Roles:

Admin: Full system control (creates products, plans, taxes, discounts, and manages staff).

Staff: Internal day-to-day operations with restricted access.

Customer Portal: Customers log in to view only their own active subscriptions and past invoices without needing to email support.

### 📦 Product & Plan Management

Dynamic Products: Create software, add-ons, or services with base sales and cost prices.

Variant Editor: Configure product variants (e.g., Brand: Odoo = +₹560 extra) with live margin calculations.

Flexible Billing Plans: Set up daily, weekly, monthly, or yearly billing cycles, minimum quantities, and validity dates. Configure plans to auto-close, pause, or renew at the end of their term.

### 📝 Quotes to Subscriptions

Quotation Templates: Sales reps can quickly generate offers using pre-built templates with set validities.

Subscription Lifecycle: Track statuses clearly: Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed.

### 🧾 Automated Invoicing & Taxes

Zero Manual Entry: Invoices are auto-generated from active subscriptions on billing day.

Tax Rules: Taxes are automatically calculated based on Admin-defined rules.

Invoice Lifecycle: Track invoices from Draft ➔ Confirmed ➔ Paid (or Cancelled).

### 🏷️ Smart Discounts

Targeted Offers: Admins can set fixed or percentage-based discounts.

Conditions: Apply minimum purchase amounts, quantity limits, validity dates, and usage limits.

Scope: Apply discounts to specific products or entire subscriptions. Auto-applies to the next invoice without manual intervention.

### 💳 Payment Tracking & Finance Dashboard

Record Payments: Log payment methods, amounts, dates, and internal notes against specific invoices.

Real-time Dashboard: A high-performance (<2s response time) overview for the finance lead. View active subscriptions, total revenue collected, outstanding amounts, and overdue invoices with easy filtering.

## 🛠️ Tech Stack

Frontend:

React 18 (Functional components & Hooks)

Vite (Lightning-fast build tool)

React Router v6 (Client-side routing)

Pure CSS (No external UI libraries or Tailwind. Custom design system utilizing specific CSS variables and custom components like Badge, Stat, Head, Empty, and Stepper).

Backend:

Node.js & Express (RESTful API architecture)

PostgreSQL (Relational database for structured subscription, invoice, and user data)

## 🎨 Design System & UI Principles

The application strictly adheres to a custom design language:

Colors: --paper (#f1f3f8), --ink (#0e1b2c), --loop (#2748e8), --warn (#b4234a), --ok (#0b8a6b).

Typography: 'Bricolage Grotesque' for headers/numbers, 'IBM Plex Sans' for body text.

UX Philosophy: Plain English, sentence case copy. Clear error handling and actionable empty states. Every list is server-side paginated to feel fast even with thousands of rows.

## 💻 Local Development Setup

```sh
cd subscription-management-odoo/
npm run setup
npm run dev
```

Access the App

Open your browser and navigate to [http://localhost:5173](http://127.0.0.1:5173/) (or the port specified by Vite).

Built for the Subscription Management System Hackathon.
