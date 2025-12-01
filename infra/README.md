# DingleUP! Infrastructure

Docker-based deployment infrastructure for self-hosting DingleUP!.

## 🐳 Docker Stack

The application runs as a multi-container Docker stack:

- **Database**: PostgreSQL 15 with PostGIS
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Frontend**: React SPA served by Nginx
- **Reverse Proxy**: Nginx (SSL termination, caching, routing)

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name (for production)
- SSL certificates (for production)

### Local Development

```bash
# Clone repository
git clone <repo-url>
cd dingleup/infra

# Copy environment files
cp ../backend/.env.example ../backend/.env
cp ../frontend/.env.example ../frontend/.env

# Edit .env files with your configuration

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 54321 | http://localhost:54321 |
| Database | 5432 | postgresql://localhost:5432/dingleup |
| Nginx | 80, 443 | http://localhost |

## 📁 Files

```
infra/
├── docker-compose.yml          # Multi-container orchestration
├── Dockerfile.frontend         # Frontend build
├── Dockerfile.backend          # Backend (Deno) build
├── nginx.conf                  # Nginx reverse proxy config
├── .dockerignore               # Docker build exclusions
└── README.md                   # This file
```

## 🔧 Configuration

### docker-compose.yml

Main orchestration file. Defines:
- Service dependencies
- Volume mounts
- Network configuration
- Environment variables
- Health checks
- Restart policies

### Environment Variables

**Database:**
```yaml
POSTGRES_PASSWORD: your-secure-password
POSTGRES_DB: dingleup
POSTGRES_USER: postgres
```

**Backend:**
- See `backend/.env.example`

**Frontend:**
- See `frontend/.env.example`

### Volumes

```yaml
volumes:
  postgres_data:       # Database persistent storage
  uploads:             # User uploads (if applicable)
```

## 🌐 Production Deployment

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clone Repository

```bash
git clone <repo-url> /var/www/dingleup
cd /var/www/dingleup
```

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
# Set production values:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET

# Frontend
cp frontend/.env.example frontend/.env
nano frontend/.env
# Set production values:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_STRIPE_PUBLISHABLE_KEY

# Database
nano infra/.env.db
# Set secure database password
```

### 4. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com

# Update nginx.conf with certificate paths
```

#### Option B: Custom Certificates

```bash
# Copy certificates to infra/ssl/
mkdir -p infra/ssl
cp your-cert.crt infra/ssl/
cp your-key.key infra/ssl/

# Update nginx.conf
```

### 5. Update nginx.conf

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

### 6. Build and Deploy

```bash
cd infra

# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 7. Initialize Database

```bash
# Copy schema to container
docker cp ../db/schema_latest.sql dingleup-db:/tmp/

# Load schema
docker exec -i dingleup-db psql -U postgres -d dingleup -f /tmp/schema_latest.sql

# Verify
docker exec -i dingleup-db psql -U postgres -d dingleup -c "\dt"
```

### 8. Verify Deployment

```bash
# Check frontend
curl https://yourdomain.com

# Check backend
curl https://yourdomain.com/functions/v1/health

# Check database
docker exec dingleup-db psql -U postgres -d dingleup -c "SELECT count(*) FROM profiles;"
```

## 📊 Monitoring

### Docker Stats

```bash
# Resource usage
docker stats

# Logs
docker-compose logs -f [service-name]

# Inspect container
docker inspect dingleup-frontend
```

### Application Logs

```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f db
```

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3000/health
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build

# Restart services (zero-downtime)
docker-compose up -d --no-deps --build frontend
docker-compose up -d --no-deps --build backend
```

### Database Migrations

```bash
# Run new migration
docker cp new-migration.sql dingleup-db:/tmp/
docker exec dingleup-db psql -U postgres -d dingleup -f /tmp/new-migration.sql
```

### Backup Database

```bash
# Create backup
docker exec dingleup-db pg_dump -U postgres dingleup > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i dingleup-db psql -U postgres -d dingleup < backup-20240131.sql
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (DANGER: deletes data)
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## 🔒 Security

### Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct database access
sudo ufw deny 5432/tcp

# Enable firewall
sudo ufw enable
```

### Environment Variables

- Never commit `.env` files
- Use secrets management in production
- Rotate credentials regularly

### SSL

- Use Let's Encrypt for free SSL
- Enable HSTS headers
- Use strong cipher suites

### Database

- Use strong passwords
- Enable SSL for database connections
- Regular backups
- Restrict database access to backend only

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose.yml
services:
  frontend:
    deploy:
      replicas: 3
  backend:
    deploy:
      replicas: 5
```

### Load Balancing

Add load balancer service:

```yaml
services:
  loadbalancer:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

### Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling (PgBouncer)
- Partitioning large tables

## 🐛 Troubleshooting

### Frontend Not Loading

```bash
# Check container status
docker-compose ps frontend

# View logs
docker-compose logs frontend

# Restart container
docker-compose restart frontend
```

### Backend Errors

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep SUPABASE
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec backend psql -h db -U postgres -d dingleup

# Check network
docker network inspect infra_default
```

### SSL Issues

```bash
# Verify certificates
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Restart nginx
docker-compose restart nginx
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Let's Encrypt](https://letsencrypt.org/)
