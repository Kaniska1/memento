# Memento 🎬

> **Your cinema, remembered.**

Memento is a personal film discovery, tracking, and recommendation platform built for people who want more than just another movie database.

Discover films, maintain a watchlist, log everything you watch, write reviews, create lists, track your viewing history, and gradually build a taste profile that powers personalized recommendations.

Rather than focusing on streaming movies directly, Memento focuses on **remembering what you watch and understanding what you like**.

---

## ✨ Features

### 🎬 Film Discovery

- Browse currently trending movies
- Explore popular films
- View top-rated movies
- Search the TMDB catalogue
- Filter and discover films
- Dedicated movie detail pages
- Movie metadata, genres, ratings, cast, and other information

### 🧠 Taste Onboarding

New users build their initial taste profile by:

- Selecting **4 favourite films**
- Choosing preferred genres
- Rating popular movies from those genres
- Rating films in **0.5-star increments**

This information forms the initial dataset for Memento's recommendation system.

### ⭐ Half-Star Rating System

Movies can be rated using:

```text
0.5 ★
1.0 ★
1.5 ★
2.0 ★
...
4.5 ★
5.0 ★
```

The rating component detects which half of a star is selected, providing a Letterboxd-style rating experience.

### 📖 Film Diary

Users can log every movie they watch.

Each diary entry can contain:

- Watch date
- Rating
- Review/comment
- Like status
- Rewatch status
- Spoiler status
- Movie poster and metadata

The diary uses a calendar-inspired layout showing:

```text
MONTH | DAY | POSTER | FILM | RELEASED | RATING | LIKE | REWATCH | REVIEW | EDIT
```

Existing diary entries can also be edited or deleted.

### ❤️ Favourites

Users can maintain a personal collection of favourite films.

Favourites can be:

- Added directly from movie pages
- Removed
- Searched
- Sorted by title
- Sorted by rating
- Sorted by release year
- Sorted by date added

### 🔖 Watchlist

Movies can be saved for later through a persistent personal watchlist.

Users can:

- Add/remove films
- Browse their saved films
- Open movie details directly from the watchlist

### 📚 Custom Lists

Users can create their own movie collections.

Lists support:

- Custom titles
- Descriptions
- Movie search
- Adding/removing films
- Ranked lists
- Unranked lists
- Film reordering
- Public/private visibility
- Collaborators for private lists

### 🎯 Personalized Recommendations

Memento includes a dedicated recommendation experience designed around the user's taste profile.

Recommendation signals include:

- Favourite movies
- Preferred genres
- Initial onboarding ratings
- Diary ratings
- Viewing history
- Likes
- Watchlist behaviour

The recommendation backend will continue to evolve as the project develops.

### 👤 Profiles

Users have personal film profiles containing:

- Display name
- Username
- Bio
- Favourite films
- Viewing statistics
- Diary activity
- Lists
- Ratings

Profile information can be edited directly inside Memento.

### 🔔 Notifications

Memento includes an in-app notification system with:

- Unread notification counter
- Notification dropdown
- Read/unread state
- Deep links to relevant pages
- Notification deletion
- Mark-all-as-read support

Current frontend notifications are stored locally and will progressively move to backend persistence.

### 🔍 Global Search

Movie search is available throughout the application.

Desktop and mobile have dedicated search experiences, with mobile using a full-screen search interface.

### 📱 Responsive UI

Memento is designed for:

- Desktop
- Laptop
- Tablet
- Mobile

The application uses a responsive sidebar/topbar/navigation system depending on screen size.

---

# 🔐 Authentication

Memento includes its own authentication system.

Current authentication features include:

- User registration
- User login
- Secure logout
- Password hashing
- JWT-based sessions
- HTTP-only authentication cookies
- Protected application routes
- Server-side session validation
- Persistent MongoDB users
- Onboarding-aware redirects

Passwords are hashed using **bcrypt** before being stored.

Session tokens are signed using **JOSE** and stored inside HTTP-only cookies.

