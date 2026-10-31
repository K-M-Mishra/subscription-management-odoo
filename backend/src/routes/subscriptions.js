import { Router } from 'express'
import { HttpError } from '../middleware/error.js'
// Endpoints: docs/API_CONTRACT.md. Is stub ko apne code se REPLACE karo.
const router = Router()
router.use((req, res, next) => next(new HttpError(501, 'not_implemented', 'subscriptions endpoints are not built yet.')))
export default router
