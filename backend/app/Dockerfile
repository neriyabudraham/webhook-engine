FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# התיקון: שינוי הנתיב מ-dist/main ל-dist/src/main
CMD ["node", "dist/src/main"]
