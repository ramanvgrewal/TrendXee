# TrendXee — Codebase Audit Report
> **Scope:** Full review of `trendzy-api` (Spring WebFlux/MongoDB), `trendzy-business` (Spring MVC/PostgreSQL/OAuth2), and `trendzy-front` (React/TanStack Router)
> **Goal:** Identify critical bugs, security gaps, and practical blockers before public launch.

## Resolution Status

**18 of 20 issues are fixed in this branch.** Line numbers in each "Problem"
block refer to the code **as it was before** the fix.

| # | Severity | Status |
|---|----------|--------|
| 01 | 🔴 Critical | ✅ Fixed — hardcoded admin email removed (backend + frontend) |
| 02 | 🔴 Critical | ✅ Fixed — dead `CorsConfig.java` deleted |
| 03 | 🔴 Critical | ✅ Fixed — RSA public key cached at startup |
| 04 | 🔴 Critical | ✅ Fixed — circuit breaker now resets after cooldown |
| 05 | 🔴 Critical | ✅ Fixed — `ddl-auto: validate` (⚠️ see PR description) |
| 06 | 🟠 High | ✅ Fixed — rate limit, validation, structured logging |
| 07 | 🟠 High | ✅ Fixed — `credentials: "include"` added |
| 08 | 🟠 High | ✅ Fixed — price validation + null `signalProducts` |
| 09 | 🟠 High | ✅ Fixed — 204 on delete, 404 when missing |
| 10 | 🟠 High | ✅ Fixed — dead auth code removed |
| 11 | 🟠 High | ✅ Fixed — `GlobalExceptionHandler` added |
| 12 | 🟡 Medium | ✅ Fixed — category aliases accepted |
| 13 | 🟡 Medium | ⏸️ **Deferred** — needs a backend/frontend contract decision |
| 14 | 🟡 Medium | ✅ Fixed — security headers added |
| 15 | 🟡 Medium | ✅ Fixed — `Promise.allSettled` isolates lane failures |
| 16 | 🟡 Medium | ✅ Fixed — `SecurityContext` cleared on invalid token |
| 17 | 🔵 Low | ✅ Fixed — Bean Validation on signup/login |
| 18 | 🔵 Low | ✅ Fixed — `*.pem` ignored, `GenerateKeys.java` moved |
| 19 | 🔵 Low | ⏸️ **Deferred** — JWT library consolidation is a larger refactor |
| 20 | 🔵 Low | ✅ Fixed — backends moved to an internal Docker network |

---

## 🔴 CRITICAL — Fix Before Launch

