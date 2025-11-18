# FFP Stock AI - Authentication Setup Guide

## 🔐 Overview

This document explains the complete authentication flow that has been implemented to fix the infinite redirect issue and provide true authentication for both frontend and backend.

## ✅ What Was Fixed

### Previous Issues:
1. **Infinite Redirect Loop**: After login, the page would spin indefinitely without redirecting
2. **Session Not Persisting**: Middleware checked session before cookies were properly set
3. **No Backend Auth**: API endpoints had no authentication mechanism
4. **Hydration Mismatch**: Server and client state didn't align during redirect

### Solutions Implemented:

## 📋 Architecture

### Frontend Flow:
```
User Login Form
    ↓
loginAction (Server Action)
    ↓
Supabase Auth.signInWithPassword()
    ↓
Verify Session Created (NEW)
    ↓
Wait for Cookie Propagation (NEW)
    ↓
redirect(destinationURL)
    ↓
Middleware Validates Session
    ↓
Dashboard Loads
```

### Backend Flow:
```
Frontend HTTP Request
    ↓
Middleware: Extract Bearer Token
    ↓
Verify JWT with Supabase Secret (NEW)
    ↓
Attach User Data to Request
    ↓
Route Handler
```

## 🔧 Key Components

### 1. Frontend - Middleware (`middleware.ts`)

**Changes Made:**
- Reordered logic to check public paths first
- Avoid redirecting authenticated users on login page (prevents hydration issues)
- Allow natural browser redirect after server action completes

```typescript
// NEW: Skip auth for public paths early
if (isPublicPath(pathname)) {
  return response;
}

// NEW: For authenticated users on login page, don't force redirect
// Let client-side router handle it after hydration
if (session && pathname === AUTH_PATH) {
  return response;
}
```

### 2. Frontend - Login Action (`app/login/actions.ts`)

**Changes Made:**
- Verify session was actually created before redirecting
- Add brief delay to ensure cookies are propagated to middleware
- Better error handling for failed session creation

```typescript
// NEW: Verify session was created
if (!data?.session) {
  return { error: "Login successful but session was not created." };
}

// NEW: Wait for cookie propagation
await new Promise((resolve) => setTimeout(resolve, 100));

// Now safe to redirect
redirect(redirectTo);
```

### 3. Frontend - Auth Context (`lib/supabase/auth-context.tsx`)

**NEW FILE** - Provides app-wide authentication state:
- Manages current user session
- Subscribes to auth state changes
- Provides `useAuth()` hook for components
- Available as `AuthProvider` wrapper

Usage:
```typescript
import { useAuth } from "@/lib/supabase/auth-context";

function MyComponent() {
  const { session, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {session?.user.email}</div>;
}
```

### 4. Frontend - Providers (`app/providers.tsx`)

**Changes Made:**
- Wrapped with `AuthProvider` for global auth context
- Enables any component to access auth state via `useAuth()`

### 5. Backend - Supabase Auth Middleware (`services/api/src/middleware/supabase_auth.py`)

**NEW FILE** - Validates JWT tokens:

```python
from src.middleware.supabase_auth import get_current_user

@app.get("/api/protected-endpoint")
async def protected_route(user = Depends(get_current_user)):
    """
    This endpoint now requires a valid Supabase JWT token
    User info is automatically extracted and available
    """
    return {
        "message": f"Hello {user['email']}",
        "user_id": user['user_id']
    }
```

## 🚀 How to Use

### For Frontend Development:

1. **Protected Pages**: Automatically redirected to login if not authenticated
   - Handled by middleware
   - No code changes needed

2. **Access User Info in Components**:
```typescript
import { useAuth } from "@/lib/supabase/auth-context";

export function UserGreeting() {
  const { session, isAuthenticated } = useAuth();
  
  return isAuthenticated ? (
    <p>Hello, {session?.user.email}</p>
  ) : (
    <p>Please log in</p>
  );
}
```

### For Backend Protection:

1. **Add Dependency Injection**:
```python
from fastapi import Depends
from src.middleware.supabase_auth import get_current_user

@app.get("/api/my-endpoint")
async def protected_endpoint(current_user = Depends(get_current_user)):
    # current_user now contains: user_id, email, role
    return {"message": f"Hello {current_user['email']}"}
```

2. **Optional: Without Protection** (for public endpoints):
```python
@app.get("/api/public-endpoint")
async def public_endpoint():
    return {"message": "This is public"}
```

## 🔐 Environment Variables Required

### Frontend (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

The `SUPABASE_JWT_SECRET` can be found in Supabase Dashboard:
- Settings → API → JWT Secret

## 🧪 Testing

### Test Scenario 1: Successful Login
1. Navigate to login page
2. Enter valid credentials
3. ✅ Should redirect immediately to dashboard (no spinning)
4. ✅ Page should not require refresh to authenticate

### Test Scenario 2: Invalid Credentials
1. Enter invalid email/password
2. ✅ Should show error message
3. ✅ Should stay on login page

### Test Scenario 3: Protected Page Access
1. Logout
2. Navigate directly to dashboard URL
3. ✅ Should redirect to login
4. ✅ Should preserve redirect destination in URL params

### Test Scenario 4: Session Persistence
1. Login successfully
2. Refresh the page
3. ✅ Should stay authenticated
4. ✅ Dashboard should load without redirect

### Test Scenario 5: Backend API Protection
```bash
# Without token (should fail)
curl http://localhost:8000/api/protected-endpoint

# With valid token (should work)
curl -H "Authorization: Bearer {token}" http://localhost:8000/api/protected-endpoint
```

## 📊 Flow Diagrams

### Before Fix:
```
Login → Server Action ↓
         Cookie Set ↓
         redirect() → Browser
         ↓
Middleware Checks Session
         (Session not yet propagated)
         ↓
Redirect to /login
         ↓
INFINITE LOOP 🔄
```

### After Fix:
```
Login → Server Action ↓
         Cookie Set ↓
         Verify Session Created ✓
         Wait 100ms for propagation
         redirect() → Browser
         ↓
Middleware Checks Session
         (Session NOW available)
         ✓ Session Valid
         ↓
Dashboard Loads ✅
```

## 🐛 Troubleshooting

### Symptom: "Still spinning after login"
**Possible Causes:**
1. JWT_SECRET not set in backend
2. Cookies not being set properly
3. Supabase credentials incorrect

**Solution:**
- Check browser Network tab for 302 redirect response
- Verify cookies in browser DevTools
- Check server logs for errors

### Symptom: "Keep getting redirected to login"
**Possible Causes:**
1. Session not being created
2. Middleware not finding session cookie

**Solution:**
- Check Supabase auth logs
- Verify email/password combination
- Check browser console for JS errors

### Symptom: "Backend returns 401 Unauthorized"
**Possible Causes:**
1. JWT token not sent in Authorization header
2. Invalid or expired token
3. SUPABASE_JWT_SECRET not configured

**Solution:**
```python
# Check middleware is receiving token
@app.get("/api/debug")
async def debug_endpoint(request: Request):
    auth_header = request.headers.get("Authorization")
    logger.info(f"Auth header: {auth_header}")
    return {"auth": bool(auth_header)}
```

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

## ✨ Future Enhancements

1. **Refresh Token Rotation**: Implement automatic token refresh
2. **Role-Based Access Control (RBAC)**: Add role checking in middleware
3. **Rate Limiting**: Add rate limiting for auth endpoints
4. **Multi-Factor Authentication (MFA)**: Add 2FA support
5. **Session Expiry**: Add configurable session timeout
6. **Audit Logging**: Log all auth events for security

