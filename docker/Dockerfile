FROM node:10.15.3

WORKDIR /usr/src/api

# For npm@5 or later, copy package-lock.json as well
COPY ./package.json ./package-lock.json ./

RUN npm install -g nodemon

RUN npm install

COPY . .

EXPOSE 8081