### [BUG-01] Hardcoded Admin Email in Production Code
**Severity:** 🔴 Critical (Security)
**Files:** [`OAuth2LoginSuccessHandler.java`](trendzy-business/src/main/java/com/trendzy/business/auth/OAuth2LoginSuccessHandler.java#L45-L60), [`TrendCard.tsx`](trendzy-front/src/components/TrendCard.tsx#L143)

**Problem:**
```java
// OAuth2LoginSuccessHandler.java — Line 52 & 60
if ("ramanvgrewal@gmail.com".equalsIgnoreCase(email)) {
    isAdmin = true;
}
// ...
if ("ramanvgrewal@gmail.com".equalsIgnoreCase(email) && !"ADMIN".equals(user.getRole())) {
```
```tsx
// TrendCard.tsx — Line 143
const isAdmin = user?.email === "ramanvgrewal@gmail.com";
```

**Impact:**
- The developer's personal Gmail is a **hardcoded backdoor** — if this email is ever compromised, attackers get permanent admin access
- The admin check on the **frontend** is pure **security theater** — any user who knows this email string can inspect the JS bundle and forge behavior
- Admin tools (Delete, Edit Price) are visible/controllable only by a client-side string comparison — the API enforces `ROLE_ADMIN`, but the button-reveal logic is completely client-controlled

**Fix:**
```java
// Remove hardcoded email. Use only the configurable APP_ADMIN_EMAILS env var.
// In OAuth2LoginSuccessHandler.java, delete lines 52-54 and 60-63.
// The env-var-based check already handles it.
```
```tsx
// TrendCard.tsx — check role, not email
const isAdmin = user?.role === "ADMIN";
```

---

### [BUG-02] Duplicate / Conflicting CORS Configuration in trendzy-api
**Severity:** 🔴 Critical (Functional — breaks cross-origin auth)
**Files:** [`CorsConfig.java`](trendzy-api/src/main/java/com/trendzy/api/config/CorsConfig.java), [`SecurityConfig.java`](trendzy-api/src/main/java/com/trendzy/api/config/SecurityConfig.java#L115-L131)

**Problem:**  
`trendzy-api` defines CORS in **two separate places**:
1. `CorsConfig.java` — via `WebFluxConfigurer.addCorsMappings()`
2. `SecurityConfig.java` — via `cors.configurationSource(corsConfigurationSource())`

In Spring WebFlux, when security-level CORS is configured, the framework-level `WebFluxConfigurer` CORS **is ignored**. This means `CorsConfig.java` is **dead code** that creates false confidence. The effective config comes only from `SecurityConfig.java`. If they ever diverge (someone updates one but not the other), CORS bugs silently appear in production.

**Fix:**
- Delete [`CorsConfig.java`](trendzy-api/src/main/java/com/trendzy/api/config/CorsConfig.java) entirely
- Keep only the `SecurityConfig.java` `corsConfigurationSource()` bean

---

### [BUG-03] RSA Public Key Loaded on Every Request (N+1 I/O)
**Severity:** 🔴 Critical (Performance/Reliability)
**File:** [`SecurityConfig.java` (trendzy-api)](trendzy-api/src/main/java/com/trendzy/api/config/SecurityConfig.java#L66-L105)

**Problem:**
The `jwtAuthenticationFilter()` in `trendzy-api` calls `loadPublicKey()` **on every single HTTP request** — reading the `.pem` file from disk each time:
```java
private WebFilter jwtAuthenticationFilter() {
    return (ServerWebExchange exchange, WebFilterChain chain) -> {
        // ...
        if (token != null) {
            try {
                RSAPublicKey rsaPublicKey = loadPublicKey(); // ← File I/O on EVERY request!
```
Under load (even 50 req/s) this creates constant disk I/O and rebuilds the JWK source + key selector from scratch each time.

**Fix:**
```java
// Load key once at startup using @PostConstruct or inject it as a @Bean
@Bean
public RSAPublicKey rsaPublicKey() throws Exception {
    return loadPublicKey(); // called once at app startup
}
// Then inject it into the filter constructor
```

---

### [BUG-04] `getArchiveStatus` Circuit Breaker is Module-Level (Shared State Bug)
**Severity:** 🔴 Critical (UX — breaks archive feature for all users)
**File:** [`archiveApi.ts`](trendzy-front/src/lib/archiveApi.ts#L36-L57)

**Problem:**
```ts
let statusCircuitBreaker = false; // ← module-level singleton

export const getArchiveStatus = async (trendId: string) => {
  if (statusCircuitBreaker) return false; // ← If tripped, EVERY status call returns false forever
  // ...
  } catch (err) {
    statusCircuitBreaker = true; // ← A network blip or CORS error trips this permanently
    return false;
  }
};
```
The circuit breaker is a **module-level boolean** that is **never reset**. If the API is temporarily unavailable when the page loads, or there is a CORS preflight failure, `statusCircuitBreaker` becomes `true` for the **entire session**. After that, **no trend can show its archived status** and the bookmark icon is always unfilled — even if the user is logged in and the API recovers.

**Fix:**
Use a proper resetting circuit breaker or simply `queryClient.fetchQuery` with React Query's built-in retry logic. Remove the module-level singleton.

---

### [BUG-05] `ddl-auto: update` in Production JPA Config
**Severity:** 🔴 Critical (Data Integrity Risk)
**File:** [`application.yml` (trendzy-business)](trendzy-business/src/main/resources/application.yml#L13-L15)

**Problem:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update   # ← DANGEROUS in production
```
`ddl-auto: update` in production means Hibernate automatically modifies the database schema on startup. This can:
- Silently add columns without migration history
- **Never drop columns** even when you remove a field (leading to schema drift)
- Cause irreversible data corruption on certain schema changes across DB versions

**Fix:**
```yaml
# production
ddl-auto: validate   # Fails fast if schema doesn't match — forces explicit migrations
# Use Flyway or Liquibase for schema management
```

---

## 🟠 HIGH — Fix Before Growth

### [BUG-06] Contact Endpoint Has No Rate Limiting or Input Validation
**Severity:** 🟠 High (Abuse / Cost)
**File:** [`ContactController.java`](trendzy-business/src/main/java/com/trendzy/business/contact/ContactController.java)

**Problem:**
```java
@PostMapping
public ResponseEntity<?> sendContactEmail(@RequestBody Map<String, String> payload) {
    String userEmail = payload.get("email");
    String message = payload.get("message");
    // Only check: message not empty
    mailSender.send(mailMessage); // sends email on every valid call
```
- No rate limiting (anyone can POST thousands of times to spam your inbox)
- No email format validation (any string accepted as `userEmail`)
- `e.printStackTrace()` leaks stack traces to logs (use `log.error()`)
- The `@Autowired` annotation is field injection — should use constructor injection

**Fix:**
- Add `@RateLimiter` (Resilience4j) or an IP-based Bucket4j limiter
- Validate `userEmail` with `jakarta.validation.constraints.Email` + `@Valid`
- Switch to `log.error("Failed to send email", e)` 
- Use `@RequiredArgsConstructor` + final field for `JavaMailSender`

---

### [BUG-07] `getTrends()` in `api.ts` Does Not Send Auth Cookie
**Severity:** 🟠 High (Feature Break)
**File:** [`api.ts`](trendzy-front/src/lib/api.ts#L109-L124)

**Problem:**
```ts
export async function getTrends(category: string, size = 100): Promise<Trend[]> {
  const response = await fetch(apiUrl(`/api/v2/trends?${params.toString()}`), {
    cache: "no-store",
    // ← NO credentials: "include" here!
  });
```
Every other API helper (`apiFetch`, `businessApiFetch`) correctly passes `credentials: "include"`. But `getTrends` uses a **raw `fetch()`** without credentials. This means:
- Admin features (delete, archive by admin) that depend on identity checking in `trendzy-api` will fail silently for cross-origin prod setups
- Bookmark/archive status tied to the current user will not work correctly since the session cookie is never sent

**Fix:**
```ts
const response = await fetch(apiUrl(`/api/v2/trends?${params.toString()}`), {
  cache: "no-store",
  credentials: "include",  // ← add this
});
```

---

### [BUG-08] `updateTrendPrice` Only Updates Underdog — Leaves `estimatedPrice` Inconsistent with DB
**Severity:** 🟠 High (Data Integrity)
**File:** [`TrendController.java`](trendzy-api/src/main/java/com/trendzy/api/controller/TrendController.java#L56-L68)

**Problem:**
```java
@PatchMapping("/{id}/price")
public Mono<Trend> updateTrendPrice(@PathVariable String id, @RequestBody Map<String, Double> body) {
    return trendRepository.findById(id)
            .flatMap(trend -> {
                Double newPrice = body.get("price");
                if (newPrice != null && trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                    trend.getSignalProducts().getUnderdog().setPrice(newPrice);
                    trend.setEstimatedPrice(newPrice);
                }
                return trendRepository.save(trend);  // saves even if newPrice was null!
            });
}
```
Issues:
1. If `newPrice` is `null` (missing key in JSON body), the endpoint **still calls `save()`** — a wasteful no-op write to MongoDB
2. If `signalProducts` or `underdog` is `null`, `estimatedPrice` is updated in the DB but `underdog.price` is NOT — creating a data mismatch between what the API returns and what the UI shows after a reload
3. No validation that `newPrice > 0`

**Fix:**
```java
if (newPrice == null || newPrice <= 0) {
    return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid price required"));
}
// Always update estimatedPrice, conditionally update underdog price
trend.setEstimatedPrice(newPrice);
if (trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
    trend.getSignalProducts().getUnderdog().setPrice(newPrice);
}
return trendRepository.save(trend);
```

---

### [BUG-09] `TrendController.deleteTrendById` Returns 200 on Deletion (Should be 204)
**Severity:** 🟠 High (API Contract)
**File:** [`TrendController.java`](trendzy-api/src/main/java/com/trendzy/api/controller/TrendController.java#L50-L56)

**Problem:**
```java
@DeleteMapping("/{id}")
public Mono<Map<String, Object>> deleteTrendById(@PathVariable String id) {
    return trendRepository.deleteById(id)
            .then(Mono.just(Map.of("deletedId", id, "message", "...")));
    // Returns HTTP 200 with body
```
- `DELETE` with a response body returning `200` is non-standard REST — `204 No Content` is correct
- `deleteById` in reactive MongoDB does **not throw** if the document doesn't exist — so deleting a non-existent ID returns `200 OK` with "Successfully deleted", which is misleading

**Fix:**
```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public Mono<Void> deleteTrendById(@PathVariable String id) {
    return trendRepository.findById(id)
        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Trend not found")))
        .flatMap(t -> trendRepository.deleteById(t.getId()));
}
```

---

### [BUG-10] `AuthModal.tsx` Has Dead Code for Email/Password Login
**Severity:** 🟠 High (UX Confusion / Dead Code)
**File:** [`AuthModal.tsx`](trendzy-front/src/components/AuthModal.tsx)

**Problem:**
The component has full state management and form submission logic for email/password login (`handleSubmit`, `isLogin` toggle, `password`, `name` states, `error` state) — but **none of this UI is actually rendered**. The modal only renders the Google OAuth button. The dead code:
- Creates confusion for any developer reading this file
- Increases bundle size unnecessarily
- May inadvertently be "enabled" in the future without the backend being ready

**Fix:**
Either:
1. Remove all dead email/password state and the `handleSubmit` function, or
2. Render the email/password form and ensure the backend `/api/auth/login` and `/api/auth/signup` endpoints are production-ready (they currently accept `BadCredentialsException` which returns `500` without a proper `@ExceptionHandler`)

---

### [BUG-11] `BadCredentialsException` in `AuthService.login` Returns HTTP 500
**Severity:** 🟠 High (Security + UX)
**File:** [`AuthService.java`](trendzy-business/src/main/java/com/trendzy/business/auth/AuthService.java#L30-L34), [`AuthController.java`](trendzy-business/src/main/java/com/trendzy/business/auth/AuthController.java)

**Problem:**
```java
// AuthService.java
throw new BadCredentialsException("Invalid credentials");
```
There is no `@ExceptionHandler` or `@ControllerAdvice` in `trendzy-business`. When `BadCredentialsException` is thrown, Spring's default behavior returns `HTTP 500 Internal Server Error`, which:
- Leaks that an exception occurred internally
- Makes it impossible for the frontend to distinguish "wrong password" from "server crashed"
- Similarly `signup` throws `RuntimeException("Email already in use")` → also `500`

**Fix:**
Add a `@RestControllerAdvice`:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> handleBadCredentials(BadCredentialsException ex) {
        return Map.of("error", "Invalid credentials");
    }
    
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleConflict(RuntimeException ex) {
        return Map.of("error", ex.getMessage());
    }
}
```

---

## 🟡 MEDIUM — Fix Before Scale

### [BUG-12] `aesthetic.$id.tsx` — Category Mismatch Between Frontend Aesthetic ID and Backend Query
**Severity:** 🟡 Medium (Feature Break for "upper/tees")
**File:** [`aesthetic.$id.tsx`](trendzy-front/src/routes/aesthetic.$id.tsx#L14-L20)

**Problem:**
```ts
let queryCategory = params.id;
if (params.id === "upper") queryCategory = "tees";
// ...
const trends = allTrends.filter(t => t.aestheticId === queryCategory); // filters by "tees"
```
The aesthetic ID in the URL is `upper`, the backend query uses `tees`, and `normalizeTrend()` in `api.ts` sets:
```ts
aestheticId: String(raw?.aestheticId ?? raw?.category ?? raw?.subcategory ?? "").toLowerCase()
```
If the MongoDB document has `category: "tees"`, `aestheticId` is `"tees"`. So the filter `t.aestheticId === "tees"` works. But if the doc has `category: "upper"`, all trends for the TEES lane are **silently filtered out** — showing users an empty state. This is brittle.

**Fix:**
Define a canonical category map in a shared constant and use it consistently:
```ts
const CATEGORY_MAP: Record<string, string[]> = {
  upper: ["tees", "upper"],
  caps: ["caps", "accessories"],
};
```

---

### [BUG-13] `signalProducts` Type Mismatch Between Backend and Frontend
**Severity:** 🟡 Medium (Runtime Bug)
**Files:** [`Trend.java`](trendzy-api/src/main/java/com/trendzy/api/model/Trend.java#L44-L55), [`mock-data.ts`](trendzy-front/src/lib/mock-data.ts#L28-L51), [`api.ts`](trendzy-front/src/lib/api.ts#L103-L107)

**Problem:**
- Java backend: `signalProducts` is of type `SignalProducts` (a single nested object with `underdog`, `amazon`, `flipkart`, `signalId`, `authorUsername`, `queryUsed`)
- TypeScript frontend: `signalProducts: SignalProduct[]` — expects an **array** of product triads
- `normalizeTrend()` tries to reconcile this with:
  ```ts
  function normalizeSignalProducts(raw: any): SignalProduct[] {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== "object") return [];
    return [raw as SignalProduct]; // Wraps single object as array
  }
  ```
- Then in `TrendCard.tsx` line 264: `trend.signalProducts.length > 0 && `${trend.signalProducts.length} shoppable`` — this will show "1 shoppable" even when there are no shoppable products, because it always wraps into an array of 1

**Fix:**
Align types. The Java `SignalProducts` object should either be renamed/restructured to match the frontend expectation, or the frontend type should match the actual single-object backend response and be called `signalProduct` (singular).

---

### [BUG-14] Nginx Config Missing HTTPS Redirect and Security Headers
**Severity:** 🟡 Medium (Security + SEO)
**File:** [`nginx-trendxee.conf`](nginx-trendxee.conf)

**Problem:**
The nginx config only serves HTTP on port 80. While it mentions `certbot` in comments, the actual config has no:
- HTTPS redirect (`return 301 https://...`)
- `Strict-Transport-Security` header
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` security headers
- `proxy_buffer_size` / `proxy_busy_buffers_size` tuning for the business API (which serves session cookies)

**Fix:**
```nginx
# After certbot, add to HTTPS block:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

### [BUG-15] Home Page `rotationMap` Loader — Silent Total Failure Masking API Issues
**Severity:** 🟡 Medium (UX / Debugging)
**File:** [`index.tsx`](trendzy-front/src/routes/index.tsx#L9-L33)

**Problem:**
```ts
loader: async () => {
  try {
    await Promise.all(
      aesthetics.map(async (a) => {
        // ...
      }),
    );
  } catch (e) {
    console.error("Failed to fetch rotations", e); // Swallowed!
  }
  return { rotationMap }; // Always returns, even if fully empty
}
```
- If any single aesthetic fails to load, `Promise.all` rejects and the **entire** loader catch block fires — leaving `rotationMap` as an empty object `{}`
- All 7 lane posters and the hero carousel go empty with **no user-visible feedback**
- There is no retry mechanism or skeleton state beyond the loader

**Fix:**
Use `Promise.allSettled()` so individual failures don't cascade:
```ts
await Promise.allSettled(
  aesthetics.map(async (a) => { /* ... */ })
);
// Each rejection is isolated — other lanes still load
```

---

### [BUG-16] `JwtCookieAuthFilter` Does Not Clear SecurityContext on Invalid Token
**Severity:** 🟡 Medium (Security)
**File:** [`JwtCookieAuthFilter.java`](trendzy-business/src/main/java/com/trendzy/business/auth/JwtCookieAuthFilter.java)

**Problem:**
```java
if (jwt != null && tokenProvider.validateToken(jwt)) {
    // ... set authentication
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
filterChain.doFilter(request, response);
```
If the token exists but is **invalid** (expired, tampered), the filter silently continues without clearing the `SecurityContextHolder`. If a previous filter (e.g. OAuth2 session) had set authentication, the user could remain authenticated with stale credentials.

**Fix:**
```java
if (jwt != null) {
    if (tokenProvider.validateToken(jwt)) {
        // set auth
    } else {
        SecurityContextHolder.clearContext(); // ← Explicitly clear on bad token
    }
}
```

---

## 🔵 PRACTICAL LAUNCH CONCERNS

### [BUG-17] No `@Validated` / Input Validation on `SignupRequest`
**Severity:** 🔵 Medium-Low
**Files:** [`SignupRequest.java`](trendzy-business/src/main/java/com/trendzy/business/auth/dto/SignupRequest.java), [`AuthController.java`](trendzy-business/src/main/java/com/trendzy/business/auth/AuthController.java)

Users can sign up with `""` as email/password/name. No `@NotBlank`, `@Email`, `@Size` constraints exist. Add Bean Validation constraints and `@Valid` on the controller parameter.

---

### [BUG-18] `GenerateKeys.java` Lives in Root — Accidental Commit Risk
**Severity:** 🔵 Low-Medium
**File:** [`GenerateKeys.java`](GenerateKeys.java)

This utility lives in the **repository root**, not in a `tools/` or `scripts/` directory. The `.gitignore` doesn't mention `private.pem` or `public.pem`. If a developer runs this from the project root, the generated PEM files could be **accidentally committed** and expose private keys.

**Fix:**
- Move to `scripts/GenerateKeys.java`
- Add `*.pem` and `private.pem` to `.gitignore`
- Document the one-time key generation in `README`

---

### [BUG-19] `jjwt` Version 0.11.5 Uses Deprecated `SignatureAlgorithm` API
**Severity:** 🔵 Low (Technical Debt)
**File:** [`pom.xml` (trendzy-business)](trendzy-business/pom.xml#L59-L75), [`JwtTokenProvider.java`](trendzy-business/src/main/java/com/trendzy/business/auth/JwtTokenProvider.java#L71)

```java
.signWith(privateKey, SignatureAlgorithm.RS256) // Deprecated in jjwt 0.11+
```
`jjwt` 0.11.5 is the last stable release before the library was rewritten. The `SignatureAlgorithm` enum-based API is fully deprecated — future upgrades will require a rewrite. Also there is a **library mismatch**: `trendzy-api` uses `nimbus-jose-jwt` for verification while `trendzy-business` uses `jjwt` for signing. Two JWT libraries for one token lifecycle is unnecessary complexity.

**Recommendation:** Standardize on one library. `nimbus-jose-jwt` is already in `trendzy-api` and is the Spring Security standard.

---

### [BUG-20] `docker-compose.prod.yml` Exposes Backend Ports Directly (No Internal Network)
**Severity:** 🔵 Medium (Infrastructure)
**File:** [`docker-compose.prod.yml`](docker-compose.prod.yml)

```yaml
ports:
  - "8080:8080"  # Exposed to host
  - "8081:8081"  # Exposed to host
```
Both services expose ports to the host. Since nginx proxies them, the backends should be on an **internal Docker network** only:
```yaml
services:
  api:
    expose:
      - "8080"  # Only accessible to other containers
  nginx:
    ports:
      - "80:80"
      - "443:443"
```

---

## Summary Table

| # | Severity | Category | File | PR Title Suggestion |
|---|----------|----------|------|---------------------|
| 01 | 🔴 Critical | Security | `OAuth2LoginSuccessHandler.java`, `TrendCard.tsx` | `security: Remove hardcoded admin email, enforce role-based admin check` |
| 02 | 🔴 Critical | Bug | `CorsConfig.java` | `fix: Remove duplicate dead CORS config in trendzy-api` |
| 03 | 🔴 Critical | Performance | `SecurityConfig.java` (api) | `perf: Cache RSA public key at startup, not per-request` |
| 04 | 🔴 Critical | UX Bug | `archiveApi.ts` | `fix: Replace module-level circuit breaker with proper retry logic` |
| 05 | 🔴 Critical | Data Safety | `application.yml` | `config: Change ddl-auto from update to validate in production` |
| 06 | 🟠 High | Security | `ContactController.java` | `security: Add rate limiting and input validation to contact endpoint` |
| 07 | 🟠 High | Bug | `api.ts` | `fix: Add credentials:include to getTrends() fetch` |
| 08 | 🟠 High | Data | `TrendController.java` | `fix: Validate price update body and handle null signalProducts` |
| 09 | 🟠 High | API Contract | `TrendController.java` | `fix: Return 204 No Content for DELETE, 404 for missing trend` |
| 10 | 🟠 High | Dead Code | `AuthModal.tsx` | `refactor: Remove dead email/password auth code from AuthModal` |
| 11 | 🟠 High | Error Handling | `AuthService.java` | `fix: Add GlobalExceptionHandler for auth errors (401/409 vs 500)` |
| 12 | 🟡 Medium | Bug | `aesthetic.$id.tsx` | `fix: Normalize category mapping for upper/tees aesthetic` |
| 13 | 🟡 Medium | Type Mismatch | `api.ts`, `Trend.java` | `fix: Align signalProducts type between backend and frontend` |
| 14 | 🟡 Medium | Security | `nginx-trendxee.conf` | `infra: Add HTTPS security headers to nginx config` |
| 15 | 🟡 Medium | UX | `index.tsx` | `fix: Use Promise.allSettled in home loader to isolate lane failures` |
| 16 | 🟡 Medium | Security | `JwtCookieAuthFilter.java` | `security: Clear SecurityContext on invalid JWT token` |
| 17 | 🔵 Low | Validation | `SignupRequest.java` | `feat: Add Bean Validation constraints to signup/login DTOs` |
| 18 | 🔵 Low | DevOps | `GenerateKeys.java` | `devops: Move GenerateKeys to scripts/, add *.pem to .gitignore` |
| 19 | 🔵 Low | Tech Debt | `pom.xml`, `JwtTokenProvider.java` | `refactor: Consolidate JWT library to nimbus-jose-jwt` |
| 20 | 🔵 Low | Infrastructure | `docker-compose.prod.yml` | `infra: Isolate backend services to internal Docker network` |
