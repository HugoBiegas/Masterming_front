# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the application with Vite
RUN npm run build

# Verify build output exists
RUN ls -la dist/ && test -f dist/index.html || (echo "❌ Vite build failed!" && exit 1)

# Production stage
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from Vite build stage (dist, not build!)
COPY --from=build /app/dist /usr/share/nginx/html

# Set proper permissions for nginx files
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Verify files were copied
RUN ls -la /usr/share/nginx/html/ && test -f /usr/share/nginx/html/index.html || (echo "❌ Files not copied!" && exit 1)

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://54.36.101.158/ || exit 1

CMD ["nginx", "-g", "daemon off;"]