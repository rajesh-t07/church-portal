# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Accept build argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user (nginx group already exists)
RUN adduser -S churchapp -u 1001

# Set proper permissions
RUN chown -R churchapp:root /usr/share/nginx/html && \
    chown -R churchapp:root /var/cache/nginx && \
    chown -R churchapp:root /var/log/nginx && \
    chown -R churchapp:root /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R churchapp:root /var/run/nginx.pid

# Switch to non-root user
USER churchapp

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]