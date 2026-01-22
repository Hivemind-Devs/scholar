# Scraper Worker

> RabbitMQ-based web scraper worker system for collecting academic data from YÖK Academic Portal

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 📋 Overview

The Scraper Worker is a distributed system designed to collect academic information from the YÖK (Council of Higher Education) Academic Portal. It uses RabbitMQ message queues to distribute scraping tasks across multiple workers, performs web scraping operations, and stores results in a PostgreSQL database.

### Key Features

- 🔄 **Distributed Processing**: RabbitMQ-based task distribution
- 👷 **Dual Workers**: Separate workers for scholar lists and detailed profiles
- 🔒 **Proxy Support**: Rotating proxy support to handle rate limiting
- 🔁 **Auto Reconnection**: Automatic reconnection for RabbitMQ connections
- 📝 **Comprehensive Logging**: Detailed logging of all operations
- 🎯 **Error Handling**: Robust error handling and retry mechanisms
- 📊 **Progress Tracking**: Track scraping progress and statistics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    RabbitMQ Queue                        │
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  scholar_tasks  │      │  profile_tasks   │         │
│  └────────┬─────────┘      └────────┬─────────┘         │
└───────────┼──────────────────────────┼───────────────────┘
            │                          │
            │                          │
    ┌───────▼────────┐        ┌───────▼────────┐
    │ Scholar Worker │        │ Profile Worker │
    │                │        │                │
    │ - Scrapes      │        │ - Scrapes      │
    │   department   │        │   detailed     │
    │   pages        │        │   profiles     │
    │ - Extracts     │        │ - Extracts     │
    │   scholar list │        │   all details  │
    └───────┬────────┘        └───────┬────────┘
            │                         │
            │                         │
            └──────────┬──────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              │    Database     │
              └─────────────────┘
```

### Workflow

1. **Scholar Worker** receives department URLs from the queue
2. Scrapes department pages to extract scholar lists
3. Creates or updates scholar records in the database
4. Sends detailed scraping tasks to **Profile Worker** queue
5. **Profile Worker** scrapes individual profile pages
6. Extracts comprehensive details (publications, education, etc.)
7. Updates database with complete scholar information

## ✨ Features

- ✅ RabbitMQ message queue integration
- ✅ Two worker types (Scholar and Profile)
- ✅ Proxy rotation support
- ✅ PostgreSQL database integration
- ✅ Automatic retry mechanism
- ✅ Daily rotating log files
- ✅ Environment-based configuration (development/production)
- ✅ Cookie and session management
- ✅ Automatic pagination handling
- ✅ Rate limiting protection

## 🚀 Installation

### Prerequisites

- **Node.js**: v14 or higher
- **PostgreSQL**: Database server
- **RabbitMQ**: Message queue server

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hivemind-Devs/scholar.git
   cd Scraper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create configuration files:**
   ```bash
   # Copy example files
   cp bin/config.development.json.example bin/config.development.json
   cp bin/config.production.json.example bin/config.production.json
   ```

4. **Edit configuration files:**
   - Update database connection settings in `bin/config.{env}.json`
   - Configure RabbitMQ connection details
   - Set queue prefixes for your environment

5. **Add proxy list (optional):**
   - Edit `services/proxy.service/proxies.json` to add your proxy list
   - Leave empty array `[]` if not using proxies

## ⚙️ Configuration

### Configuration File Structure

```json
{
  "postgresConfig": {
    "master": {
      "user": "your-db-user",
      "host": "your-db-host",
      "database": "your-database",
      "password": "your-db-password",
      "port": 5432,
      "max": 1000,
      "idleTimeoutMillis": 300000,
      "ssl": {
        "rejectUnauthorized": false
      }
    }
  },
  "rabbitMQConnection": {
    "host": "your-rabbitmq-host",
    "port": 5672,
    "username": "your-rabbitmq-username",
    "password": "your-rabbitmq-password",
    "queuePrefix": "Hivemind@development"
  }
}
```

### Proxy Configuration

Edit `services/proxy.service/proxies.json`:

```json
[
  {
    "protocol": "http",
    "host": "proxy1.example.com",
    "port": 8080,
    "auth": {
      "username": "user",
      "password": "pass"
    }
  }
]
```

Leave as empty array `[]` to disable proxy usage.

## 💻 Usage

### Development Environment

```bash
npm run dev
```

or

```bash
node index.js --env=development
```

### Production Environment

```bash
npm start
```

or

```bash
node index.js --env=production
```

## 📁 Project Structure

```
Scraper/
├── bin/                          # Configuration files
├── data-access/                 # Database access layer
├── scrapers/                    # Scraper modules
├── services/                    # Service modules
│   ├── logger.service/          # Winston logger service
│   ├── proxy.service/           # Proxy management service
│   └── rabbit.service/          # RabbitMQ service
│       └── consumer/            # Worker consumers
├── logs/                        # Log files (auto-generated)
├── index.js                     # Main entry point
└── package.json                 # Project dependencies
```

## 👷 Workers

### Scholar Worker

**Responsibilities:**
- Scrapes department pages to extract scholar lists
- Saves basic scholar information to database
- Sends detailed scraping tasks to Profile Worker queue

**Configuration:**
- Queue: `{queuePrefix}:scholar_tasks`
- Prefetch: 5 (concurrent processing count)

### Profile Worker

**Responsibilities:**
- Scrapes individual scholar profile pages
- Visits all sub-pages (publications, courses, theses, etc.)
- Saves comprehensive details to database

**Configuration:**
- Queue: `{queuePrefix}:profile_tasks`
- Prefetch: 15 (concurrent processing count)

## 📦 Dependencies

### Core Dependencies

- **amqplib** (^0.10.9): RabbitMQ client library
- **axios** (^1.13.2): HTTP client for requests
- **cheerio** (^1.1.2): HTML parsing and manipulation
- **got** (^14.6.5): HTTP client for scraping
- **pg** (^8.16.3): PostgreSQL client
- **winston** (^3.19.0): Logging framework
- **winston-daily-rotate-file** (^5.0.0): Daily log rotation

## 🔧 Development

### Logging

Logs are saved to `logs/` directory with daily rotation:
- Structure: `logs/YYYY/MM/DD/application-YYYY-MM-DD.log`
- `current.log` symlink points to the most recent log file
- Logs are retained for 14 days

### Error Handling

- Worker errors are logged and messages are re-queued (nack)
- Successful operations are acknowledged (ack)
- Proxy errors release the proxy for reuse
- Automatic retry for transient failures

## 📝 Notes

- Proxy usage is optional; direct connection is used if no proxies are configured
- SSL certificate verification is disabled (for YÖK site compatibility)
- Cookie jar is recreated for each scraping operation
- Delays are added between page requests (rate limiting protection)
- Workers automatically reconnect to RabbitMQ on connection loss

## 🐛 Troubleshooting

### Common Issues

1. **RabbitMQ Connection Failed**
   - Check RabbitMQ server is running
   - Verify connection credentials in config
   - Check network connectivity

2. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

3. **Scraping Failures**
   - Check network connectivity
   - Verify YÖK portal is accessible
   - Review proxy configuration if using proxies
   - Check logs for specific error messages

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

**Hivemind Devs**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

For more information, visit the [main project README](../README.md).
