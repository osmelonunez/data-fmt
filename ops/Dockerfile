FROM node:24-alpine

# instalar jq
RUN apk add --no-cache jq

WORKDIR /app

# instalar dependencias backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev || npm i --omit=dev

# copiar código
COPY backend ./backend
COPY public ./public

EXPOSE 8080
CMD ["node", "backend/server.js"]
