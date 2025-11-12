# Git Setup & Push Instructions

## ✅ What's Been Done

- ✅ Git initialized
- ✅ Git user configured (ERt, ert@example.com)
- ✅ Initial commit created
- ✅ 75 files tracked
- ✅ Docker files included
- ✅ Documentation included

### Commit Info
```
Commit: c95a16b
Author: ERt <ert@example.com>
Message: 🚀 Initial commit: FFP Stock AI Frontend - Production Ready
```

---

## 🚀 Push to Remote Repository

### Option 1: GitHub

**Step 1: Create a repository on GitHub**
1. Go to https://github.com/new
2. Enter repository name: `ffp-stock-ai-front-v2`
3. Choose visibility (Public/Private)
4. Click "Create repository"

**Step 2: Add remote and push**
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/ffp-stock-ai-front-v2.git

# Rename branch to main (optional but recommended)
git branch -M main

# Push to remote
git push -u origin main
```

### Option 2: GitLab

**Step 1: Create a project on GitLab**
1. Go to https://gitlab.com/projects/new
2. Enter project name: `ffp-stock-ai-front-v2`
3. Choose visibility
4. Click "Create project"

**Step 2: Add remote and push**
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Add remote
git remote add origin https://gitlab.com/YOUR_USERNAME/ffp-stock-ai-front-v2.git

# Rename branch to main (optional)
git branch -M main

# Push to remote
git push -u origin main
```

### Option 3: Gitea or Self-hosted

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Add remote (replace with your server URL)
git remote add origin https://your-gitea-server.com/YOUR_USERNAME/ffp-stock-ai-front-v2.git

# Push to remote
git push -u origin master
```

---

## 📋 Current Git Status

```
Branch: master (rename to main recommended)
Commits: 1
Files tracked: 75
```

### View commit history
```bash
git log --oneline --graph --all
```

### View tracked files
```bash
git ls-tree -r HEAD --name-only | head -20
```

---

## 🔧 Common Git Commands

### Before Pushing
```bash
# Check status
git status

# View changes
git diff

# View commit log
git log --oneline

# View specific commit
git show HEAD
```

### Pushing
```bash
# Push to origin (already set up remote)
git push -u origin master

# Or if you renamed to main
git push -u origin main

# Push all branches
git push -u origin --all
```

### Creating branches
```bash
# Create feature branch
git checkout -b feature/new-feature

# Push feature branch
git push -u origin feature/new-feature
```

### Making changes
```bash
# Stage changes
git add .

# Or stage specific files
git add path/to/file

# Commit
git commit -m "feat: description of change"

# Push
git push
```

---

## 📝 Recommended Workflow

1. **Setup remote** (one time):
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

2. **For new features**:
   ```bash
   git checkout -b feature/feature-name
   # Make changes
   git add .
   git commit -m "feat: your message"
   git push -u origin feature/feature-name
   ```

3. **Create Pull Request** on GitHub/GitLab

4. **Merge to main** after review

---

## 🔐 SSH vs HTTPS

### HTTPS (Easier)
- No setup needed
- Prompt for password each time (or use Git Credential Manager)
- Example: `https://github.com/user/repo.git`

### SSH (Recommended)
- More secure
- Requires SSH key setup
- Example: `git@github.com:user/repo.git`

#### Setup SSH (GitHub)
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "ert@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to GitHub
cat ~/.ssh/id_ed25519.pub
# Then paste in GitHub Settings → SSH Keys
```

---

## 🚨 Important Notes

### .env file
⚠️ **DO NOT commit .env files!**
- Already in .gitignore ✅
- Contains secrets and API keys
- Keep locally only

### node_modules
✅ **Already ignored**
- Users will run `npm install` to get dependencies
- Reduces repository size

### .next build artifacts
✅ **Already ignored**
- Generated on build
- Not needed in repository

---

## ✨ Ready to Deploy!

Your frontend is now:
- ✅ Version controlled with Git
- ✅ Ready to push to remote
- ✅ Dockerized for production
- ✅ Fully documented

### Next Steps:
1. Choose hosting platform (GitHub, GitLab, etc.)
2. Create repository
3. Add remote: `git remote add origin <URL>`
4. Push: `git push -u origin main`
5. Deploy Docker image to Portainer

---

**Questions?**
- Check git status: `git status`
- View commits: `git log --oneline`
- View diff: `git diff`

