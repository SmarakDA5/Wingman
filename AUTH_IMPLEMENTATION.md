# Wingman Authentication & Security Implementation

## Overview
This document describes the frontend authentication implementation and the required backend changes to prevent IDOR (Insecure Direct Object Reference) vulnerabilities.

## Problem Statement
Previously, the backend returned only `{id, email}` on login. If the frontend passes `user_id` in URL queries or request bodies for subsequent API calls (like fetching feeds or toggling likes), it creates an **IDOR vulnerability** where users can hijack other users' data by manipulating the `user_id` parameter.

## Solution: JWT-Based Authentication

### Frontend Implementation (Completed ✅)

#### 1. Zustand Auth Store (`src/stores/authStore.ts`)
- Manages user session state (`user`, `token`, `isAuthenticated`, `isLoading`)
- Persists auth state to localStorage using Zustand's `persist` middleware
- Provides `login`, `signup`, and `logout` actions
- **Token Storage**: JWT tokens are stored in Zustand state (persisted to localStorage)

#### 2. Axios Interceptor (`src/services/api.ts`)
```typescript
// Request interceptor automatically attaches Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```
- **All outgoing API calls** automatically include `Authorization: Bearer <JWT>` header
- No need to manually pass tokens in request bodies or URL parameters
- Response interceptor handles 401 errors by clearing auth state and redirecting to signin

#### 3. Protected Route Component (`src/App.tsx`)
```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
};
```
- Uses React Router's `<Outlet>` pattern for route protection
- Redirects unauthenticated users to `/signin`
- Wraps authenticated pages (`/app/dashboard`, `/app/likes`, `/app/info`)

### Backend Requirements (Action Required ⚠️)

#### n8n Webhook Changes Needed

##### 1. Update `/auth/login` Webhook (WH2: `/authenticate_user`)
**Current Behavior:**
```json
{
  "user": { "id": "123", "email": "user@example.com" },
  "token": "some_string"
}
```

**Required Behavior:**
- Generate a **signed JWT** (JSON Web Token) containing:
  - `user_id`: The authenticated user's ID
  - `email`: The user's email address
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp
- Return the JWT in the response

**Example JWT Payload:**
```json
{
  "user_id": "123",
  "email": "user@example.com",
  "iat": 1709856000,
  "exp": 1709942400
}
```

**Implementation Notes:**
- Use a **strong secret key** for signing (store in n8n credentials)
- Recommended algorithm: `HS256`
- Set reasonable expiration (e.g., 24 hours for development, shorter for production)
- n8n has built-in JWT nodes or use Function node with `jsonwebtoken` library

##### 2. Update `/auth/signup` Webhook (WH1: `/register_user`)
- Same JWT generation requirement as login
- After successful user registration, generate and return JWT

##### 3. Secure All Subsequent Webhooks
**Affected Webhooks:**
- WH3: `/verify_subscription`
- WH4: `/fetch_internships`
- WH5: `/fetch_schemes`
- WH6: `/fetch_jobs`
- WH7: `/fetch_liked_events`
- WH8: `/sync_like_mutation`
- WH9: `/fetch_questionnaire`
- WH10: `/update_user_info`
- WH11: `/fetch_courses`

**Required Changes:**
1. **Extract JWT from Authorization Header:**
   - Read `Authorization: Bearer <token>` header
   - Validate JWT signature using the same secret key
   - Extract `user_id` from decoded JWT payload

2. **Use Extracted `user_id` for Database Queries:**
   - ❌ **DO NOT** trust `user_id` from request body or query parameters
   - ✅ **USE** `user_id` extracted from validated JWT
   - Example: `SELECT * FROM likes WHERE user_id = ${jwt_payload.user_id}`

3. **Return 401 on Invalid/Expired Tokens:**
   - Frontend will handle redirect to signin automatically

**Example n8n Flow:**
```
Webhook Node (GET/POST)
    ↓
Function Node: Extract & Validate JWT
    ↓
[If Valid] → Database/Logic Nodes (use jwt.user_id)
    ↓
Response Node
```

**Example JWT Validation Code (n8n Function Node):**
```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'YOUR_SECRET_KEY'; // Use n8n credentials

const authHeader = $request.header.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw new Error('Missing authorization header');
}

const token = authHeader.split(' ')[1];

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  return { json: { userId: decoded.user_id, email: decoded.email } };
} catch (error) {
  throw new Error('Invalid or expired token');
}
```

## Security Benefits

1. **No IDOR Vulnerability**: User identity comes from cryptographically signed JWT, not client-supplied parameters
2. **Stateless Authentication**: Backend doesn't need to maintain session state
3. **Automatic Token Attachment**: Frontend axios interceptor ensures all requests include auth
4. **Tamper-Proof**: JWT signature prevents clients from modifying payload
5. **Expiration Control**: Tokens can expire, forcing re-authentication

## Testing Checklist

- [ ] Login returns valid JWT with `user_id` claim
- [ ] Signup returns valid JWT with `user_id` claim
- [ ] Protected endpoints accept valid JWT and extract correct `user_id`
- [ ] Protected endpoints reject invalid/expired JWTs with 401
- [ ] Protected endpoints ignore `user_id` in request body/query params
- [ ] Frontend correctly stores JWT in Zustand + localStorage
- [ ] Frontend automatically sends JWT in Authorization header
- [ ] Frontend redirects to signin on 401 responses

## Files Modified

| File | Purpose |
|------|---------|
| `src/stores/authStore.ts` | Zustand store for auth state management |
| `src/services/api.ts` | Axios instance with JWT interceptor |
| `src/App.tsx` | ProtectedRoute component for route guards |

## Next Steps

1. **Backend Developer**: Implement JWT generation in n8n `/authenticate_user` and `/register_user` webhooks
2. **Backend Developer**: Add JWT validation middleware to all protected webhooks
3. **Testing**: Verify end-to-end authentication flow with real JWT tokens
4. **Security Review**: Audit all webhooks to ensure no `user_id` is trusted from client input

---

*Generated for Wingman App - Secure Authentication Implementation*
