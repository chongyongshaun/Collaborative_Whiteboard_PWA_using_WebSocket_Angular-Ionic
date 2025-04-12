FROM node:20-alpine
WORKDIR /server
#all file that match the pattern to workdir
COPY package*.json ./
RUN npm install
#copy all files like server.js to workdir aka /server
COPY . .
EXPOSE 3000
CMD ["node", "./server.js"]