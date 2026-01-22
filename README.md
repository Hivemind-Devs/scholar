# YÖK Academic Research Intelligence Platform

> Turkey's most comprehensive academic research and supervisor discovery platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 📖 Overview

The YÖK Academic Research Intelligence Platform is a comprehensive system designed to democratize academic research in Turkey and help graduate students find the most suitable supervisors. The platform brings together data from over 50,000 Turkish academics with AI-powered search and recommendation systems.

### Key Features

- 🔍 **AI-Powered Search**: Semantic search using vector embeddings to find academics based on research interests
- 📊 **Comprehensive Profiles**: Detailed academic profiles including publications, education history, and research areas
- 🤖 **Smart Recommendations**: ML-based recommendation system to match students with suitable supervisors
- 🌐 **Multi-language Support**: Full support for Turkish and English
- 🔐 **Secure Authentication**: OAuth2 with Google and GitHub integration
- 📈 **Analytics Dashboard**: Publication trends, collaboration graphs, and research insights
- 🎯 **Advanced Filtering**: Filter by university, department, research area, and more

## 🏗️ Architecture

The platform consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│         React + TypeScript + Vite + Material-UI             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│     Python + FastAPI + PostgreSQL + Vector Search           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Database
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              PostgreSQL + pgvector                          │
│         Academic Data + Vector Embeddings                   │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │
                        │ Data Collection
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                  Scraper (Node.js)                          │
│         RabbitMQ + Web Scraping + Data Processing           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
.
├── Backend/          # FastAPI backend service
├── Frontend/         # React frontend application
├── Scraper/          # Node.js web scraper workers
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.9+, PostgreSQL 12+, Playwright
- **Frontend**: Node.js 18+, pnpm
- **Scraper**: Node.js 14+, RabbitMQ, PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hivemind-Devs/scholar.git
   cd scholar
   ```

2. **Set up Backend**
   ```bash
   cd Backend
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   playwright install
   ```

3. **Set up Frontend**
   ```bash
   cd Frontend
   pnpm install
   ```

4. **Set up Scraper**
   ```bash
   cd Scraper
   npm install
   ```

5. **Configure Environment**
   - Copy example config files and fill in your credentials
   - See individual component READMEs for detailed configuration

6. **Run the application**
   ```bash
   # Terminal 1: Backend
   cd Backend
   uvicorn app.main:app --reload

   # Terminal 2: Frontend
   cd Frontend
   pnpm dev

   # Terminal 3: Scraper (optional)
   cd Scraper
   npm run dev
   ```

## 📚 Documentation

- [Backend API Documentation](./Backend/README.md)
- [Frontend Documentation](./Frontend/README.md) (if available)
- [Scraper Documentation](./Scraper/README.md)
- API Docs: `http://localhost:8000/docs` (when backend is running)

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with pgvector extension
- **ORM**: SQLAlchemy (async)
- **Authentication**: OAuth2, JWT
- **AI/ML**: Sentence Transformers, Vector Search
- **Email**: SMTP with aiosmtplib

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **State Management**: React Context API
- **Charts**: Recharts

### Scraper
- **Runtime**: Node.js
- **Message Queue**: RabbitMQ
- **Scraping**: Cheerio, Axios, Got
- **Database**: PostgreSQL (pg)
- **Logging**: Winston

## 🔒 Security

- All secrets are stored in environment-specific config files (not in git)
- OAuth2 authentication with secure token handling
- KVKK (GDPR) compliant data handling
- Secure password hashing with Argon2
- CORS protection

## 📊 Features in Detail

### Search & Discovery
- Semantic search using vector embeddings
- Filter by university, department, research area
- Advanced search with multiple criteria
- Saved searches functionality

### Academic Profiles
- Comprehensive academic information
- Publication history and trends
- Education and career timeline
- Research interests and areas
- Collaboration networks

### Recommendations
- AI-powered supervisor matching
- Based on research interests similarity
- Personalized recommendations for users

### User Features
- User accounts with profiles
- Saved scholars and searches
- Dashboard with personalized content
- Admin panel for content management

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

**Hivemind Devs**

## 🙏 Acknowledgments

- YÖK (Council of Higher Education) for providing the academic data portal
- The academic community for their valuable feedback

## 📞 Contact & Support

For questions, issues, or contributions, please open an issue on GitHub or contact the development team.

---

**Note**: This platform is designed to help students find suitable academic supervisors and facilitate academic collaboration in Turkey. All data is collected from publicly available sources and used in compliance with applicable regulations.
