# Meridian Campus Events — University Event Management System

A full-stack, responsive Campus Event Management System built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Express**, and **SQLite (`node:sqlite`)**. Designed with dedicated **Student** and **Administrator** workflows, JWT authentication, live capacity tracking, registration pass codes, roster management, and Docker deployment support.

---

## Features

### Student Portal
- **Dashboard Overview**: Live counts of upcoming events, active registrations, attended events, and next scheduled event.
- **Event Discovery**: Search across event titles, organizers, departments, and venues; filter by category (`Academic`, `Technology`, `Arts & Culture`, `Career`, `Workshop`, `Athletics`), status (`Upcoming`, `Completed`, `All`), and sort order (`Soonest First`, `Most Popular`, `Newest`).
- **Event Details & Registration**: Full event details view with real-time seat availability, registration notes, instant confirmation with unique pass code (`CU-XXXX-XX`), duplicate-booking prevention, and cancellation support.
- **My Registrations**: Dedicated view of confirmed, attended, and cancelled registrations with ticket codes and quick cancellation.

### Administrator Portal
- **Campus Analytics Dashboard**: Total events, campus-wide registrations, active student count, overall seat utilization percentage, category breakdown chart, and recent registration activity feed.
- **Event Management (CRUD)**: Create, edit, and delete campus events with full client-side and server-side validation, cover image selection, capacity guards (prevents reducing capacity below confirmed registrations), and featured highlighting.
- **Student Roster & Check-In**: Inspect all registered students per event, filter/search attendees, toggle attendance status (`Confirmed` / `Attended` / `Cancelled`), and export the event roster to CSV.

### Security & Persistence
- Passwords hashed with `bcryptjs`.
- Stateless authentication using signed JSON Web Tokens (`jsonwebtoken`).
- Persistent relational SQLite database (`node:sqlite` with WAL mode and foreign key constraints) automatically initialized and seeded on first startup.

---

## Tech Stack & Dependencies

- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `motion`
- **Backend**: Node.js 22+, Express 4, `node:sqlite`, `bcryptjs`, `jsonwebtoken`, `dotenv`
- **Tooling**: Vite 8, `tsx`, Docker & Docker Compose

---

## Prerequisites

- **Node.js** `>= 22.14.0` (required for built-in `node:sqlite` and native TypeScript execution)
- **npm** `>= 10`
- *(Optional)* **Docker** & **Docker Compose** for containerized deployment

---

## Local Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** *(optional — sensible defaults are provided for local dev)*:
   ```bash
   cp .env.example .env
   ```
   Variables in `.env`:
   - `PORT` (default: `3000`)
   - `JWT_SECRET` (signing key for JWTs)
   - `DATABASE_PATH` (default: `./data/campus_events.db`)

3. **Start the development server** (runs Express API + Vite frontend middleware on port `3000`):
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Type-check and build for production**:
   ```bash
   npm run lint
   npm run build
   npm run start
   ```

---

## Demo Accounts (Seeded Automatically)

On first run, the SQLite database seeds realistic university events and sample accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@university.edu` | `Admin123!` |
| **Student** | `student@university.edu` | `Student123!` |

You can also register new student or administrator accounts directly from the **Create Account** tab on the sign-in page.

---

## Docker Deployment

### Using Docker Compose (Recommended)
Builds the production image and persists the SQLite database in a named Docker volume (`campus_events_data`):

```bash
docker compose up --build -d
```

Check logs or stop the container:
```bash
docker compose logs -f
docker compose down
```

### Using Docker CLI Directly
```bash
docker build -t meridian-campus-events .
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-production-secret" \
  -v campus_events_data:/app/data \
  --name meridian-campus-events \
  meridian-campus-events
```

The app will be available at [http://localhost:3000](http://localhost:3000) with health checks served at `GET /api/health`.

---

## Publishing Publicly

### 1. Publish Directly via Google AI Studio
Click **Share** / **Deploy** in the top-right bar of AI Studio to publish the app to your public Cloud Run URL.
Before sharing with real users, set these environment variables in your Secrets / deployment settings:
- `JWT_SECRET`: Strong random secret string.
- `ADMIN_INVITE_CODE`: Secret code required when creating new Administrator accounts.
- `DISABLE_DEMO_LOGIN`: Set to `"true"` to hide the one-click demo buttons on the sign-in page.

### 2. Deploy Static Frontend to GitHub Pages
Because GitHub Pages serves static files from a repository subpath (`https://<user>.github.io/<repo>/`) and does not run Node.js, deploying the raw root branch (`/(root)`) serves uncompiled `/src/main.tsx` and will fail to load. Use either of these two supported methods:

- **Method A (Recommended — GitHub Actions):**
  1. Push your repository to GitHub on `main` or `master`.
  2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
  3. `.github/workflows/deploy.yml` automatically runs `npm install && npm run build` and deploys `./dist`.

- **Method B (Deploy from a branch using `/docs`):**
  1. Run `npm run build:pages` (or push the prebuilt `docs/` folder included in the repo).
  2. Open **Settings → Pages → Build and deployment → Source** and select **Deploy from a branch**.
  3. Set Branch to **`main`** and Folder to **`/docs`** (not `/ (root)`), then click **Save**.

On GitHub Pages (where no Express server is running), the app automatically activates its browser-persistent `localStorage` fallback so login, registration, event management, and rosters still work interactively.

### 3. Self-Host Full-Stack with Docker (Render, Railway, Fly.io, Cloud Run, or VPS)
1. Build and push the container or connect your repository using the included `Dockerfile`.
2. Mount a persistent disk/volume at `/app/data` so the SQLite database (`campus_events.db`) persists across restarts.
3. Configure production environment variables:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_PATH=/app/data/campus_events.db
   JWT_SECRET=your-long-random-secret
   ADMIN_INVITE_CODE=your-staff-invite-code
   DISABLE_DEMO_LOGIN=true
   ```
4. Expose port `3000` behind HTTPS (automatic on Cloud Run, Render, Railway, or via Caddy/Nginx on a VPS).

