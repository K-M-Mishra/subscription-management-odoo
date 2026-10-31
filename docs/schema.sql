-- Brightloop · PostgreSQL schema (v1)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE user_role   AS ENUM ('admin','staff','customer');
CREATE TYPE bill_cycle  AS ENUM ('daily','weekly','monthly','yearly');
CREATE TYPE sub_status  AS ENUM ('draft','quotation','confirmed','active','closed');
CREATE TYPE inv_status  AS ENUM ('draft','confirmed','paid','cancelled');
CREATE TYPE disc_type   AS ENUM ('percent','fixed');
CREATE TYPE disc_scope  AS ENUM ('product','subscription');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer', created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_uq ON users (lower(email));   -- ek email = ek account

CREATE TABLE password_resets (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
);
CREATE TABLE customers (                       -- customer user ki company/profile
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id), company TEXT NOT NULL,
  phone TEXT, address TEXT, gstin TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type TEXT NOT NULL, sales_price NUMERIC(12,2) NOT NULL CHECK (sales_price >= 0),
  cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0), notes TEXT, active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE product_variants (                -- e.g. attribute=Brand, value=Odoo, extra_price=560
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL, value TEXT NOT NULL, extra_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (product_id, attribute, value)
);
CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, rate_percent NUMERIC(5,2) NOT NULL CHECK (rate_percent >= 0),
  is_default BOOLEAN NOT NULL DEFAULT false, active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE products ADD COLUMN tax_id UUID REFERENCES taxes(id);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, price NUMERIC(12,2) NOT NULL CHECK (price >= 0), cycle bill_cycle NOT NULL,
  min_quantity INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  available_from DATE NOT NULL, available_to DATE, CHECK (available_to IS NULL OR available_to >= available_from),
  auto_close BOOLEAN NOT NULL DEFAULT false, can_close_early BOOLEAN NOT NULL DEFAULT false,
  can_pause BOOLEAN NOT NULL DEFAULT false, can_renew BOOLEAN NOT NULL DEFAULT false,  -- admin decides per plan
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE quotation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, plan_id UUID NOT NULL REFERENCES plans(id), validity_days INT NOT NULL CHECK (validity_days > 0)
);
CREATE TABLE template_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), variant_id UUID REFERENCES product_variants(id), quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE SEQUENCE subscription_no_seq START 1001;
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE DEFAULT ('SUB-' || nextval('subscription_no_seq')),
  customer_id UUID NOT NULL REFERENCES customers(id), plan_id UUID NOT NULL REFERENCES plans(id),
  template_id UUID REFERENCES quotation_templates(id),
  start_date DATE NOT NULL, expiry_date DATE NOT NULL, CHECK (expiry_date > start_date),
  payment_terms TEXT NOT NULL DEFAULT 'immediate',          -- immediate | net_15 | net_30
  status sub_status NOT NULL DEFAULT 'draft', paused BOOLEAN NOT NULL DEFAULT false,
  next_billing_date DATE, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE subscription_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), variant_id UUID REFERENCES product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0), unit_price NUMERIC(12,2) NOT NULL, tax_id UUID REFERENCES taxes(id)
);

CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type disc_type NOT NULL, value NUMERIC(12,2) NOT NULL CHECK (value > 0),
  scope disc_scope NOT NULL, min_purchase NUMERIC(12,2) NOT NULL DEFAULT 0, min_quantity INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL, end_date DATE NOT NULL, CHECK (end_date >= start_date),
  usage_limit INT NOT NULL CHECK (usage_limit > 0), used_count INT NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT true,
  CHECK (used_count <= usage_limit)                          -- limit se zyada kabhi nahi
);
CREATE TABLE discount_products (
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE, product_id UUID REFERENCES products(id),
  PRIMARY KEY (discount_id, product_id)
);

CREATE SEQUENCE invoice_no_seq START 1;
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || lpad(nextval('invoice_no_seq')::text, 5, '0')),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id), customer_id UUID NOT NULL REFERENCES customers(id),
  period_start DATE NOT NULL, period_end DATE NOT NULL, due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL, discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL, total NUMERIC(12,2) NOT NULL, amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status inv_status NOT NULL DEFAULT 'draft', sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, period_start)                     -- ek period = ek hi invoice (double billing impossible)
);
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL, quantity INT NOT NULL, unit_price NUMERIC(12,2) NOT NULL,
  discount_id UUID REFERENCES discounts(id), discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0, tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0, amount NUMERIC(12,2) NOT NULL
);
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id), method TEXT NOT NULL,   -- upi | card | bank_transfer | cheque | cash
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), paid_on DATE NOT NULL, note TEXT,
  recorded_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2-second rule: dashboard aur list queries ke indexes
CREATE INDEX subs_status_idx    ON subscriptions (status);
CREATE INDEX subs_customer_idx  ON subscriptions (customer_id);
CREATE INDEX subs_billing_idx   ON subscriptions (next_billing_date) WHERE status = 'active' AND NOT paused;
CREATE INDEX inv_status_due_idx ON invoices (status, due_date);
CREATE INDEX inv_customer_idx   ON invoices (customer_id);
CREATE INDEX pay_invoice_idx    ON payments (invoice_id);
CREATE INDEX pay_date_idx       ON payments (paid_on);
-- "Overdue" stored nahi hota: status IN ('draft','confirmed') AND due_date < current_date se nikalta hai.