```text
Signup
   ↓
Validate credentials
   ↓
Hash password
   ↓
Create MongoDB user
   ↓
Generate session JWT
   ↓
Set HTTP-only cookie
   ↓
Onboarding
   ↓
Memento
```

Returning users follow:

```text
Login
   ↓
Verify password
   ↓
Generate session
   ↓
Check onboarding status
   ↓
┌──────────────────┐
│ Completed?       │
├─────────┬────────┤
│ No      │ Yes    │
↓         ↓
Onboarding  Home
```

---

# 🛠 Tech Stack

## Frontend

- **Next.js 16**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide React**

## Backend

- **Next.js Route Handlers**
- **MongoDB**
- **Mongoose**
- **bcryptjs**
- **JOSE**
- **Zod**

## Movie Data

- **TMDB API**

TMDB currently provides movie information such as:

- Trending movies
- Popular movies
- Search results
- Movie metadata
- Genres
- Posters
- Backdrops
- Ratings

---

# 🗂 Project Structure

```text
memento/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── (app)/
│   │   │   ├── home/
│   │   │   ├── discover/
│   │   │   ├── recommendations/
│   │   │   ├── diary/
│   │   │   ├── watchlist/
│   │   │   ├── favourites/
│   │   │   ├── lists/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── me/
│   │   │   │
│   │   │   ├── health/
│   │   │   │   └── db/
│   │   │   │
│   │   │   ├── onboarding/
│   │   │   └── tmdb/
│   │   │
│   │   ├── login/
│   │   ├── signup/
│   │   ├── onboarding/
│   │   └── movies/
│   │       └── [id]/
│   │
│   ├── components/
│   │   ├── app/
│   │   ├── diary/
│   │   ├── discover/
│   │   ├── favourites/
│   │   ├── home/
│   │   ├── lists/
│   │   ├── movies/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── recommendations/
│   │   ├── settings/
│   │   ├── watchlist/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── current-user.ts
│   │   ├── mongodb.ts
│   │   ├── diary-storage.ts
│   │   ├── favourite-storage.ts
│   │   ├── notification-storage.ts
│   │   ├── settings-storage.ts
│   │   ├── watchlist-storage.ts
│   │   └── validations/
│   │
│   ├── models/
│   │   └── User.ts
│   │
│   ├── types/
│   │
│   └── proxy.ts
│
├── .env.local
├── package.json
└── README.md
```

The structure will expand as frontend `localStorage` systems are migrated to MongoDB-backed APIs.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
```

```bash
cd memento
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

Add:

```env
TMDB_ACCESS_TOKEN=your_tmdb_read_access_token

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_long_random_jwt_secret
```

### Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated value into:

```env
JWT_SECRET=...
```

> Never commit `.env.local` or expose these credentials publicly.

---

# 🎞 TMDB Setup

Memento uses TMDB as its primary movie metadata provider.

Create a TMDB account and obtain an API Read Access Token.

Add it to:

```env
TMDB_ACCESS_TOKEN=your_access_token
```

TMDB requests are handled server-side so the access token does not need to be exposed directly to the browser.

---

# 🍃 MongoDB Setup

Create a MongoDB Atlas database and obtain its connection string.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/memento?retryWrites=true&w=majority
```

Replace:

```text
USERNAME
PASSWORD
CLUSTER
```

with your MongoDB Atlas credentials.

---

# 🧪 Test the Database

Start the development server:

```bash
npm run dev
```

Visit:

```text
http://localhost:3000/api/health/db
```

A successful connection returns:

```json
{
  "success": true,
  "database": "connected",
  "readyState": 1
}
```

---

# 🔐 Test Authentication

After creating or logging into an account, visit:

```text
http://localhost:3000/api/auth/me
```

An authenticated request returns:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "...",
    "username": "...",
    "email": "...",
    "onboardingCompleted": false
  }
}
```

Without a valid session:

```json
{
  "success": false,
  "message": "You are not authenticated."
}
```

---

# 💾 Current Data Architecture

Memento is currently transitioning from a frontend prototype into a fully persistent application.

Some features still temporarily use browser `localStorage`:

