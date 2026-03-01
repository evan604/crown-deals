# Crown Deals Actor - Playwright with Chrome
FROM apify/actor-node-playwright-chrome:20

COPY package*.json ./
RUN npm install --only=prod --no-optional

COPY . ./

CMD node main.js
