# File Manager

A cross-platform file management application for organizing, scanning, and managing duplicate files.

## Features

- **File Scanning** - Scan directories and get detailed file information
- **File Organization** - Automatically organize files into categorized folders
- **Duplicate Detection** - Find duplicate files using SHA-256 hashing
- **History Tracking** - Track all file operations with undo capability
- **Scheduled Tasks** - Set up automated organization schedules

## Architecture

This is a monorepo containing:

- `apps/backend` - Fastify REST API server (port 5000)
- `apps/frontend` - Next.js web frontend (port 3001)
- `apps/desktop` - Electron desktop application
- `packages/shared` - Shared types and utilities

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker (for Redis, required by backend)

### Installation

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm build:shared
```

### Development

#### Web Application (Backend + Frontend)

```bash
# Start Redis (required for backend job queue)
pnpm redis:start

# Run backend and frontend together
pnpm dev:web

# Or run them separately:
pnpm dev:backend   # Starts backend on port 5000
pnpm dev:frontend  # Starts frontend on port 3001
```

#### Desktop Application

The desktop app requires the frontend to be running:

```bash
# Option 1: Run everything together (recommended)
pnpm dev:desktop:full

# Option 2: Run manually in separate terminals
pnpm dev:frontend  # Terminal 1: Start frontend first
pnpm dev:desktop   # Terminal 2: Start desktop app after frontend is ready
```

### Production Build

```bash
# Build all packages
pnpm build:all

# Build desktop app
pnpm build:desktop

# Package desktop app for distribution
pnpm package:desktop:win    # Windows
pnpm package:desktop:mac    # macOS
pnpm package:desktop:linux  # Linux
```

## Tech Stack

- **Backend**: Fastify, Drizzle ORM, PostgreSQL/SQLite, BullMQ
- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Desktop**: Electron, electron-vite, better-sqlite3

## Configuration

### Ports

| Service  | Port |
|----------|------|
| Backend  | 5000 |
| Frontend | 3001 |

### Environment Variables

Create `.env` files as needed:

- `apps/backend/.env` - Backend configuration
- `apps/frontend/.env.local` - Frontend configuration
- `apps/desktop/.env` - Desktop app configuration (optional)

## License

MIT
