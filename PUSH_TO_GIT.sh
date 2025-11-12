#!/bin/bash

# FFP Stock AI Frontend - Git Push Script
# This script helps you push your code to GitHub or GitLab

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FFP Stock AI Frontend - Git Push Helper${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Git repository not found!${NC}"
    echo "Run 'git init' first"
    exit 1
fi

# Display current status
echo -e "${YELLOW}Current Status:${NC}"
git status --short | head -5
echo ""

# Ask which platform to use
echo -e "${YELLOW}Which platform do you want to push to?${NC}"
echo "1) GitHub"
echo "2) GitLab"
echo "3) Custom URL"
read -p "Choose (1/2/3): " choice

case $choice in
    1)
        echo -e "${BLUE}GitHub Setup${NC}"
        read -p "Enter your GitHub username: " username
        repo_url="https://github.com/$username/ffp-stock-ai-front-v2.git"
        ;;
    2)
        echo -e "${BLUE}GitLab Setup${NC}"
        read -p "Enter your GitLab username: " username
        repo_url="https://gitlab.com/$username/ffp-stock-ai-front-v2.git"
        ;;
    3)
        echo -e "${BLUE}Custom URL${NC}"
        read -p "Enter your repository URL: " repo_url
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Repository URL: ${NC}$repo_url"
echo ""

# Check if remote already exists
if git remote | grep -q "origin"; then
    echo -e "${YELLOW}Remote 'origin' already exists:${NC}"
    git remote -v
    read -p "Do you want to replace it? (y/n): " replace
    if [ "$replace" = "y" ]; then
        git remote remove origin
        echo -e "${GREEN}Remote removed${NC}"
    else
        echo "Using existing remote"
        repo_url=$(git remote get-url origin)
    fi
fi

echo ""
echo -e "${BLUE}Adding remote...${NC}"
git remote add origin "$repo_url"
echo -e "${GREEN}✓ Remote added${NC}"

echo ""
echo -e "${BLUE}Checking current branch...${NC}"
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"

# Ask to rename branch if it's master
if [ "$current_branch" = "master" ]; then
    read -p "Rename 'master' to 'main'? (y/n): " rename
    if [ "$rename" = "y" ]; then
        git branch -M main
        echo -e "${GREEN}✓ Branch renamed to main${NC}"
        current_branch="main"
    fi
fi

echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  Remote: origin → $repo_url"
echo "  Branch: $current_branch"
echo "  Commits: $(git rev-list --count HEAD)"
echo ""

# Ask for confirmation
read -p "Ready to push? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Push cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}Pushing to remote...${NC}"
git push -u origin "$current_branch"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Push successful!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Visit your repository: $repo_url"
echo "2. Verify files are uploaded"
echo "3. Deploy via Portainer using image: ffp-stock-ai-frontend:latest"
echo ""


