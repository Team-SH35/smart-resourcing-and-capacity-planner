FROM node:slim
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
COPY .env.example .env
EXPOSE 4000
CMD ["npm", "run", "dev"]