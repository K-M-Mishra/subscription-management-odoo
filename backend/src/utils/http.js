// Express 4 async errors apne aap nahi pakadta: har async handler ko wrap() karo.
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
// Contract: ?page=1&limit=25  ->  { data, page, limit, total }
export function pageParams(q) {
  const page = Math.max(1, parseInt(q.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 25))
  return { page, limit, offset: (page - 1) * limit }
}
export const listResponse = (data, total, { page, limit }) => ({ data, page, limit, total })
