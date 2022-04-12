FROM node:16

WORKDIR /andthen-players
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080
CMD ["node", "app.js"]
