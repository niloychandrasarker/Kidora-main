# Stage 1: Build the app using Node.js 22 and Vite
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Replace the default Nginx config with one that supports client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ✅ Copy Vite's build output from /app/dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

