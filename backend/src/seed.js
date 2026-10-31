import { db, put, uid } from './db.js';
import { config } from './config.js';
import { createUser } from './routes/auth.js';
export async function seed() {
  if (db.prepare('SELECT count(*) AS n FROM users').get().n) return;
  if (config.production) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
      throw new Error(
        'First production start requires ADMIN_EMAIL and ADMIN_PASSWORD.',
      );
    await createUser(
      {
        name: 'Administrator',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
      'admin',
    );
    return;
  }
  await createUser(
    {
      name: 'Krishna · Admin',
      email: 'admin@brightloop.test',
      password: 'Brightloop@123',
    },
    'admin',
  );
  await createUser(
    {
      name: 'Sales Team',
      email: 'staff@brightloop.test',
      password: 'Brightloop@123',
    },
    'staff',
  );
  await createUser({
    name: 'Acme Studio',
    email: 'customer@brightloop.test',
    password: 'Brightloop@123',
  });
  const product = put('products', {
    name: 'Business Workspace',
    type: 'Software',
    salesPrice: 1000,
    costPrice: 300,
    notes: 'Team productivity suite',
    variants: [{ id: uid(), name: 'Odoo', extraPrice: 560 }],
  });
  const plan = put('plans', {
    name: 'Monthly Flex',
    price: 0,
    interval: 'monthly',
    minQuantity: 1,
    startDate: '',
    endDate: '',
    allowClose: true,
    allowPause: true,
    allowRenew: true,
    autoClose: true,
  });
  const tax = put('taxes', { name: 'Demo tax 18%', rate: 18 });
  put('templates', {
    name: 'Business Starter',
    planId: plan.id,
    validDays: 30,
    lines: [
      { productId: product.id, variantId: '', quantity: 1, taxId: tax.id },
    ],
  });
  console.log(
    'Local demo accounts: admin@brightloop.test / staff@brightloop.test / customer@brightloop.test ; password: Brightloop@123',
  );
}
