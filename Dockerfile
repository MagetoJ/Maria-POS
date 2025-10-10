# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install
RUN cd server && npm install

# Copy source files
COPY . .

# Build frontend and backend
RUN npm run build
RUN cd server && npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

# Install only production dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

# Start server
CMD ["npm", "start"]
