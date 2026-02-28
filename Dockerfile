# Dockerfile for QuantMod Discord Bot
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p data

# Run the bot
CMD ["npm", "start"]