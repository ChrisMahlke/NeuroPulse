# NeuroPulse Dashboard

Real-time Next.js dashboard for NeuroPulse stroke triage system.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [API Integration](#api-integration)
- [Configuration](#configuration)
- [Learn More](#learn-more)

---

## Features

- **Real-time Updates**: WebSocket connection for live data streaming
- **Active Cases Panel**: List of all incoming stroke cases with risk assessment
- **Selected Case Details**: Live vitals, AI predictions, hospital routing recommendations
- **AI Insights**: Natural language explanations and action plans
- **Streaming Metrics**: Confluent Cloud Kafka metrics and throughput

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI** - Professional healthcare-grade UI components
- **Redux Toolkit** - State management
- **WebSocket** - Real-time data updates
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js 18+
- API server running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── dashboard/   # Main dashboard component
│   │   └── ...          # Other UI components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client
│   ├── state/           # Redux store
│   └── theme/           # Material-UI theme
└── public/              # Static assets
```

## Key Components

- **NeuroPulseDashboard** - Main dashboard layout and case management
- **VitalCard** - Displays individual vital signs with color coding
- **ProbabilityGauge** - Visual gauge for stroke/LVO probabilities
- **HospitalRoutingVisualization** - Hospital routing recommendations
- **AIExplanationVisualizer** - AI-generated explanations
- **TimeWindowVisualization** - Critical treatment time windows

## API Integration

The dashboard connects to the FastAPI backend via:
- **REST API** - Initial data fetch and fallback polling
- **WebSocket** - Real-time updates (`ws://localhost:8000/ws`)

See `src/services/api.ts` for API client implementation.

## Configuration

The API server URL is configured in `src/services/api.ts`. Default: `http://localhost:8000`

For production, update the `API_BASE_URL` environment variable.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
