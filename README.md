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

Copy the example files and configure:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

#### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Yes |
| `REDIS_HOST` | Redis host | Yes |
| `REDIS_PORT` | Redis port (default: 6379) | No |
| `JWT_SECRET` | Secret for JWT signing | Yes (production) |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes (production) |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 5000) | No |

#### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_BYPASS_AUTH` | Bypass auth in development | No |

## Deployment

### Using Docker Compose (Recommended)

```bash
# Set required environment variables
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret-key"
export CORS_ORIGINS="https://yourdomain.com"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
pnpm build:all

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Save PM2 config for auto-restart
pm2 save
pm2 startup
```

### Database Migrations

```bash
# Generate new migrations (if schema changed)
cd apps/backend && pnpm db:generate

# Apply migrations
cd apps/backend && pnpm db:migrate
```

## Security Notes

- Change `JWT_SECRET` to a secure random string in production
- Configure `CORS_ORIGINS` to only allow your frontend domain
- Rate limiting is enabled automatically in production
- Authentication is required for all dashboard routes

## License

MIT
