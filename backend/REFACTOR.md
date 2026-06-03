# Backend Architecture Refactoring

## New Folder Structure

```
backend/src/
├── config/
│   ├── constants.ts       # Constants, JWT secrets, config values
│   └── llm.ts            # LLM provider configuration
├── controllers/
│   ├── companyController.ts    # Company endpoints handlers
│   └── chatController.ts       # Chat endpoints handlers
├── middleware/
│   └── auth.ts           # Authentication & authorization middleware
├── services/
│   ├── authService.ts    # Authentication business logic
│   └── chatService.ts    # Chat & AI business logic
├── types/
│   └── index.ts          # TypeScript interfaces & types
├── utils/
│   └── vectorStore.ts    # Vector store utility & helpers
├── routes/
│   ├── chat-new.ts       # Chat routes (CLEAN)
│   ├── company-new.ts    # Company routes (CLEAN)
│   ├── swagger.ts        # Keep as-is
│   ├── mock-company.ts   # Keep as-is
│   └── (Old files to deprecate)
├── index.ts              # Entry point
├── uploads/              # File uploads
├── prisma/               # Database schema & migrations
└── package.json

```

## Architecture Layers

### 1. **Routes** (`src/routes/`)
- Handles HTTP endpoint definitions
- Delegates to controllers
- Minimal logic (only HTTP concerns)

### 2. **Controllers** (`src/controllers/`)
- Handles HTTP request/response
- Validates input data
- Calls appropriate services
- Returns responses to client

### 3. **Services** (`src/services/`)
- Contains business logic
- Database operations (Prisma)
- External API calls
- Data processing & transformations

### 4. **Middleware** (`src/middleware/`)
- Authentication (JWT)
- Authorization checks
- Error handling
- Request logging

### 5. **Utils** (`src/utils/`)
- Reusable helper functions
- Vector store logic
- Common utilities

### 6. **Config** (`src/config/`)
- Environment configuration
- Constants
- Third-party service setup (LLM, DB, etc.)

### 7. **Types** (`src/types/`)
- TypeScript interfaces
- Shared types
- Request/response types

## Migration Steps

### Step 1: Update `index.ts` to use new routes

Replace the old route imports with new ones:
```typescript
import chatRoutesNew from './routes/chat-new.js';
import companyRoutesNew from './routes/company-new.js';

app.use('/api/companies', companyRoutesNew);
app.use('/api', chatRoutesNew);
```

### Step 2: Test All Endpoints

Run the backend and test:
- `POST /api/companies/register`
- `POST /api/companies/login`
- `GET /api/companies/me`
- `POST /api/chat`
- `GET /api/chat/history`

### Step 3: Keep Old Files (Temporarily)

Keep the old route files (`company.ts`, `chat.ts`) until you verify everything works.

### Step 4: Clean Up

Once tests pass, deprecate old route files.

## Benefits

✅ **Separation of Concerns** - Each layer has a single responsibility
✅ **Reusability** - Services can be used by multiple controllers
✅ **Testability** - Each layer can be tested independently
✅ **Maintainability** - Easy to find and modify code
✅ **Scalability** - Add new features without touching existing code
✅ **Clean Code** - Professional structure
✅ **Type Safety** - Centralized TypeScript types

## Dependency Flow

```
Routes → Controllers → Services → Database/External APIs
   ↑                        ↓
   └─ Middleware ← Types, Config, Utils
```

## Next Steps

1. Update `src/index.ts` to import new routes
2. Test all endpoints work with new structure
3. Add error handling middleware
4. Add request logging middleware
5. Add input validation middleware
6. Consider adding a repository layer for database queries
