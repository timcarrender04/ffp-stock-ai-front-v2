# Docker Deployment Guide - FFP Stock AI Frontend

This guide covers deploying the Next.js frontend application using Docker and Portainer.

## 📋 Prerequisites

- Docker installed and running
- Docker Compose (optional, for local testing)
- Portainer (for remote management)
- Environment variables configured

---

## 🐳 Docker Configuration Files

### Dockerfile
- **Multi-stage build** for optimized image size
- **Alpine Linux** base image for smaller footprint
- **Non-root user** (nextjs) for security
- **Health checks** built-in for monitoring
- **Signal handling** with dumb-init

### .dockerignore
Excludes unnecessary files from Docker context:
- Node modules (installed fresh in container)
- Build artifacts
- Development files
- Git history
- Lock files

### docker-compose.yml
Local development and testing configuration with:
- Port mapping (3000:3000)
- Environment variables
- Health checks
- Logging configuration
- Network setup

---

## 🏗️ Building the Docker Image

### Option 1: Local Build
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Build the image
docker build -t ffp-stock-ai-frontend:latest .

# Or with a specific tag
docker build -t ffp-stock-ai-frontend:v1.0.0 .
```

### Option 2: Using Docker Compose
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Build image
docker-compose build

# Or build and start together
docker-compose up -d --build
```

---

## 🚀 Running Locally (Testing)

### Option 1: Docker Run
```bash
docker run -d \
  --name ffp-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key" \
  -e NEXT_PUBLIC_API_URL="http://localhost:8000" \
  ffp-stock-ai-frontend:latest
```

### Option 2: Docker Compose
```bash
# Create .env file first
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop the container
docker-compose down
```

### Verify it's running
```bash
curl http://localhost:3000
# Should return the Next.js homepage

# Check health
curl http://localhost:3000
```

---

## 🎯 Portainer Deployment

### Step 1: Create a .env file in Portainer
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_API_URL=http://your-backend-api:8000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Step 2: In Portainer UI
1. Go to **Containers** → **Create Container**
2. Fill in the following:
   - **Name**: `ffp-stock-ai-frontend`
   - **Image**: `ffp-stock-ai-frontend:latest`
   - **Port mapping**: 
     - Container: `3000`
     - Published: `3000` (or your desired port)
   - **Restart policy**: `Always`
   - **Env variables**: Add all variables from .env file
   - **Volumes** (optional): For logs or caching

### Step 3: Advanced Settings (Optional)
- **CPU/Memory limits**: Set appropriate limits
- **Logging driver**: json-file
- **Health check**: Already configured in Dockerfile
- **Network**: Connect to same network as backend

### Step 4: Deploy
Click **Deploy the container** and monitor the logs.

---

## 📊 Docker Image Specifications

### Image Size
- **Base Image**: node:20-alpine (~180 MB)
- **With dependencies**: ~300-400 MB
- **Final image**: Optimized for production

### Performance
- **Build time**: ~30-60 seconds (depends on dependencies)
- **Container startup**: ~2-5 seconds
- **Memory usage**: ~100-150 MB at rest
- **CPU usage**: Minimal when idle

### Security Features
- ✅ Non-root user (nextjs:1001)
- ✅ Health checks enabled
- ✅ Signal handling with dumb-init
- ✅ Read-only filesystem support (optional)
- ✅ No SSH or unnecessary packages

---

## 🔧 Environment Variables

### Required Variables
```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Optional Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Node Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Getting Environment Variables
1. From Supabase dashboard:
   - Settings → API
   - Copy the URL and anon key
2. Paste into your deployment configuration

---

## 📝 Docker Commands Reference

### Build
```bash
# Build image
docker build -t ffp-stock-ai-frontend:latest .

# Build with progress output
docker build --progress=plain -t ffp-stock-ai-frontend:latest .

# Build and tag multiple versions
docker build -t ffp-stock-ai-frontend:latest -t ffp-stock-ai-frontend:v1.0.0 .
```

### Run
```bash
# Run container
docker run -d -p 3000:3000 ffp-stock-ai-frontend:latest

# Run with environment variables
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="..." \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  ffp-stock-ai-frontend:latest

# Run with interactive terminal
docker run -it -p 3000:3000 ffp-stock-ai-frontend:latest /bin/sh
```

### Manage
```bash
# List images
docker images | grep ffp-stock-ai-frontend

# List containers
docker ps -a | grep ffp-stock-ai-frontend

# View logs
docker logs ffp-stock-ai-frontend
docker logs -f ffp-stock-ai-frontend  # Follow logs

# Stop container
docker stop ffp-stock-ai-frontend

