# Stage 1: Build React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app to Nginx html folder
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
