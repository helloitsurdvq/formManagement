FROM node:20-alpine AS BUILD_IMAGE
WORKDIR /app
COPY package*.json ./
RUN npm i

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]