# Remove container
docker rm ffp-stock-ai-frontend

# Remove image
docker rmi ffp-stock-ai-frontend:latest

# Access shell
docker exec -it ffp-stock-ai-frontend /bin/sh
```

### Debug
```bash
# Check health
docker inspect --format='{{json .State.Health}}' ffp-stock-ai-frontend

# View resource usage
docker stats ffp-stock-ai-frontend

# Check network
docker network inspect bridge
```

---

## 🐳 Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f frontend

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v

# View running services
docker-compose ps

# Execute command in container
docker-compose exec frontend /bin/sh
```

---

## 🚨 Troubleshooting

### Container exits immediately
```bash
# Check logs
docker logs ffp-stock-ai-frontend

# Common issue: Missing environment variables
# Solution: Ensure all NEXT_PUBLIC_* variables are set
```

### Port already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Use a different port
docker run -d -p 3001:3000 ffp-stock-ai-frontend:latest
```

### Build fails
```bash
# Clean build (remove cache)
docker build --no-cache -t ffp-stock-ai-frontend:latest .

# Check available disk space
docker system df

# Prune unused images
docker system prune -a
```

### Health check failing
```bash
# Check if service is responding
curl -I http://localhost:3000

# Check container logs for errors
docker logs ffp-stock-ai-frontend

# Manual health check inside container
docker exec ffp-stock-ai-frontend wget --quiet --tries=1 --spider http://localhost:3000
```

### Performance issues
```bash
# Monitor resource usage
docker stats ffp-stock-ai-frontend

# Check logs for errors
docker logs -f ffp-stock-ai-frontend

# Increase memory limit (docker-compose)
# Add to services.frontend:
# mem_limit: 512m
# memswap_limit: 512m
```

---

## 📊 Monitoring

### Container Health
```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Or in Portainer: Dashboard → Containers → Health
```

### Logs
```bash
# Last 100 lines
docker logs --tail 100 ffp-stock-ai-frontend

# Last 1 hour
docker logs --since 1h ffp-stock-ai-frontend

# With timestamps
docker logs -t ffp-stock-ai-frontend
```

### Performance Metrics
```bash
# Real-time stats
docker stats ffp-stock-ai-frontend

# One-time snapshot
docker stats --no-stream ffp-stock-ai-frontend
```

---

## 🔐 Security Best Practices

1. **Use specific image tags** (not `latest`)
   ```bash
   docker run -d -p 3000:3000 ffp-stock-ai-frontend:v1.0.0
   ```

2. **Run as non-root** (already configured)
   ```bash
   # Verify
   docker exec ffp-stock-ai-frontend whoami
   # Should output: nextjs
   ```

3. **Limit resources** (in docker-compose or Portainer)
   ```yaml
   resources:
     limits:
       cpus: '0.5'
       memory: 512M
   ```

4. **Use environment variables** (not hard-coded)
   - Store secrets in Portainer secrets/env files
   - Never commit secrets to git

5. **Enable logging**
   - Review logs regularly for errors
   - Set up log rotation

---

## 📈 Scaling with Docker

### Horizontal Scaling
```bash
# Run multiple instances on different ports
docker run -d -p 3001:3000 --name frontend-1 ffp-stock-ai-frontend:latest
docker run -d -p 3002:3000 --name frontend-2 ffp-stock-ai-frontend:latest
docker run -d -p 3003:3000 --name frontend-3 ffp-stock-ai-frontend:latest

# Use a load balancer in front (nginx, HAProxy, etc.)
```

### Vertical Scaling
```bash
# Increase memory/CPU limits in Portainer UI
# Or in docker-compose:
resources:
  limits:
    cpus: '1.0'
    memory: 1024M
  reservations:
    cpus: '0.5'
    memory: 512M
```

---

## 🚀 Deployment Checklist

- [ ] Dockerfile created and tested
- [ ] .dockerignore configured
- [ ] docker-compose.yml ready
- [ ] Environment variables documented
- [ ] Local test successful (`docker-compose up`)
- [ ] Image built successfully
- [ ] Portainer configured
- [ ] Container deployed in Portainer
- [ ] Health checks passing
- [ ] Logs reviewed for errors
- [ ] API connectivity verified
- [ ] Performance baseline established

---

## 📞 Support

### Common Issues
- Check logs: `docker logs ffp-stock-ai-frontend`
- Verify environment: `docker inspect ffp-stock-ai-frontend`
- Test connectivity: `curl http://localhost:3000`

### Documentation
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Portainer Documentation](https://documentation.portainer.io/)

---

**Status**: ✅ Ready for Production Deployment  
**Last Updated**: November 12, 2025

