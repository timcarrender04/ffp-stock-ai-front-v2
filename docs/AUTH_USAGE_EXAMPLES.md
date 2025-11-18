# Authentication Usage Examples

## Frontend Examples

### 1. Using the useAuth() Hook

```typescript
// ✅ BASIC USAGE
import { useAuth } from "@/lib/supabase/auth-context";

export function UserProfile() {
  const { session, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session?.user.email}</h1>
      <p>User ID: {session?.user.id}</p>
    </div>
  );
}
```

### 2. Conditional Rendering Based on Auth

```typescript
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@heroui/button";

export function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <nav>
      <h1>FFP Stock AI</h1>
      {isAuthenticated ? (
        <>
          <Button href="/dashboard">Dashboard</Button>
          <Button href="/api/auth/logout">Logout</Button>
        </>
      ) : (
        <Button href="/login">Login</Button>
      )}
    </nav>
  );
}
```

### 3. Getting User Info in Server Components

```typescript
// ✅ SERVER COMPONENT (No useAuth() needed)
// This runs on the server only

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function Dashboard() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard for {session.user.email}</h1>
      {/* Your content here */}
    </div>
  );
}
```

### 4. Protecting Routes with Middleware

```typescript
// middleware.ts - ALREADY CONFIGURED
// Just add your paths here

const protectedPaths = ["/dashboard", "/settings", "/analytics"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some(path => pathname.startsWith(path));
}

// The middleware will automatically redirect unauthenticated users
// to /login?redirectTo=[original-path]
```

### 5. Handling Logout

```typescript
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### 6. Programmatic Login

```typescript
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ManualLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      const supabase = createClient();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = (e.target as any).email.value;
      const password = (e.target as any).password.value;
      handleLogin(email, password);
    }}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### 7. Protecting API Routes

```typescript
// app/api/protected-route/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // User is authenticated
  return NextResponse.json({
    message: `Hello, ${session.user.email}`,
    userId: session.user.id,
  });
}
```

### 8. Client-side Auth Listener

```typescript
// Monitor auth state changes across browser tabs
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthListener() {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`);
      console.log("Session:", session?.user.email);

      if (event === "SIGNED_IN") {
        console.log("User logged in");
      } else if (event === "SIGNED_OUT") {
        console.log("User logged out");
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
```

## Backend Examples (FastAPI)

### 1. Basic Protected Endpoint

```python
# services/api/src/routes/protected_routes.py

from fastapi import APIRouter, Depends
from src.middleware.supabase_auth import get_current_user

router = APIRouter(prefix="/api")

@router.get("/user/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    """
    Returns current user profile.
    Requires: Valid Supabase JWT token
    """
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }
```

### 2. Protected Data Endpoint

```python
@router.get("/moonshot/top")
async def get_moonshot_top(
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    """
    Get top moonshot signals.
    Only authenticated users can access.
    """
    # Your logic here
    return {
        "user": current_user["email"],
        "signals": fetch_moonshot_top(limit)
    }
```

### 3. Public Endpoint (No Auth)

```python
@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    No authentication required.
    """
    return {
        "status": "ok",
        "service": "FFP Stock AI API"
    }
```

### 4. Optional Authentication

```python
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer(auto_error=False)

@router.get("/data")
async def get_data(
    credentials: Optional[HTTPAuthCredentials] = Depends(security)
):
    """
    Endpoint that works with or without auth.
    Shows more data to authenticated users.
    """
    if credentials:
        # User is authenticated
        user = await get_current_user(credentials)
        return {"data": "full_data", "user": user["email"]}
    else:
        # Public access
        return {"data": "partial_data"}
```

### 5. Role-Based Access

```python
from fastapi import HTTPException, status

@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete user - admin only.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Delete user logic
    return {"message": f"User {user_id} deleted"}
```

### 6. Accessing User from Token

```python
@router.post("/trading/position")
async def create_trading_position(
    position_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Create trading position for current user.
    """
    user_id = current_user["user_id"]
    user_email = current_user["email"]
    
    # Save position with user_id
    return {
        "message": f"Position created for {user_email}",
        "user_id": user_id,
        "position": position_data
    }
```

### 7. Application Startup with Auth

```python
# services/api/src/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.middleware.supabase_auth import SupabaseAuthMiddleware, extract_jwt_secret
from loguru import logger

app = FastAPI(title="FFP Stock AI")

# Add middleware
app.add_middleware(SupabaseAuthMiddleware)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3075", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Check if auth is configured
    jwt_secret = extract_jwt_secret()
    if jwt_secret:
        logger.info("✓ Supabase JWT authentication enabled")
    else:
        logger.warning("⚠ Supabase JWT authentication disabled - set SUPABASE_JWT_SECRET")

# Include your routers
from src.routes import protected_routes
app.include_router(protected_routes.router)
```

### 8. Testing Protected Endpoints

```bash
# ❌ Without token - fails
curl http://localhost:8000/api/user/profile
# Response: 403 Forbidden

# ✅ With valid token - works
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8000/api/user/profile
# Response: {"user_id": "...", "email": "..."}

# ❌ With invalid token - fails
curl -H "Authorization: Bearer invalid" \
  http://localhost:8000/api/user/profile
# Response: 401 Unauthorized
```

## Testing & Debugging

### 1. Check Frontend Session

```typescript
// Run in browser console
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.auth.getSession();
console.log("Session:", data.session);
```

### 2. Check Backend JWT

```python
# Add to any endpoint for debugging
from fastapi import Request

@app.get("/api/debug/auth")
async def debug_auth(request: Request):
    auth_header = request.headers.get("Authorization")
    return {
        "auth_header_present": bool(auth_header),
        "auth_header": auth_header[:20] + "..." if auth_header else None
    }
```

### 3. Monitor Auth State

```typescript
import { createClient } from "@/lib/supabase/client";

export function useAuthDebug() {
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.group("🔐 Auth Event");
        console.log("Event:", event);
        console.log("Session:", session?.user);
        console.groupEnd();
      }
    );

    return () => subscription?.unsubscribe();
  }, []);
}
```

## Common Patterns

### Redirect Unauthenticated Users

```typescript
"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### Fetch User-Specific Data

```typescript
"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect, useState } from "react";

export function UserData() {
  const { session } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!session) return;

    fetch("/api/user/data", {
      headers: {
        "Authorization": `Bearer ${session.access_token}`
      }
    })
    .then(r => r.json())
    .then(setData);
  }, [session]);

  return <div>{JSON.stringify(data)}</div>;
}
```

### Permission Checking

```typescript
import { useAuth } from "@/lib/supabase/auth-context";

export function AdminPanel() {
  const { session } = useAuth();
  const isAdmin = session?.user?.user_metadata?.role === "admin";

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Content</div>;
}
```

