import { Router } from 'express'
import auth from './auth.js'
import staff from './staff.js'
import products from './products.js'
import plans from './plans.js'
import taxes from './taxes.js'
import discounts from './discounts.js'
import templates from './templates.js'
import subscriptions from './subscriptions.js'
import billing from './billing.js'
import invoices from './invoices.js'
import payments from './payments.js'
import customers from './customers.js'
import reports from './reports.js'
import portal from './portal.js'
const router = Router()
router.use('/auth', auth)
router.use('/staff', staff)
router.use('/products', products)
router.use('/plans', plans)
router.use('/taxes', taxes)
router.use('/discounts', discounts)
router.use('/templates', templates)
router.use('/subscriptions', subscriptions)
router.use('/billing', billing)
router.use('/invoices', invoices)
router.use('/payments', payments)
router.use('/customers', customers)
router.use('/reports', reports)
router.use('/portal', portal)
export default router
