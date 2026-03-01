# Crown Deals Actor - Playwright with Chrome
FROM apify/actor-node-playwright-chrome:20

# Copy package files
COPY package*.json ./

# Install dependencies (including playwright)
RUN npm install --no-optional

# Copy source code
COPY . ./

# Start the Actor
CMD node main.js
