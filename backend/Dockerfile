FROM node:20-alpine
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --update python3 make g++
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "dist/index.js"]
