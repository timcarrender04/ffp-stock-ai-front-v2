# ⚡ Quick Deploy Guide - 5 Minutes

Your FFP Stock AI Frontend is **production-ready**. Here's how to deploy it now.

---

## 🎯 Option 1: Deploy to Portainer (Recommended)

### If you just have Docker running locally:

```bash
# 1. Verify Docker image exists
docker images | grep ffp-stock-ai-frontend

# 2. Test it works locally
docker run -d \
  --name ffp-test \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_supabase_url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key" \
  ffp-stock-ai-frontend:latest

# 3. Check if it's running
curl http://localhost:3000

# 4. Stop test container
docker stop ffp-test
docker rm ffp-test
```

### In Portainer UI:

1. **Open Portainer** → `http://your-server:9000`
2. **Containers** → **Create Container**
3. **Fill in these fields:**
   - **Name**: `ffp-stock-ai-frontend`
   - **Image**: `ffp-stock-ai-frontend:latest`
   - **Port mapping**: `3000:3000`
   - **Environment**:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     NEXT_PUBLIC_API_URL=http://your-backend:8000
     NODE_ENV=production
     ```
   - **Restart**: Always
4. **Click Deploy** ✅

**Done!** Your frontend is now running on `http://your-server:3000`

---

## 🌐 Option 2: Push to GitHub & Deploy

### Step 1: Push code (Choose one)

**Via Command Line:**
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/ffp-stock-ai-front-v2.git

# Rename to main branch (optional but recommended)
git branch -M main

# Push!
git push -u origin main
```

**Or use the helper script:**
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
bash PUSH_TO_GIT.sh
```

### Step 2: Verify on GitHub
- Visit `https://github.com/YOUR_USERNAME/ffp-stock-ai-front-v2`
- Confirm 75 files are there ✅

### Step 3: Deploy via Portainer
Same as Option 1 above ⬆️

---

## 📦 Option 3: Push Docker Image to Registry

### If you want to store the image in Docker Hub:

```bash
# 1. Login to Docker Hub
docker login

# 2. Tag image
docker tag ffp-stock-ai-frontend:latest YOUR_USERNAME/ffp-stock-ai-frontend:latest

# 3. Push to Docker Hub
docker push YOUR_USERNAME/ffp-stock-ai-frontend:latest

# 4. In Portainer, use this image:
# YOUR_USERNAME/ffp-stock-ai-frontend:latest
```

---

## ✨ Complete Deployment Flow (Fastest)

**Total time: ~5 minutes**

```bash
# 1. Test locally (30 seconds)
docker-compose up -d
curl http://localhost:3000
docker-compose down

# 2. Push to git (1 minute)
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
git remote add origin https://github.com/YOUR_USERNAME/ffp-stock-ai-front-v2.git
git push -u origin main

# 3. Deploy to Portainer (2-3 minutes)
# Open Portainer UI, create container, set env vars, deploy

# Done! ✅
```

---

## 🔗 What You Need

### For GitHub Push:
- GitHub username
- GitHub repository URL

### For Portainer Deployment:
- Portainer URL
- Supabase URL
- Supabase anon key
- Backend API URL (optional)

### For Docker Hub:
- Docker Hub username
- Docker Hub password

---

## ⚠️ Important Environment Variables

**These MUST be set for the app to work:**

```env
# REQUIRED - Get from Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# OPTIONAL - Your backend API
NEXT_PUBLIC_API_URL=http://your-backend-api:8000
```

Get these from:
- **Supabase**: https://app.supabase.com → Settings → API
- **Backend**: Whatever URL your backend API is running on

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Container is running: `docker ps | grep ffp-stock`
- [ ] Health check passes: `curl http://localhost:3000`
- [ ] Login page loads: Visit `http://your-server:3000/login`
- [ ] No errors: `docker logs ffp-stock-ai-frontend`
- [ ] API working: Check browser console for Supabase connection
- [ ] Responsive: Test on mobile

---

## 🚀 Status Check

**Current State:**
```
✅ Git repo initialized
✅ Docker image built (952MB)
✅ All docs created
✅ Ready to push & deploy
```

**Just Need:**
1. Your Git remote URL (GitHub/GitLab)
2. Your Supabase credentials
3. 5 minutes

---

## 🆘 Troubleshooting

### Container won't start?
```bash
# Check logs
docker logs ffp-stock-ai-frontend

# Common issue: Missing env vars
# Solution: Add all required vars in Portainer
```

### Health check failing?
```bash
# Test manually
curl -v http://localhost:3000

# Should return 200 OK
```

### Can't connect to Supabase?
```bash
# Verify env vars
docker inspect ffp-stock-ai-frontend | grep SUPABASE

# Test URL directly
curl $NEXT_PUBLIC_SUPABASE_URL
```

---

## 📞 Next Steps

**Choose one and tell me your details:**

1. **Deploy locally** (test only)
   - `docker-compose up -d`

2. **Push to GitHub & Deploy**
   - Provide: GitHub username
   - I'll show you the exact commands

3. **Push to GitLab & Deploy**
   - Provide: GitLab username
   - I'll show you the exact commands

4. **Push Docker image to registry**
   - Provide: Docker Hub username
   - I'll show you the exact commands

5. **All of the above**
   - Provide all credentials
   - I'll execute everything

---

**Ready? Tell me which option and provide the necessary details! 🚀**

