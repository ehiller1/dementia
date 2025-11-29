# IMS - Intelligent Management System

## Project Overview

IMS (Intelligent Management System) is an AI-powered business intelligence platform built on Quest Agent Forge architecture. It provides conversational AI, multi-agent orchestration, and template-driven workflows for business decision-making.

## Quick Start

### Prerequisites

- Node.js 20+ & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account (for database and edge functions)

### Installation

```sh
# Clone the repository
git clone https://github.com/ehiller1/IMS.git

# Navigate to the project directory
cd IMS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the project
npm run build

# Start development server
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Running the Application

### Development Mode

```bash
# Start frontend development server
npm run dev

# Start backend server (port 8081)
npm run start:real

# Start meta server (port 8083)
npm run start:meta:ipv4
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Features

- **Conversational AI Interface**: Natural language interaction for business queries
- **Multi-Agent Orchestration**: CrewAI-powered agent coordination
- **Template-Driven Workflows**: Dynamic template engine for business processes
- **Memory Integration**: Hierarchical memory system (working, short-term, long-term)
- **Decision Intelligence**: Monte Carlo simulations and scenario planning
- **Real-time Narratives**: Live business intelligence streaming

## Environment Variables

Required environment variables (create `.env` file):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=8081
```

## Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── services/        # Business logic services
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   └── pages/           # Application pages
├── supabase/            # Supabase functions and migrations
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

## License

Proprietary - All rights reserved
