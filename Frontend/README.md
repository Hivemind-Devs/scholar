# Hivemind Frontend

> Modern React-based frontend application for the YÖK Academic Research Intelligence Platform

[![React](https://img.shields.io/badge/React-18.3+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-purple.svg)](https://vitejs.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 📋 Overview

The Hivemind Frontend is a modern, responsive web application built with React and TypeScript. It provides an intuitive interface for students and researchers to discover academic supervisors, explore research areas, and access comprehensive academic profiles.

### Key Features

- 🎨 **Modern UI**: Material-UI components with custom design system
- 🌐 **Multi-language**: Full support for Turkish and English
- 🔍 **Advanced Search**: Semantic search with filters and sorting
- 📊 **Data Visualization**: Charts and graphs for publication trends
- 🔐 **Authentication**: OAuth2 with Google and GitHub
- 📱 **Responsive**: Mobile-first responsive design
- ⚡ **Fast**: Optimized with Vite for lightning-fast development and builds
- 🎯 **User Dashboard**: Personalized dashboard with saved searches and scholars

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                      │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Pages      │  │  Components  │  │   Contexts   │   │
│  │              │  │              │  │              │   │
│  │ - HomePage   │  │ - Header     │  │ - Auth       │   │
│  │ - Search     │  │ - Footer     │  │ - Language   │   │
│  │ - Profile    │  │ - UI Kit     │  │              │   │
│  │ - Dashboard  │  │              │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │   API Service    │                     │
│                  │   (api.ts)      │                     │
│                  └────────┬────────┘                     │
└───────────────────────────┼───────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
                  ┌─────────▼─────────┐
                  │   Backend API      │
                  │   (FastAPI)        │
                  └────────────────────┘
```

## 📦 Requirements

- **Node.js**: 18.0 or higher
- **pnpm**: Package manager (or npm/yarn)
- **Backend API**: Running Hivemind API backend

## 🚀 Installation

### 1. Clone and Navigate

```bash
git clone https://github.com/Hivemind-Devs/scholar.git
cd Frontend
```

### 2. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 3. Configure API Endpoint

Update the API base URL in `src/utils/api.ts` if needed:

```typescript
private baseUrl = 'http://localhost:8000'; // Change if backend is on different host/port
```

### 4. Run Development Server

```bash
pnpm dev
```

Or with npm:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port shown in terminal)

## 🏗️ Build for Production

```bash
pnpm build
```

Or with npm:
```bash
npm run build
```

The production build will be in the `dist/` directory.

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
docker build -t hivemind-frontend .
docker run -p 80:80 hivemind-frontend
```

## 📁 Project Structure

```
Frontend/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── SearchResults.tsx
│   │   ├── ScholarProfile.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── api.ts        # API client
│   │   └── similarity.ts
│   ├── styles/           # Global styles
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

## 🎨 UI Components

The application uses a combination of:
- **Material-UI (MUI)**: Core component library
- **Radix UI**: Accessible component primitives
- **Custom Components**: Built on top of Radix UI with Tailwind CSS

### Component Library

Located in `src/components/ui/`, includes:
- Buttons, Inputs, Forms
- Dialogs, Modals
- Cards, Badges
- Charts (using Recharts)
- Navigation components

## 🌐 Internationalization

The application supports multiple languages:
- **English** (default)
- **Turkish**

Language switching is handled through `LanguageContext` and can be toggled via the header.

## 🔐 Authentication

### Supported Methods

1. **Email/Password**: Traditional authentication
2. **Google OAuth**: Sign in with Google
3. **GitHub OAuth**: Sign in with GitHub

### User Features

- User registration and login
- Password reset via email
- Profile management
- Saved scholars and searches
- Personal dashboard

## 📄 Pages

### HomePage
Landing page with search functionality and featured content.

### SearchResults
Advanced search interface with:
- Semantic search
- Filters (university, department, research area)
- Sorting options
- Pagination

### ScholarProfile
Detailed academic profile showing:
- Personal information
- Education history
- Publications and trends
- Research areas
- Collaboration network

### Dashboard
User dashboard with:
- Saved scholars
- Saved searches
- Recommendations
- Recent activity

### AdminPanel
Admin interface for content management (admin users only).

## 🎯 Key Features

### Search & Discovery
- Semantic search using vector embeddings
- Advanced filtering options
- Saved searches
- Search history

### Academic Profiles
- Comprehensive scholar information
- Publication trends visualization
- Collaboration graphs
- Research area analysis

### Recommendations
- AI-powered supervisor matching
- Personalized recommendations
- Similar scholars suggestions

## 🛠️ Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting (if configured)

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.tsx`
4. Add API methods in `src/utils/api.ts`
5. Update translations in `src/contexts/LanguageContext.tsx`

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📦 Dependencies

### Core
- **react** (^18.3.1): React library
- **react-dom** (^18.3.1): React DOM
- **react-router-dom**: Routing
- **typescript**: TypeScript support

### UI Libraries
- **@mui/material**: Material-UI components
- **@mui/icons-material**: Material icons
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS

### Utilities
- **axios**: HTTP client (if used)
- **recharts**: Chart library
- **sonner**: Toast notifications
- **react-hook-form**: Form handling

## 🐳 Docker

The project includes Docker configuration for easy deployment:

```bash
# Build
docker build -t hivemind-frontend .

# Run
docker run -p 80:80 hivemind-frontend
```

Or use docker-compose (if provided).

## 🧪 Testing

Testing setup can be added with:
- **Vitest**: Unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

**Hivemind Devs**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend API is running
   - Check API base URL in `src/utils/api.ts`
   - Check CORS settings in backend

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version (18+)
   - Verify all dependencies are installed

3. **OAuth Issues**
   - Verify OAuth credentials in backend
   - Check redirect URLs configuration

---

For more information, visit the [main project README](../README.md).
