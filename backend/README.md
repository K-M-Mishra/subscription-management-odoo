# Brightloop API

Run from the repository root: `npm run setup`, then `npm run dev`.

Requires Node >=22.13; uses built-in SQLite persisted in `backend/data/brightloop.sqlite`. Schema initializes automatically. Do not run the old PostgreSQL docker-compose workflow for this implementation. Old PostgreSQL data is not imported.

API base: `/api/v1`. Health: `/api/v1/health`. Authentication: Bearer JWT. Roles and customer ownership are enforced on the server. Customer registration always produces a customer role; only an administrator can create staff.

Tests: `npm test` from root. Detailed setup, credentials, billing rules, email configuration, deployment limits and commit instructions: [../REPAIR_GUIDE.md](../REPAIR_GUIDE.md).
