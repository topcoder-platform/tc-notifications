# Builds production version of Community App inside Docker container,
# and runs it against the specified Topcoder backend (development or
# production) when container is executed.

FROM node:8.16.1
LABEL app="tc notify" version="1.0"

WORKDIR /opt/app
COPY . .
RUN npm install
RUN npm install dotenv --save
RUN npm test
ENTRYPOINT ["npm","run"]
#CMD ["npm", "start"]
