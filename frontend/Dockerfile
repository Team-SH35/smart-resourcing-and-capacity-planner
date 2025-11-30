FROM node:slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY .env.example .env

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
