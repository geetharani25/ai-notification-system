# NotifyAI — AI-Powered Real-Time Notification System

A Slack-like multi-user messaging application with AI-driven urgency classification for broadcast messages.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React 19 + Vite + Tailwind CSS + Socket.IO-client          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐    │
│  │   Auth   │  │  Chat UI │  │  Notification Panel    │    │
│  │  (JWT)   │  │  DM +    │  │  Bell + Urgency Badges │    │
│  │          │  │ Channels │  │                        │    │
│  └──────────┘  └──────────┘  └────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │  REST API  +  Socket.IO (ws)
┌───────────────────────▼─────────────────────────────────────┐
│                         BACKEND                             │
│  Node.js + Express + Socket.IO                              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐    │
│  │   Auth   │  │  Message │  │  Notification Fan-out  │    │
│  │  Routes  │  │  Routes  │  │  Socket Event Handlers │    │
│  └──────────┘  └──────────┘  └────────────────────────┘    │
│                        │                                    │
│                ┌───────▼──────┐                             │
│                │  AI Pipeline │                             │
│                │  Gemini API  │◄── Async classification     │
│                │  (2.5-flash) │    for channel messages     │
│                └───────┬──────┘                             │
│                        │ keyword fallback if no API key     │
│                ┌───────▼──────┐                             │
│                │    SQLite    │                             │
│                │  (app.db)    │                             │
│                └──────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-user Direct Messaging** — real-time private conversations
- **Broadcast Channels** — team-wide announcements
- **AI Urgency Classification** — Gemini AI classifies every channel message as HIGH / MEDIUM / LOW
- **Real-Time Notifications** — Socket.IO push to all recipients
- **Notification Panel** — unread badge, priority styling, mark-as-read
- **User Presence** — online/offline indicators in the sidebar
- **Typing Indicators** — live typing status in channels and DMs

## AI Approach

Every message sent to a **channel** is automatically classified by Google Gemini (`gemini-2.5-flash`):

| Urgency | When assigned | Visual |
|---------|--------------|--------|
| **HIGH** | Immediate action required — outages, production incidents, security breaches | Red badge + red border |
| **MEDIUM** | Important but not time-critical — bugs, delays, warnings | Yellow badge |
| **LOW** | Informational or routine — updates, greetings, general chat | Green badge |

### How it works

1. A user sends a channel message — it is **immediately** stored and broadcast to all subscribers.
2. In the background, the message content is sent to the Gemini API with a structured prompt requesting a JSON response: `{"urgency":"high|medium|low","reason":"..."}`.
3. On success, the message record is updated with the urgency level and a `message_classified` Socket.IO event is emitted to the channel room, causing every client to update its badge in real time (typically within ~1 second).
4. **Retry logic** — up to 3 attempts with exponential backoff on 503 responses.
5. **Keyword fallback** — if `GEMINI_API_KEY` is not set, or if the API call ultimately fails, a deterministic keyword list is used instead (e.g. "outage", "crash", "urgent" → HIGH; "bug", "warning" → MEDIUM).

Classification is fully **non-blocking** — message delivery is never delayed by the AI step.

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- A Google Gemini API key (optional — keyword fallback works without it)

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
PORT=3001
JWT_SECRET=your_long_random_secret_here
GEMINI_API_KEY=AIza...       # leave blank to use keyword-based fallback
```

### 3. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App opens on http://localhost:5173
```

### 4. Try it out

1. Register two accounts in separate browser tabs (or use private/incognito).
2. Log in with both accounts.
3. Send a DM from one to the other — watch the notification bell update in real time.
4. Join `#general` and send a channel message — observe the AI urgency badge appear within ~1 second.
5. Try messages like `"Production server is down!"` (HIGH) vs `"Lunch at noon?"` (LOW).

## Project Structure

```
├── backend/
│   ├── server.js                  # Express + Socket.IO entry point
│   ├── .env.example               # Required environment variables
│   ├── db/
│   │   ├── database.js            # SQLite connection (better-sqlite3)
│   │   └── schema.sql             # Tables: users, channels, messages, notifications
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js                # POST /register, POST /login
│   │   ├── channels.js            # GET/POST /channels
│   │   ├── messages.js            # GET /messages (history)
│   │   ├── notifications.js       # GET/PATCH /notifications
│   │   └── users.js               # GET /users
│   ├── socket/
│   │   └── handlers.js            # All Socket.IO event handlers
│   └── services/
│       └── aiClassifier.js        # Gemini API + keyword fallback
│
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.jsx     # JWT auth state
        │   └── SocketContext.jsx   # Socket.IO connection
        ├── hooks/
        │   ├── useNotifications.js
        │   └── usePresence.js
        ├── components/
        │   ├── chat/              # ChatArea, MessageBubble, MessageInput, MessageList
        │   ├── layout/            # AppShell, Sidebar
        │   ├── notifications/     # NotificationBell, NotificationItem
        │   └── ui/                # Avatar, UrgencyBadge
        └── pages/                 # LoginPage, RegisterPage
```

## Socket.IO Event Reference

| Event (client → server) | Description |
|--------------------------|-------------|
| `authenticate` | Send JWT token after connect |
| `join_channel` / `leave_channel` | Subscribe/unsubscribe to a channel room |
| `send_dm` | Send a direct message |
| `send_channel_message` | Send a message to a channel |
| `typing_start` / `typing_stop` | Broadcast typing indicator |

| Event (server → client) | Description |
|--------------------------|-------------|
| `authenticated` | Auth confirmed; includes online user list |
| `new_dm` | New direct message |
| `new_channel_message` | New channel message |
| `message_classified` | AI urgency result ready for a message |
| `notification` | New notification for the current user |
| `user_presence` | User online/offline status change |
| `typing_indicator` | Another user is typing |

## Assumptions

- All registered users are implicit members of all channels — no explicit channel membership or invite flow.
- JWT tokens are stored in `localStorage` (acceptable for a demo/assessment context; a production app would use `httpOnly` cookies).
- SQLite is used for zero-config local persistence; swapping to Postgres would require minimal changes given the SQL-first approach.
- AI classification is intentionally async and best-effort — a message is never blocked or lost if classification fails.
- The keyword fallback is deterministic and activates automatically when `GEMINI_API_KEY` is absent or when the Gemini API is unreachable after retries.
- CORS is restricted to `http://localhost:5173` (Vite default); update `server.js` for production deployment.
