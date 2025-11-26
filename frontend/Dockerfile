FROM node:slim
COPY . .
COPY .env.example .env
RUN npm install
CMD npm run dev
EXPOSE 8000