```text
memento:onboarding
memento:diary
memento:watchlist
memento:favourites
memento:lists
memento:settings
memento:notifications
```

Authentication and users are already backed by MongoDB.

The remaining local systems are being progressively migrated to authenticated database APIs.

This allows the UI and interactions to remain functional while backend persistence is introduced incrementally.

---

# 🧠 Recommendation System

The recommendation system is intended to build a progressively richer representation of a user's movie taste.

### Initial signals

```text
4 Favourite Films
        +
Preferred Genres
        +
Initial Movie Ratings
        ↓
Initial Taste Profile
```

### Long-term signals

As the user interacts with Memento:

```text
Initial Taste Profile
        +
Diary Entries
        +
Ratings
        +
Likes
        +
Rewatches
        +
Watchlist
        +
Viewing History
        ↓
Evolving Taste Profile
        ↓
Personalized Recommendations
```

This means recommendations improve as the user uses Memento rather than relying exclusively on generic popularity.

---

# 🗺 Development Roadmap

### Phase 1 — Frontend

- [x] Landing page
- [x] Responsive application shell
- [x] Movie discovery
- [x] Movie details
- [x] Global search
- [x] Mobile search
- [x] Watchlist
- [x] Favourites
- [x] Film logging
- [x] Half-star ratings
- [x] Film diary
- [x] Reviews and spoiler marking
- [x] Rewatch tracking
- [x] Lists
- [x] Ranked/unranked lists
- [x] List collaborators UI
- [x] Profile
- [x] Profile editing
- [x] Settings
- [x] Notifications
- [x] Loading states
- [x] Onboarding

### Phase 2 — Backend

- [x] MongoDB connection
- [x] User model
- [x] Signup
- [x] Login
- [x] Logout
- [x] JWT sessions
- [x] Protected routes
- [x] Current-user API
- [ ] Persist onboarding
- [ ] Diary API
- [ ] Ratings persistence
- [ ] Watchlist API
- [ ] Favourites API
- [ ] Lists API
- [ ] List collaboration
- [ ] Profile/settings persistence
- [ ] Persistent notifications

### Phase 3 — Recommendations

- [ ] Build user taste vectors
- [ ] Genre preference weighting
- [ ] Rating-based preference modelling
- [ ] Favourite-film similarity
- [ ] Diary-based recommendation signals
- [ ] Rewatch weighting
- [ ] Recommendation scoring
- [ ] Explainable recommendations
- [ ] Exclude already-watched films

### Phase 4 — Production

- [ ] Backend data migration
- [ ] Error boundaries
- [ ] Rate limiting
- [ ] Authentication hardening
- [ ] Database indexes
- [ ] Caching
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Production deployment

---

# 🎨 Design Philosophy

Memento intentionally avoids the visual language of generic streaming platforms.

The interface uses:

- Deep black backgrounds
- Burgundy/red accents
- Muted typography
- Cinematic imagery
- Minimal borders
- Large editorial typography
- Subtle gradients and fades

The goal is to feel closer to a **personal cinematic archive** than a streaming service.

---

# 🔒 Security

Memento currently implements several fundamental authentication protections:

- Passwords are never stored directly
- Passwords are hashed using bcrypt
- Authentication tokens are signed
- Session cookies are HTTP-only
- Cookies use `SameSite=Lax`
- Production cookies use `Secure`
- Protected routes require authentication
- Server-side session validation verifies the JWT
- Private APIs identify users through their session rather than trusting client-provided user IDs
- Password hashes are excluded from normal Mongoose queries

Additional production security measures will be introduced before deployment.

---

# 📌 Current Status

**Active Development**

The primary frontend experience is complete.

Authentication and MongoDB integration are operational, and development is currently focused on migrating Memento's user-generated data from browser storage to authenticated backend APIs.

---

# 🙏 Acknowledgements

Movie metadata and imagery are provided using **TMDB**.

Memento is an independent project and is not affiliated with or endorsed by TMDB.

---

## Built with 🎬, questionable sleep schedules, and an unreasonable attachment to movies.