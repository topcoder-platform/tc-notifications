# TOPCODER NOTIFICATIONS SERIES - NOTIFICATIONS SERVER


## Dependencies
- nodejs https://nodejs.org/en/ (v6+)
- Heroku Toolbelt https://toolbelt.heroku.com
- git
- PostgreSQL 9.5


## Configuration
Configuration for the notification server is at `config/default.js`.
The following parameters can be set in config files or in env variables:
- LOG_LEVEL: the log level
- PORT: the notification server port
- JWT_SECRET: JWT secret
- DATABASE_URL: URI to PostgreSQL database
- DATABASE_OPTIONS: database connection options
- KAFKA_URL: comma separated Kafka hosts
- KAFKA_TOPIC_IGNORE_PREFIX: ignore this prefix for topics in the Kafka
- KAFKA_GROUP_ID: Kafka consumer group id
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content


Configuration for the connect notification server is at `connect/config.js`.
The following parameters can be set in config files or in env variables:
- TC_API_BASE_URL: the TopCoder API base URL
- TC_ADMIN_TOKEN: the admin token to access TopCoder API


Note that the above two configuration are separate because the common notification server config
will be deployed to a NPM package, the connect notification server will use that NPM package,
the connection notification server should only use API exposed by the index.js.


## JWT Token Generation

JWT token can be generated using the script test/token.js, its usage: `node test/token {user-id}`.
Then use the generated token to manage the user's notifications.

In the Postman bus API, the `Post Connect event` will create a Kafka event of project id 1936;
In the Postman notification server API, the `TC API - get project` will get details of project id 1936,
we can see the project has one member of user id 305384;
so we can run `node test/token 305384` to generate a token to manage notifications of the user of id 305384.

The generated token is already configured in the Postman notification server API environment TOKEN variable.
You may reuse it during review.


## TC API Admin Token

An admin token is needed to access TC API. This is already configured in connect/config.js and Postman notification
server API environment TC_ADMIN_TOKEN variable.
In case it expires, you may get a new token in this way:

- use Chrome to browse connect.topcoder-dev.com
- open developer tools, click the Network tab
- log in with suser1 / Topcoder123
- once logged in, open some project, for example https://connect.topcoder-dev.com/projects/1936 and in the network inspector
  look for the call to the project api and get the token from the auth header, see
  http://pokit.org/get/img/68cdd34f3d205d6d9bd8bddb07bdc216.jpg


## Local deployment
- start local PostgreSQL db, create an empty database, update the config/default.js DATABASE_URL param to point to the db
- install dependencies `npm i`
- run code lint check `npm run lint`
- start connect notification server `npm start`
- the app is running at `http://localhost:3000`, it also starts Kafka consumer to listen for events and save unroll-ed notifications to db


## Heroku deployment

- git init
- git add .
- git commit -m 'message'
- heroku login
- heroku create [application-name] // choose a name, or leave it empty to use generated one
- heroku addons:create heroku-postgresql:hobby-dev
- note that you may need to wait for several minutes before the PostgreSQL database is ready
- optionally, to set some environment variables in heroku, run command like:
  `heroku config:set KAFKA_CLIENT_CERT=path/to/certificate/file`
  `heroku config:set KAFKA_CLIENT_CERT_KEY=path/to/private/key/file`
  `heroku config:set KAFKA_GROUP_ID=some-group`
  etc.
- git push heroku master // push code to Heroku


## Verification

- start the app following above sections
- in Postman, using the bus API collection and environment, run the `POST /events` / `Post Connect event` test,
  you may run it multiple times to create multiple events in Kafka,
  then you may watch the console output in the app, it should show info about handling the events
- in Postman, using the notification server API collection and environment, run the tests


## Swagger

Swagger API definition is provided at `docs/swagger_api.yaml`,
you may check it at `http://editor.swagger.io`.

