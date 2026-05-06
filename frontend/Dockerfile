# ── Stage 1: Development / serve via Vite ──────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server (accessible outside container)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
