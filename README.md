# CTS v3.1 - Crypto Trading System

*Professional automated cryptocurrency trading platform with advanced indication system*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

## Overview

CTS v3.1 is a professional-grade crypto trading system featuring:

- **Multi-Exchange Support**: Bybit, BingX, Pionex with unified API
- **Advanced Indication System**: Main (Direction/Move/Active/Optimal) and Common (RSI/MACD/Bollinger/ParabolicSAR/ADX/ATR) indicators
- **Preset Trade Engine**: Automated trading with configurable strategies
- **Strategy Categories**: 
  - **Additional** (Trailing) - Enhancement strategies
  - **Adjust** (Block/DCA) - Volume/position adjustment strategies
- **Real-time WebSocket**: Live market data and position tracking
- **Comprehensive Logging**: System-wide activity monitoring

## Quick Install

### One-Line Installation

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash
\`\`\`

### Custom Installation

\`\`\`bash
# Custom port
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 8080

# Custom project name
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --name my-trading-bot

# Multiple instances
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 3000 --name cts-prod
curl -fsSL https://raw.githubusercontent.com/mxssnx-creator/v0-cts-v3-zw/main/scripts/download-and-install.sh | bash -s -- --port 3001 --name cts-test
\`\`\`

For detailed instructions, see [INSTALL.md](INSTALL.md).

## System Architecture

### Indication System

**Main Indications** (Step-based progression):
- Direction - Trend analysis (SMA crossovers)
- Move - Momentum detection (ROC)
- Active - Market activity (Volatility/Volume)
- Optimal - Combined scoring

**Common Indicators** (Technical analysis):
- RSI - Relative Strength Index
- MACD - Moving Average Convergence Divergence
- Bollinger Bands - Volatility bands
- Parabolic SAR - Trend following
- ADX - Trend strength
- ATR - Volatility measurement

### Strategy Categories

**Additional (Purple)** - Enhancement strategies:
- Trailing Stop - Dynamic stop-loss based on price movement

**Adjust (Blue)** - Position adjustment strategies:
- Block - Predefined position sizing blocks
- DCA - Dollar Cost Averaging for position building

### Trade Engine Flow

\`\`\`
Market Data → Indication Processing → Strategy Evaluation → Position Management → Exchange Execution
     ↓              ↓                       ↓                      ↓                    ↓
  WebSocket    Main/Common           Additional/Adjust       Pseudo Positions      Live Orders
\`\`\`

## Features

### Dashboard
- Real-time connection status
- Active positions overview
- Performance metrics
- Quick action controls

### Presets Management
- Preset Types with Sets
- Configuration filtering (Main/Common indicators)
- Strategy category organization
- Base settings synchronization

### Settings
- **Exchange**: Connection configuration, position limits
- **Indication**: Main and Common indicator settings
- **Strategy**: Trailing/Block/DCA configuration with categories
- **Install**: Database management, backup/restore, diagnostics

### Live Trading
- Real-time position monitoring
- Manual trade execution
- Risk management controls
- Performance analytics

## Documentation

- [INSTALL.md](INSTALL.md) - Installation guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- [SETTINGS_DOCUMENTATION.md](SETTINGS_DOCUMENTATION.md) - Settings reference
- [VOLUME_CALCULATION_CORRECTIONS.md](VOLUME_CALCULATION_CORRECTIONS.md) - Volume architecture

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL / SQLite
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **State**: SWR for data fetching

## Environment Variables

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REMOTE_POSTGRES_URL=postgresql://user:password@host:5432/database

# Security
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
API_SIGNING_SECRET=your-api-signing-secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
\`\`\`

## Support

For issues or questions:
1. Check [Troubleshooting](INSTALL.md#troubleshooting)
2. Review system logs via Settings → Install → Diagnostics
3. Open a GitHub issue

## License

MIT License - See LICENSE file for details
