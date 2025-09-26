# GitHub CRM - Project Management System

A full-stack application for managing GitHub repositories with user authentication, background job processing, and real-time data synchronization.

## 🚀 Features

- **User Authentication**: Register and login with email/password
- **GitHub Integration**: Add repositories by path (e.g., `facebook/react`)
- **Background Processing**: Fetch GitHub data asynchronously using Bull/Redis
- **Real-time Updates**: Refresh repository statistics on demand
- **PostgreSQL Database**: Robust data storage with TypeORM
- **Docker Support**: Easy deployment with Docker Compose

## 🛠 Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React.js, TypeScript, Axios
- **Database**: PostgreSQL with TypeORM
- **Queue System**: Bull with Redis
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Git

## 🚀 Quick Start with Docker

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fsd-test-uni-group
   ```

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

3. **Check if services are running**:
   ```bash
   docker-compose ps
   ```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

**Note**: The Docker setup includes all necessary environment variables. No additional configuration is required for basic usage.

## 🔧 Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   
3. **Start PostgreSQL and Redis**:
   ```bash
   docker-compose up postgres redis -d
   ```

4. **Run backend in development mode**:
   ```bash
   npm run dev:ts
   ```

5. **Run frontend in development mode** (in a separate terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Projects
- `GET /api/projects` - Get user's projects (requires auth)
- `POST /api/projects` - Add new repository (requires auth)
- `GET /api/projects/:id` - Get specific project (requires auth)
- `PUT /api/projects/:id` - Refresh project data (requires auth)
- `DELETE /api/projects/:id` - Delete project (requires auth)

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Add Repository
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"repoPath": "facebook/react"}'
```

### Get Projects
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `password` |
| `DB_NAME` | PostgreSQL database name | `github_crm` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `GITHUB_TOKEN` | GitHub API token (optional) | - |

## 📊 Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password_hash`
- `created_at`
- `updated_at`

### Projects Table
- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `owner` (GitHub repository owner)
- `name` (Repository name)
- `url` (Repository URL)
- `stars` (Star count)
- `forks` (Fork count)
- `open_issues` (Open issues count)
- `github_created_at` (Unix timestamp from GitHub)
- `github_data` (JSONB - Full GitHub API response)
- `last_updated_from_github`
- `created_at`
- `updated_at`

## 🔄 Background Jobs

The application uses Bull queues for background processing:

1. **Repository Addition**: When a user adds a repository, it's immediately saved to the database
2. **GitHub Data Fetching**: A background job fetches complete data from GitHub API
3. **Data Update**: The repository record is updated with GitHub statistics
4. **Error Handling**: Failed jobs are retried automatically

## 🚨 Error Handling

- **Invalid Repository**: Returns 404 if GitHub repository doesn't exist
- **Duplicate Repository**: Returns 409 if repository is already added
- **Rate Limiting**: Handles GitHub API rate limits gracefully
- **Authentication**: Returns 401 for invalid/expired tokens
- **Validation**: Returns 400 for invalid input data

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## 🧪 Testing

The application includes health checks and error handling. Test the API using:

1. **Health Check**: `GET /health`
2. **Registration Flow**: Register → Login → Add Repository → View Projects
3. **Background Processing**: Add repository and watch logs for job processing

## 🔧 Development Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run dev` - Development mode with auto-reload
- `npm run dev:ts` - Development mode with ts-node

## 📈 Monitoring

- **Health Endpoint**: `/health` - Check service status
- **Logs**: Use `docker-compose logs -f` to monitor application logs
- **Queue Status**: Background job processing is logged to console

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: GitHub API rate limit handling
- **Error Sanitization**: No sensitive data in error responses

## 📝 Next Steps

For a complete full-stack application, consider adding:

1. **Frontend**: React.js application
2. **Testing**: Unit and integration tests
3. **Monitoring**: Application performance monitoring
4. **CI/CD**: Automated deployment pipeline
5. **Documentation**: API documentation with Swagger
