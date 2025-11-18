#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

PORT=4085
ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE for local dev..."
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠️  Warning: .env not found. Dev server will start without docker-mirroring env vars."
fi

echo "Checking if port $PORT is in use..."

# Try multiple methods to find and kill processes using the port
KILLED=false

# Method 1: Using fuser (works for both IPv4 and IPv6)
if command -v fuser &> /dev/null; then
  echo "Trying fuser method..."
  if fuser -k $PORT/tcp 2>/dev/null; then
    KILLED=true
  fi
fi

# Method 2: Using lsof
if command -v lsof &> /dev/null; then
  echo "Trying lsof method..."
  PIDS=$(lsof -ti:$PORT 2>/dev/null)
  if [ ! -z "$PIDS" ]; then
    echo "Found processes: $PIDS"
    for PID in $PIDS; do
      echo "Killing process $PID..."
      if kill -9 "$PID" 2>/dev/null; then
        KILLED=true
      fi
    done
  fi
fi

# Method 3: Using netstat and grep (fallback)
if command -v netstat &> /dev/null; then
  echo "Trying netstat method..."
  PIDS=$( { netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1 | grep -v '-'; } || true )
  if [ ! -z "$PIDS" ]; then
    echo "Found processes: $PIDS"
    for PID in $PIDS; do
      echo "Killing process $PID..."
      if kill -9 "$PID" 2>/dev/null; then
        KILLED=true
      fi
    done
  fi
fi

if [ "$KILLED" = true ]; then
  echo "Waiting for port to be released..."
  sleep 2
  echo "Port should now be available"
else
  echo "No processes found using port $PORT (or already killed)"
fi

echo "Starting development server on port $PORT..."
npx next dev --turbopack --port $PORT

