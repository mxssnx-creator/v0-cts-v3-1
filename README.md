# CTS v3.1 - Crypto Trading System

// ... existing code ...

The setup script will:
- Validate Node.js version (18.x - 26.x supported)
- Prompt for project name (default: CTS-v3)
- Prompt for application port (default: 3000)
- Configure database (SQLite or PostgreSQL)
  - **SQLite**: username: CTS-v3, password: 00998877
  - **PostgreSQL**: username: CTS-v3, password: 00998877, database: CTS-v3
- Generate secure secrets automatically
- **Install dependencies with better-sqlite3 rebuild prompt**
- Create required directories
- Run database migrations
- Optional: Build for production

// ... existing code ...
```

```typescript file="" isHidden
