FROM node:alpine

WORKDIR /project

COPY package*.json /project

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]