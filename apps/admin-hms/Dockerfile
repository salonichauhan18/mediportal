# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/admin-hms/package*.json ./apps/admin-hms/
COPY packages/ui-core/package*.json ./packages/ui-core/
COPY packages/shared-types/package*.json ./packages/shared-types/

RUN npm install --legacy-peer-deps

COPY . .

# Build-time env vars — Vite bakes these into the static bundle
ARG VITE_API_URL=http://localhost:3002/api/v1
ARG VITE_SOCKET_URL=http://localhost:3002
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the React app
RUN npm run build -w apps/admin-hms

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

COPY --from=builder /app/apps/admin-hms/dist /usr/share/nginx/html

# Custom Nginx config to handle SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
