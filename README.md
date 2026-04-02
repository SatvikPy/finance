# Finance Dashboard Backend

A small TypeScript + Express backend for a finance dashboard with role-based access control and dashboard summary analytics.

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Zod validation

## Features

- User + role management (`VIEWER`, `ANALYST`, `ADMIN`)
- Financial transactions CRUD (income/expense/category/date/notes)
- Dashboard summary endpoint with:
  - Total income, total expenses, net balance
  - Category-wise totals
  - Recent activity
  - Monthly/weekly trends
- Backend-enforced access control (RBAC)
- Input validation + consistent error responses
- Soft delete for transactions (`deletedAt`)

## Setup

1. Install dependencies

   ```sh
   npm install
   ```

2. Ensure environment variables are set

   - `.env` is included for local dev (uses SQLite `dev.db`).

3. Create/update the SQLite schema

   ```sh
   npx prisma db push
   ```

4. Seed default users and sample transactions

   ```sh
   npm run seed
   ```

   Seeded usernames:
   - `viewer1` (role `VIEWER`)
   - `analyst1` (role `ANALYST`)
   - `admin1` (role `ADMIN`)

   Seed password comes from `SEED_PASSWORD` (default: `Password123!`).

5. Run the server

   ```sh
   npm run dev
   ```

Server health check:

`GET /health`

## Authentication

JWT auth. Send:

`Authorization: Bearer <token>`

Login:

`POST /auth/login`

Request body:

```json
{ "username": "admin1", "password": "Password123!" }
```

Response:

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "admin1", "role": "ADMIN", "status": "ACTIVE" }
}
```

Logout:

`POST /auth/logout` (stateless; 204)

## Role Permissions (RBAC)

- `VIEWER`
  - Can read dashboard summary: `GET /dashboard/summary`
  - Cannot access raw transactions or modify data
- `ANALYST`
  - Can read dashboard summary: `GET /dashboard/summary`
  - Can read transactions: `GET /transactions`, `GET /transactions/:id`
  - Cannot create/update/delete transactions
- `ADMIN`
  - Full access to transactions CRUD
  - Full access to user management

Inactive users (`INACTIVE`) are rejected at auth middleware.

## API Endpoints

### Users (ADMIN only)

- `POST /users`
- `GET /users`
- `PATCH /users/:id`
- `DELETE /users/:id` (soft-deactivate via `status = INACTIVE`)

### Transactions

- `POST /transactions` (ADMIN only)
- `GET /transactions` (ANALYST, ADMIN)
- `GET /transactions/:id` (ANALYST, ADMIN)
- `PATCH /transactions/:id` (ADMIN only)
- `DELETE /transactions/:id` (ADMIN only; soft delete)

Request fields:

- `amount`: number or string (e.g. `10` or `"10.50"`)
- `type`: `INCOME` or `EXPENSE`
- `category`: string
- `date`: `YYYY-MM-DD`
- `notes`: optional string

### Dashboard

`GET /dashboard/summary`

Query params (all optional):

- `from`: `YYYY-MM-DD`
- `to`: `YYYY-MM-DD`
- `granularity`: `monthly` (default) or `weekly`
- `recentLimit`: integer (default `10`)

Response shape:

```json
{
  "summary": {
    "range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
    "totals": { "totalIncome": "0.00", "totalExpenses": "0.00", "netBalance": "0.00" },
    "categoryTotals": [
      { "category": "Salary", "incomeTotal": "1000.00", "expenseTotal": "0.00" }
    ],
    "recentActivity": [
      { "id": "...", "amount": "10.00", "type": "INCOME", "category": "Salary", "date": "YYYY-MM-DD", "notes": null }
    ],
    "trends": [
      { "period": "YYYY-MM", "incomeTotal": "1000.00", "expenseTotal": "500.00", "netBalance": "500.00" }
    ]
  }
}
```

All monetary values are formatted as strings with 2 decimals.

## Error Responses

Validation and business errors return:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request input",
    "details": []
  }
}
```

## Tests

```sh
npm test
```

Includes small integration tests for RBAC and dashboard total calculation.

