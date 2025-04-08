# Build using node 20 because it is the latest LTS version
FROM node:20-alpine AS build
# Set the working directory basically all the cmds like COPY, RUN, CMD, ENTRYPOINT, EXPOSE, ENV will be run in this directory 
# and all the paths will be relative to this directory
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY frontend/whiteboard_app/package*.json ./
RUN npm install
# Copy the rest of the application code to the working directory
COPY frontend/whiteboard_app/ .
# Build the application for production, the output will be in the www directory
RUN npm run build --prod

# Serve
FROM nginx:alpine
COPY --from=build /app/www /usr/share/nginx/html
COPY frontend/whiteboard_app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80