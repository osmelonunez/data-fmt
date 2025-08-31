# Stage 1: install dependencies
FROM node:24-alpine AS builder

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source
COPY backend .

# Final stage
FROM node:24-alpine

# Runtime dependencies
RUN apk add --no-cache jq

ENV NODE_ENV=production

WORKDIR /app

# Copy app from builder
COPY --from=builder /app/backend ./backend
COPY public ./public

# Use non-root user
RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "backend/server.js"]
