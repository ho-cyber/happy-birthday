# Use the official Puppeteer image which includes Chromium and all dependencies
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to set up the working directory
USER root

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Render uses the PORT environment variable
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]