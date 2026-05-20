#!/bin/bash
set -e

# Only run initialization if INIT_DB is set to "true"
if [ "$INIT_DB" = "true" ] && [ ! -f /app/.db-initialized ]; then
  echo "🔧 Running database initialization..."
  node scripts/init-db.js
  npm run seed
  touch /app/.db-initialized
  echo "✅ Database initialization complete"
fi

# Start the server
exec "$@"
