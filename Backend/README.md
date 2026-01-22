# Hivemind API Backend

> FastAPI-based backend service for the YÖK Academic Research Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 📋 Overview

The Hivemind API Backend is a high-performance, asynchronous REST API service built with FastAPI. It provides comprehensive endpoints for managing academic data, user authentication, search functionality, and AI-powered recommendations.

### Key Features

- 🚀 **High Performance**: Async/await architecture for optimal performance
- 🔍 **Vector Search**: Semantic search using pgvector and sentence transformers
- 🔐 **Secure Auth**: OAuth2 with JWT tokens, Google & GitHub OAuth
- 📧 **Email Service**: SMTP integration for password resets and notifications
- 📊 **Admin Panel**: Comprehensive admin endpoints for content management
- 🎯 **Recommendations**: ML-based recommendation system
- 📈 **Analytics**: Publication trends and collaboration analysis
- 🌐 **CORS Support**: Configurable CORS for frontend integration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Routes                           │
│  (auth, scholars, users, admin, scraper, etc.)          │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  Services Layer                          │
│  (User, Scholar, Recommendation, Email, etc.)           │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Repository Layer                            │
│  (Data Access Abstraction)                               │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  + pgvector extension for vector search                  │
└─────────────────────────────────────────────────────────┘
```

## 📦 Requirements

- **Python**: 3.9 or higher
- **PostgreSQL**: 12+ with pgvector extension
- **pip**: Python package manager
- **Playwright**: For browser automation (scraper features)

## 🚀 Installation

### 1. Clone and Navigate

```bash
git clone https://github.com/Hivemind-Devs/scholar.git
cd Backend
```

### 2. Create Virtual Environment

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Playwright Browsers

For scraper functionality:
```bash
playwright install
```

## ⚙️ Configuration

Configuration is managed through JSON files in the `config/` directory. Environment-specific files are used:

- `config.development.json`: Local development environment
- `config.production.json`: Production environment
- `config.stage.json`: Staging environment

### Setup Configuration Files

1. Copy the example files:
   ```bash
   cp config/config.development.json.example config/config.development.json
   cp config/config.production.json.example config/config.production.json
   cp config/config.stage.json.example config/config.stage.json
   ```

2. Edit the configuration files with your actual credentials:
   - Database connection string
   - SMTP settings
   - OAuth client IDs and secrets
   - Secret keys
   - CORS origins

### Environment Variable

Set the `APP_ENV` environment variable to select the configuration:

```bash
export APP_ENV=development  # or production, stage
```

Default is `development` if not set.

## 🗄️ Database Setup

### 1. Install PostgreSQL

Ensure PostgreSQL 12+ is installed and running.

### 2. Install pgvector Extension

The pgvector extension is required for vector similarity search:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 3. Create Database

```sql
CREATE DATABASE hivemind;
```

### 4. Database Tables

Tables are automatically created on first run using SQLAlchemy models. The application will handle schema creation.

## ▶️ Running the Application

### Development Mode (with auto-reload)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

The API will be available at `http://127.0.0.1:8000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Scalar API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

The API documentation uses Scalar UI, providing a modern and interactive interface for exploring endpoints, testing requests, and viewing detailed API schemas.

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/oauth/google` - Google OAuth
- `POST /auth/oauth/github` - GitHub OAuth
- `POST /auth/password-reset/request` - Request password reset
- `POST /auth/password-reset/verify` - Verify reset code
- `POST /auth/password-reset/complete` - Complete password reset

### Scholars
- `GET /scholars` - List scholars with filters
- `GET /scholars/{id}` - Get scholar details
- `GET /scholars/search` - Semantic search
- `GET /scholars/{id}/recommendations` - Get recommendations

### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update user profile
- `GET /users/me/saved-scholars` - Get saved scholars
- `POST /users/me/saved-scholars` - Save a scholar

### Universities
- `GET /universities` - List universities
- `GET /universities/{id}` - Get university details

### Admin
- `POST /admin/scraper/universities/all` - Scrape all universities
- `POST /admin/scraper/departments/all` - Scrape all departments
- `POST /admin/scraper/scholar/all` - Scrape all scholars
- `GET /admin/logs` - View system logs

## 📁 Project Structure

```
Backend/
├── app/
│   ├── api/
│   │   ├── routes/          # API route handlers
│   │   └── deps.py          # Dependency injection
│   ├── core/
│   │   ├── config.py        # Configuration management
│   │   └── security.py      # Security utilities
│   ├── data_access/
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── database.py      # Database connection
│   │   └── repositories/    # Data access layer
│   ├── services/            # Business logic
│   ├── schemas/             # Pydantic models
│   └── main.py              # Application entry point
├── config/                  # Configuration files
├── scripts/                 # Utility scripts
└── requirements.txt
```

## 🔐 Security Features

- **Password Hashing**: Argon2 algorithm
- **JWT Tokens**: Secure token-based authentication
- **OAuth2**: Google and GitHub integration
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries

## 📊 Vector Search

The platform uses vector embeddings for semantic search:

1. Scholar profiles are converted to embeddings using sentence transformers
2. Embeddings are stored in PostgreSQL using pgvector
3. Similarity search is performed using cosine distance
4. Results are ranked by relevance

### Generating Embeddings

Use the provided script to generate embeddings for existing scholars:

```bash
python scripts/generate_scholar_vectors.py
```

## 🐳 Docker Support

A Dockerfile and docker-compose.yml are provided for containerized deployment.

```bash
docker-compose up -d
```

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

**Hivemind Devs**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

For more information, visit the [main project README](../README.md).
