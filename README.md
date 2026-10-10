# ⚡ TrendXee (TrendZY) — Trust & Discovery Aggregator for Indie Fashion

[![React 19](https://img.shields.io/badge/Frontend-React_19_+_TanStack_Start-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Spring Boot 3](https://img.shields.io/badge/Backend-Spring_Boot_3_(WebFlux_+_JPA)-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_(Reactive)-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Scraper-Playwright_Chromium-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styles-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

> **TrendXee** is a fashion discovery aggregator and **"prop-firm proving ground"** for upcoming Indian indie streetwear labels ("underdogs"). It ingests live social chatter, autonomously scrapes homegrown D2C storefronts, audits brand legitimacy and Instagram hype metrics, and pairs each indie piece alongside mainstream mass-market alternatives in an editorial aesthetic scrapbook.

---

## 🧭 System Ecosystem Overview

```
                                  [ Social Signals ]
                             (Instagram Public Profiles)
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │   TrendZY Autonomous Scraper Engine │
                       │    (Social Hype + Dual-Tier Store)  │
                       └──────────────────┬──────────────────┘
                                          │ Ingests & Audits
                                          ▼
      ┌────────────────────────────────────────────────────────────────────────┐
      │                                MongoDB                                 │
      │   Collections: trends · brand_stats · brand_reviews · v2_signals       │
      └──────────────────┬─────────────────────────────────┬───────────────────┘
                         │ Reads / Updates                 │ Reads / Syncs
                         ▼                                 │
         ┌──────────────────────────────┐                  │
         │         trendzy-api          │                  │
         │  Reactive Spring WebFlux     │                  │
         │  Port: 8080                  │                  │
         │  - Trend Feeds & Search      │                  │
         │  - 5-Star Underdog Ratings   │                  │
         │  - Brand Prop-Firm Reviews   │                  │
         │  - Personal Archive Vault    │                  │
         └───────────────┬──────────────┘                  │
                         │                                 │
                         │ REST / JSON                     │
                         ▼                                 ▼
         ┌──────────────────────────────┐  JWT Auth / API  ┌──────────────────────────────┐
         │        trendzy-front         │ ◄──────────────► │       trendzy-business       │
         │   TanStack Start + Vite SSR  │                  │    Spring Boot 3 + JPA / PG  │
         │   Port: 3000                 │                  │    Port: 8081                │
         │   - Pinned Story Scene       │                  │    - Google OAuth2 & JWT     │
         │   - Daily Five Magazine      │                  │    - User Profiles & Roles   │
         │   - 8 Aesthetic Lanes        │                  │    - Click Analytics Tracking│
         │   - Trust Badges & Hype UI   │                  │    - Contact Form & Support  │
         └──────────────────────────────┘                  └──────────────────────────────┘
```

---

## 📡 1. TrendZY Data Ingestion & Autonomous Scraping Engine

The **TrendZY Ingestion Engine** is a high-performance, multi-tiered data acquisition system designed to track emerging fashion trends, discover homegrown D2C brands, and normalize cross-platform pricing and marketplace alternatives in real time.

```
                [ Social Media Signals ]
                 (Instagram Public Profiles)
                             │
                             ▼
                 ┌───────────────────────┐
                 │  Phase 1: Brand Hype  │
                 │  & Social Extraction  │
                 │  (Velocity, ER, Reach)│
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Phase 2: D2C Storefront│
                 │   Autonomous Scraper  │
                 └───────────┬───────────┘
                             │
   ┌─────────────────────────┴─────────────────────────┐
   ▼                                                   ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│  Tier 1: High-Speed HTTP    │             │  Tier 2: Headless Browser   │
│  Predictive / Catalog APIs  │             │  DOM Card & Anchor Parser   │
│  (Shopify JSON Endpoints)   │             │  (Next.js / SPAs / Woo/Wix) │
└──────────────┬──────────────┘             └──────────────┬──────────────┘
               └─────────────────────────┬─────────────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ Phase 3: Intelligence │
                             │   & Quality Filters   │
                             │ (Dedupe, Price Bounds)│
                             └───────────┬───────────┘
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │ Phase 4: Marketplace  │
                             │ Cross-Matching Engine │
                             │   (Amazon / Flipkart) │
                             └───────────┬───────────┘
                                         │
                                         ▼
                             [ MongoDB Production DB ]
                            (Trends & Underdog Products)
```

### Core Capabilities
* **Dual-Tier Storefront Scraping**:
  * **Tier 1 (Fast-Path HTTP Engine)**: Bypasses browser overhead for Shopify storefronts via predictive search (`/search/suggest.json`) and collection endpoints, parsing variant details in under 200ms.
  * **Tier 2 (Headless Browser Fallback)**: Uses Chromium via Playwright to dynamically hydrate client-rendered SPAs (Next.js, React, Vue), WooCommerce, and Wix stores.
  * **Resource Optimization**: Automatically aborts images, fonts, stylesheets, and tracking pixels during headless runs for up to 5x faster loads.
* **Intelligent Product & Price Normalization**:
  * **Indian D2C Currency Parsing**: Detects and normalizes `₹`, `Rs.`, and `INR` notations, isolating selling prices from strike-through MRP figures.
  * **Noise Filtering**: Cleans out promotional banners, EMI rates, minimum order free-shipping triggers, and subscription discounts.
  * **Budget Capping**: Enforces streetwear affordability limits (`<= ₹5,000`) to filter out high-luxury outliers.
  * **Strict Deduplication**: Guarantees zero duplicate URLs or repetitive style variants per brand.
* **Social Footprint & "Brand Hype" Scoring**:
  * Weighted momentum score (0–100) computed from:
    * **Reach (40%)**: Follower base magnitude.
    * **Engagement (30%)**: True engagement rate across active non-pinned media.
    * **Activity (30%)**: Posting frequency and cadence (posts per week).
    * **Recency Decay**: Dynamically discounts inactive accounts.
* **Marketplace Alternative Cross-Referencing**:
  * Scrapes Amazon India and Flipkart to discover mass-market lookalikes.
  * Leverages SSR state parsing (`__INITIAL_STATE__`) and token-based relevance algorithms to pair the indie original with budget alternatives.

---

## 🚀 2. `trendzy-api` — Core Reactive Discovery API Service

Built with **Spring Boot 3 WebFlux** and **Reactive MongoDB**, `trendzy-api` serves the public feed, manages trend archiving, and orchestrates the **Prop-Firm Rating & Brand Review Engine**.

### Architecture & Key Modules
* **Reactive Non-Blocking I/O**: Fully asynchronous pipeline using Project Reactor (`Mono` / `Flux`).
* **MongoDB Data Store**: Connects to the primary `trends`, `brand_stats`, `brand_reviews`, and `archived_trends` collections.
* **Global Brand Stats Synchronization**: Ratings submitted for any single product automatically recalculate and upsert the brand's global average score in `BrandStats`, propagating the new score to all associated trend drops sharing that brand name.
* **Asymmetric Token Verification**: Verifies RS256 JWT tokens issued by `trendzy-business` via public key (`public.pem`).

### Primary API Endpoints

| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| `GET` | `/api/v2/trends` | Paginated trend feed with category filtering (`streetwear`, `bottoms`, `caps`, etc.) | Public |
| `POST` | `/api/products/{trendId}/rate` | Rates an underdog brand (1–5 stars) & blends it with scraper baseline | Yes (Cookie JWT) |
| `GET` | `/api/brands/{brandName}/comments` | Retrieves community reviews/experiences for a specific brand | Public |
| `POST` | `/api/brands/{brandName}/comments` | Submits a written prop-firm experience for a brand | Yes (Cookie JWT) |
| `POST` | `/api/v2/archive/trends/{id}` | Pins a drop to the user's private archive | Yes (Cookie JWT) |
| `DELETE` | `/api/v2/archive/trends/{id}` | Unpins a drop from the user's private archive | Yes (Cookie JWT) |
| `GET` | `/api/v2/archive/trends` | Lists all pinned trends saved by the authenticated user | Yes (Cookie JWT) |
| `GET` | `/api/v2/archive/trends/{id}/status` | Checks if a specific trend is currently pinned | Yes (Cookie JWT) |
| `PATCH` | `/api/v2/trends/{id}/price` | Admin price override for a trend | Admin |
| `PATCH` | `/api/v2/trends/{id}/score` | Admin score override for a trend | Admin |
| `DELETE` | `/api/v2/trends/{id}` | Permanently deletes a trend record | Admin |

### Data Models
* **`Trend`**: Core document containing title, category, subcategory, `underdogRating`, `ratingSignals` (COD, IG followers, reviews), `brandInstagramHandle`, `brandHypeSignals` (`followers`, `engagementRate`, `postsPerWeek`), `trendScore`, `aiSummary`, and `products` triad (`underdog`, `amazon`, `flipkart`).
* **`BrandStats`**: Brand-level source of truth containing `brandName`, `averageRating`, `totalRatings`, and `lastUpdated`.
* **`BrandReview`**: Community review containing `brandName`, `userId`, `comment`, and `createdAt`.
* **`ArchivedTrend`**: User bookmark pairing `userId` with a snapshot of the saved `Trend`.

---

## 💼 3. `trendzy-business` — Identity, Operations & Analytics Service

Built with **Spring Boot 3 MVC**, **Spring Security**, and **PostgreSQL**, `trendzy-business` handles user authentication, session cookies, affiliate click tracking, and inquiries.

### Architecture & Key Modules
* **PostgreSQL Persistence**: Stores user credentials, OAuth profiles, roles (`ROLE_USER`, `ROLE_ADMIN`), and affiliate link click logs.
* **OAuth2 Google Authentication**: Seamless social sign-in via Google OAuth2 with secure HTTP-only cookie dispatch.
* **Asymmetric RS256 JWT Generation**: Signs user tokens using a private RSA key (`private.pem`).
* **Affiliate Analytics Pipeline**: Captures outgoing product click events with beacon / keepalive support.

### Primary API Endpoints

| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| `GET` | `/oauth2/authorization/google` | Initiates Google OAuth2 login flow | Public |
| `POST` | `/api/auth/signup` | Registers a new user account with email/password | Public |
| `POST` | `/api/auth/login` | Authenticates user and issues HTTP-only JWT cookie | Public |
| `POST` | `/api/auth/logout` | Clears authentication cookies | Public |
| `GET` | `/api/users/me` | Fetches currently signed-in user profile, email & roles | Yes (Cookie JWT) |
| `POST` | `/api/analytics/click` | Records outbound product/store click for affiliate tracking | Public / Keepalive |
| `POST` | `/api/contact` | Submits user questions or partnership requests | Public |

---

## 🎨 4. `trendzy-front` — Full-Stack SSR Discovery Web Application

A modern, high-performance web application built with **React 19**, **TanStack Start**, **TanStack Router**, **TanStack Query**, and **Tailwind CSS v4**.

### Visual & Design System
* **"Desert Clay" & "Night Lamplit" Themes**: Warm paper, clay terracotta, espresso ink, and soft sand surfaces. Automatic system preference detection and flash-free `localStorage` theme bootstrap.
* **Custom Tactile Cursor**: Fine-pointer ink dot, stretching clay aura, and magnetic snapping over interactive buttons and links.
* **Editorial Typography**: Styled with `Lora` serif headings and `Nunito Sans` geometric body text.

### Core Experience Sections
1. **Hero Entry**: Large typographical statement, live trend counter, and featured lead drop with parallax depth.
2. **Pinned Story Scene (`StoryScene`)**: Scroll-driven 3-act film that holds the stage while products drift across different planes:
   * *Act I*: `"The internet moves fast. Trends move faster."`
   * *Act II*: `"So we put indie labels to the test. We audit the hype to verify who's legit."`
   * *Act III*: `"And we back the true underdogs."`
3. **The Daily Five (`DailyFive`)**: Flippable digital magazine featuring five daily indie drops with auto-advance countdown timer, touch-swiping, and keyboard arrow controls.
4. **Lane Universe (`LaneUniverse`)**: Categorical corridor spanning eight curated aesthetics (*Bottoms, Tees, Outerwear, Sneakers, Sportswear, Anime, Polos, Caps*).
5. **Underdog Story (`UnderdogStory`)**: Side-by-side contrast of the original indie garment against the mass-market marketplace clone.
6. **Engine Explainer (`EngineSection`)**: 4-step interactive breakdown (*Listen → Cluster → Score → Source*).
7. **Drop Story Modal (`TrendDetail`)**: Shared layout morphing expanding card media, photo zoom, price breakdown, and direct shop links.

### Prop-Firm & Trust Badges UI
* **5-Star Underdog Trust Badge (`TrustBadge`)**: Interactive tooltip badge showing the brand's calculated star rating alongside audit signals (Cash on Delivery availability, verified reviews, Instagram follower counts).
* **Brand Hype Section (`BrandHypeSection`)**: Displays Instagram momentum metrics (`@handle`, Followers count, Engagement rate, Posts/week).
* **Brand Reviews Drawer (`BrandReviewsSection`)**: Authenticated community forum allowing users to review shipping speed, fabric quality, and customer service for the label.
* **Rate this Brand (`ProductRating`)**: Interactive 5-star rating widget that updates the brand's aggregated score in real time.

### Performance & Smooth-Scroll Architecture
* **100% GPU Composited Animations**: Uses `transform` (scale, translate) and `opacity` properties to prevent main-thread layout thrashing.
* **Zero CPU-Bound Filter Latency**: Clean CSS gradients without expensive `<feTurbulence>` SVG rasterization loops.
* **Scoped Shared Layouts**: Only the active opening/closing card subscribes to Framer Motion `layoutId` projection, keeping large grid scrolling at 60/120fps.
* **Intersection Observer**: Chapter detection and viewport reveals driven by native browser observers rather than scroll-event calculations.

---

## 🛠 Tech Stack Matrix

| Domain | Technologies |
|:-------|:-------------|
| **Frontend Framework** | React 19, TypeScript, TanStack Start, Nitro Server |
| **Routing & State** | TanStack Router (File-based), TanStack Query v5 |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion 12, Radix UI Primitives, Lucide Icons |
| **Core API** | Java 17/21, Spring Boot 3, Spring WebFlux, Project Reactor |
| **Business API** | Java 17/21, Spring Boot 3, Spring Security, Spring Data JPA |
| **Data Persistence** | MongoDB (Reactive Driver), PostgreSQL 15 |
| **Security & Auth** | OAuth2 (Google), Asymmetric RS256 JWT (`nimbus-jose-jwt` / `jjwt`) |
| **Scraper & Ingestion**| Playwright for Java, Chromium, Python 3.12, BeautifulSoup4, Groq API |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, Let's Encrypt SSL, AWS EC2 |

---

## ⚙️ Local Development Quickstart

### Prerequisites
* **Java**: OpenJDK 17 or 21
* **Node.js**: v20+ with npm
* **Databases**: MongoDB (running on `localhost:27017`), PostgreSQL (running on `localhost:5432`)
* **Maven**: 3.9+

### 1. Environment Configuration
Create a `.env` file in the project root:
```env
# MongoDB & Postgres
MONGODB_URI=mongodb://localhost:27017/trendxee
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/trendxee_business
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# OAuth2 Google (for trendzy-business)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Asymmetric Key Paths
JWT_PRIVATE_KEY_PATH=file:./private.pem
JWT_PUBLIC_KEY_PATH=file:./public.pem

# Admin & CORS
APP_ADMIN_EMAILS=admin@trendxee.com
APP_FRONTEND_URL=http://localhost:3000
```

### 2. Generate RSA Keypair
If `private.pem` and `public.pem` do not exist, generate them:
```bash
java GenerateKeys.java
```

### 3. Run the Services

#### A. Core API (`trendzy-api`)
```bash
cd trendzy-api
mvn spring-boot:run
# Running on http://localhost:8080
```

#### B. Business API (`trendzy-business`)
```bash
cd trendzy-business
mvn spring-boot:run
# Running on http://localhost:8081
```

#### C. Frontend (`trendzy-front`)
```bash
cd trendzy-front
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 📦 Repository Structure

```
trendxee/
├── trendzy-api/                 # Reactive Core API (Spring WebFlux + MongoDB)
│   ├── src/main/java/com/trendzy/api/
│   │   ├── config/              # Security, CORS, MongoDB & OpenAPI setup
│   │   ├── controller/          # Trends, Archive, Products & Brand Reviews
│   │   ├── model/               # Trend, BrandReview, BrandStats, ArchivedTrend
│   │   └── repository/          # Reactive Mongo repositories
│   └── pom.xml
├── trendzy-business/            # Business & Auth API (Spring MVC + JPA + PostgreSQL)
│   ├── src/main/java/com/trendzy/business/
│   │   ├── analytics/           # Outbound product click tracking
│   │   ├── auth/                # JWT cookie filters, OAuth2 Google login
│   │   ├── config/              # Security & OpenAPI configuration
│   │   ├── contact/             # Support & contact ingestion
│   │   └── user/                # User entity, profile endpoints & repository
│   └── pom.xml
├── trendzy-front/               # Full-Stack Web Application (React 19 + TanStack Start)
│   ├── src/
│   │   ├── components/          # Cards, Modals, TrustBadges, DailyFive, Story
│   │   ├── lib/                 # API client, normalizers, user & lane utilities
│   │   ├── motion/              # Pointer tracking, Parallax, ScrollScene, tokens
│   │   ├── routes/              # TanStack file-based routing (__root, index, lanes, aesthetic)
│   │   └── styles.css           # Tailwind CSS v4 & theme definitions
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.prod.yml      # Production container orchestration
├── docker-compose.ec2.yml       # EC2 deployment profile
├── nginx-trendxee.conf          # Nginx reverse proxy configuration
├── GenerateKeys.java            # RSA keypair generation utility
└── README.md                    # Project documentation
```

---

## 🔒 Security & Data Hygiene
* **Asymmetric RS256 Tokens**: `trendzy-business` exclusively holds the private key for signing, while `trendzy-api` only requires the public key for verification.
* **HTTP-Only Cookies**: Authentication tokens are strictly transmitted in `HttpOnly`, `SameSite=Lax` cookies to prevent XSS exfiltration.
* **Input Rate-Limiting**: Protection across contact and review submission endpoints against spam and automated bots.
* **CORS Whitelisting**: Strict origin validation restricting resource access to authorized frontend domains.

---

## 📄 License
This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
