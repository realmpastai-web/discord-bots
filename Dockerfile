FROM node:18-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

# Create data and logs directories
RUN mkdir -p data logs temp

CMD ["node", "src/index.js"]
