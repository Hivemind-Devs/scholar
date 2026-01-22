# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage to nginx directory
# Note: vite.config.ts sets outDir to 'build'
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

