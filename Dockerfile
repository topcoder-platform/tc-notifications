# Builds production version of Community App inside Docker container,
# and runs it against the specified Topcoder backend (development or
# production) when container is executed.

FROM node:8.2.1
LABEL app="tc notify" version="1.0"

WORKDIR /opt/app
COPY . .

RUN npm install
# dotenv is required for retriving postgres env
RUN npm install dotenv --save
#RUN cat .env
RUN npm test
ENV NODE_ENV=$NODE_ENV

CMD ["npm", "start"]
