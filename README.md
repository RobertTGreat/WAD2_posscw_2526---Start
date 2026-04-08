# Stillpoint — Yoga & Mindfulness booking (WAD2)

Node.js + Express + NeDB + Mustache. Passwords are stored as **bcrypt** hashes; sessions use a signed **HTTP-only** cookie (JWT).

## Run locally

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Open http://localhost:3000 — **register with any email and password** (8+ characters, within bcrypt’s 72-byte limit), or use seeded accounts after `npm run seed`:

### Your own account

1. Go to **Register**, enter name, email, and password — you’ll be signed in immediately and redirected to courses (or organiser dashboard if you used a valid organiser code).
2. To sign in later, use **Sign in** with the **same email and password** (spacing/case in the email field is normalised automatically).
3. If you ran **`npm test`**, run **`npm run seed`** again before using README demo logins (tests clear the database).

Seeded demo accounts (after `npm run seed`):

- Student: `fiona@student.local` / `StudentDemo123!`
- Organiser: `organiser@studio.local` / `OrganiserDemo123!`

## Organiser signup code (markers)

Registration includes an optional **“Are you an organiser?”** step. To create an **organiser** account via the public sign-up form, you must enter a **setup code**.

**The code is the value of `ORGANISER_SIGNUP_CODE` in your `.env` file** (copied from `.env.example`).

**For marking / demo, the default in `.env.example` is:**

```text
WAD2-ORG-MARKER-2026
```

Set `ORGANISER_SIGNUP_CODE` to that string in `.env` (or choose another value and keep `.env` and README in sync). If `ORGANISER_SIGNUP_CODE` is unset or empty, the organiser checkbox is hidden and only student self-registration is available; existing organisers can still promote users under **Organiser → Users**.

## Test

```bash
npm test
```

**Important:** `npm test` **resets the local NeDB database** (`db/*.db`). After running tests, seeded demo accounts from `npm run seed` are **gone** until you **run `npm run seed` again**. Custom accounts you created are also removed. The Jest suite includes an **auth flow** test that registers a disposable address and logs in.

## API

JSON endpoints are under `/api/courses`, `/api/sessions`, `/api/bookings`. Mutating routes require a signed-in user (organiser role for course/session writes).

## Features (summary)

- Public **About** and **Courses** listings with filters; course detail shows location, price, schedule.
- **Register / login / logout** with secure password hashing; optional **organiser registration** with shared secret code.
- **Students** book a full course or a single class (where drop-in is allowed).
- **Organisers** manage courses and class sessions, view class rosters, promote/demote organisers, and remove users.

Set a strong `JWT_SECRET` in production and deploy over **HTTPS** so the auth cookie can use the `Secure` flag.

## Deploy

This repo supports both **Render** and **Vercel** while keeping **NeDB** as the only datastore.

### Shared environment variables

Set these in whichever platform you deploy to:

- `JWT_SECRET` — long random string (16+ characters minimum)
- `ORGANISER_SIGNUP_CODE` — optional; same idea as local `.env`
- `NODE_ENV=production`

### Deploy on Render

Use a **Web Service**, not a **Static Site**.

1. Dashboard → **New +** → **Web Service**
2. Connect this repository and branch `main`
3. Use:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/health`

If you create a **Static Site** instead, Render will show **“Empty build command; skipping build”** and your app will return **404** because Express never starts.

After the first successful deploy, open the Render shell and run **`npm run seed`** once if you want the demo users and demo courses.

For persistent NeDB data on Render, add a **Disk**, mount it (for example `/data/nedb`), and set:

- `NEDB_DATA_DIR=/data/nedb`

The repo also includes **`render.yaml`** if you prefer Render Blueprints.

### Deploy on Vercel

Import the repository as a normal project. No publish directory is needed.

- Vercel uses the root **`index.js`** Express entry
- Static files are served from **`public/`**
- Mustache templates are bundled via **`vercel.json`**

Important NeDB note for Vercel:

- Vercel has no persistent writable project disk
- This app stores NeDB files in **`/tmp/yoga-nedb`** on Vercel
- That storage is **ephemeral**, so data can disappear between cold starts / fresh instances

To keep the Vercel demo usable, the app automatically seeds the demo data on a brand-new empty serverless instance. That gives you the demo courses and logins again when a new instance starts, but it is still **not durable storage**.
