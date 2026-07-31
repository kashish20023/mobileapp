# MobileApp Architecture, Features & Database Integration (brain.md)

This document provides a comprehensive overview of the **Hobnob Mobile App Simulator**, its user navigation flow, UI components, state management, and real database property integrations.

---

## 📱 User Navigation Flow

```
[1. Sign In / Login Screen]
          │
          ▼ (Authenticate / Quick Access)
[2. Buyer Dashboard] ─── (Click "Chat with AI") ───► [3. AI Chat Screen]
          │                                                   │
          ├───────────────────────────────────────────────────┤ (Submit Natural Language Query)
          ▼                                                   ▼
[6. Wishlist Screen] ◄─── (Toggle Heart) ──── [4. AI Search Results Page]
          │                                                   │
          ▼                                                   ▼ (Click Property Card)
[7. Scheduled Tours / Meetings] ◄── (Book Visit) ── [5. Property Details Page]
```

---

## 🏬 Database Property Integration

All property feeds across the Mobile App (Buyer Dashboard, AI Search Results, Details, Wishlist) directly query and render real published properties from the NestJS PostgreSQL Database:

- **Dashboard Feed**: Queries `GET /properties` & `GET /properties/buyer/matches` directly from backend database.
- **AI Search Results**: Queries `GET /properties/buyer/matches` & `GET /properties` filtered by extracted search criteria.
- **Wishlist & Details**: Queries real property records with complete specifications (Price, BHK, Bathrooms, Area sq ft, Location Address, Listing Type, Category, Description).

---

## 🎨 Screen Breakdown & Design System

### 1. Sign In & Login Screen (`screen === 'login'`)
- **First Screen on App Launch**.
- Supports Phone Number verification with OTP (`/auth/login/send-otp`, `/auth/login/verify-otp`) & User Registration (`/auth/register`).
- Includes **"Quick Login Access"** button for instant sandbox validation without entering credentials.
- **Redirects immediately to Dashboard** upon authentication.

### 2. Buyer Dashboard (`screen === 'dashboard'`)
- Welcome header displaying active user role and avatar.
- **Hero AI Action Card ("✨ Chat with AI Assistant")**: Directly takes buyer to the AI conversation screen.
- **Featured Property Feed**: Live grid of database properties with prices, location, BHK tags, and direct Wishlist toggle.
- **Bottom Navigation Bar**: Persistent 5-button bottom bar (`Dashboard`, `AI Chat`, `Results`, `Wishlist`, `Tours`).

### 3. AI Chat Screen (`screen === 'ai-chat'`)
- Interactive real-time conversation powered by NestJS AI core service (`/ai/chat`).
- Natural language query text box allowing buyers to state specific requirements (e.g. *"3 BHK luxury villa in Jagatpura under 1.5 Cr with swimming pool"*).
- **"✨ Submit Query & View Matching Properties"** button:
  - Invokes AI preference extraction (`POST /ai/preferences/extract`).
  - Auto-saves extracted criteria to buyer preferences endpoint (`POST /buyer/preferences`).
  - Fetches database matches from `/properties/buyer/matches` & `/properties`.
  - **Redirects to AI Search Results Page**.

### 4. AI Search Results Page (`screen === 'ai-results'`)
- Header displaying active AI query criteria badge.
- Property cards displaying real database listings with AI Match Score %, price tag, image, specifications, and Wishlist heart button.
- Tapping a card opens the **Property Details Page**.

### 5. Property Details Page (`screen === 'details'`)
- Property cover photo & gallery preview.
- Complete specifications (Bedrooms, Bathrooms, Area sq ft, Location Address, Listing Type, Category, Description).
- **"Wishlist Toggle"** & **"Book Site Visit / Tour"** actions.

### 6. Wishlist Page (`screen === 'wishlist'`)
- Displays all saved favourite properties (`GET /wishlist`, `POST /wishlist`, `DELETE /wishlist`).
- Single-tap removal and direct detail navigation.

### 7. Scheduled Tours / Meetings Page (`screen === 'meetings'`)
- Displays confirmed & pending site visit appointments booked by the buyer (`GET /meetings/my`).

---

## 🔗 Integrated Backend & AI Endpoints

| Feature | HTTP Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Database Properties Feed** | `GET` | `/properties` | Queries real published properties from database |
| **Buyer Preferences Matches** | `GET` | `/properties/buyer/matches` | Queries DB for preference-matched properties |
| **User Register** | `POST` | `/auth/register` | User registration |
| **Send OTP** | `POST` | `/auth/login/send-otp` | Sends OTP to buyer phone |
| **Verify OTP** | `POST` | `/auth/login/verify-otp` | Verifies OTP code & returns JWT |
| **AI Preference Extract** | `POST` | `/ai/preferences/extract` | Extracts BHK, location, budget from natural query |
| **Save Preferences** | `POST` | `/buyer/preferences` | Persists search preferences to DB |
| **AI Recommendations** | `POST` | `/ai/recommendations/rank` | AI neural ranking algorithm |
| **AI Chat Assistant** | `POST` | `/ai/chat` | Natural language chat assistant |
| **Fetch Wishlist** | `GET` | `/wishlist` | Gets buyer saved favourites |
| **Add Wishlist** | `POST` | `/wishlist` | Adds property to wishlist |
| **Remove Wishlist** | `DELETE` | `/wishlist/:id` | Removes property from wishlist |
| **Fetch Tour Slots** | `GET` | `/meetings/slots` | Gets available agent showing slots |
| **Book Site Visit** | `POST` | `/meetings` | Schedules site visit tour |
| **My Scheduled Tours** | `GET` | `/meetings/my` | Fetches active & past site visits |

---

## 🛠️ File Structure in `mobileapp`

- `d:\mobileapp\src\components\MobileSimulator.tsx`: Main React component implementing all 7 screens, state transitions, database property fetching, and smartphone viewport frame.
- `d:\mobileapp\src\components\ApiConsole.tsx`: Real-time network inspector console logging all API requests, headers, response status, duration, and payloads.
- `d:\mobileapp\src\lib\api.ts`: API network tracker and database property structure fallback layer.
- `d:\mobileapp\brain.md`: Complete documentation (this file).
