# TOPCODER NOTIFICATIONS SERIES  - NOTIFICATIONS SERVER


## Dependencies
- nodejs https://nodejs.org/en/ (v6+)
- Heroku Toolbelt https://toolbelt.heroku.com
- git
- PostgreSQL 9.5


## Configuration

### Notification server
Configuration for the notification server is at `config/default.js`.
The following parameters can be set in config files or in env variables:
- **General**
  - `LOG_LEVEL`: the log level
  - `PORT`: the notification server port
  - `DATABASE_URL`: URI to PostgreSQL database
  - `DATABASE_OPTIONS`: database connection options
- **JWT authentication**
  - `AUTH_SECRET`: TC auth secret
  - `VALID_ISSUERS`: TC auth valid issuers
  - `JWKS_URI`: TC auth JWKS URI (need only for local deployment)
- **KAFKA**
  - `KAFKA_URL`: comma separated Kafka hosts
  - `KAFKA_TOPIC_IGNORE_PREFIX`: ignore this prefix for topics in the Kafka
  - `KAFKA_GROUP_ID`: Kafka consumer group id
  - `KAFKA_CLIENT_CERT`: Kafka connection certificate, optional;
      if not provided, then SSL connection is not used, direct insecure connection is used;
      if provided, it can be either path to certificate file or certificate content
  - `KAFKA_CLIENT_CERT_KEY`: Kafka connection private key, optional;
      if not provided, then SSL connection is not used, direct insecure connection is used;
      if provided, it can be either path to private key file or private key content
- **Topcoder API**
  - `TC_API_V5_BASE_URL`: the TopCoder API V5 base URL
- **Notifications API**
  - `API_CONTEXT_PATH`: path to serve API on
- **Machine to machine auth0 token**
  - `AUTH0_URL`: auth0 URL
  - `AUTH0_AUDIENCE`: auth0 audience
  - `TOKEN_CACHE_TIME`: time period of the cached token
  - `AUTH0_CLIENT_ID`: auth0 client id
  - `AUTH0_CLIENT_SECRET`: auth0 client secret

### Connect notification server
Configuration for the connect notification server is at `connect/config.js`.
The following parameters can be set in config files or in env variables:
- **Topcoder API**
  - `TC_API_V3_BASE_URL`: the TopCoder API V3 base URL
  - `TC_API_V4_BASE_URL`: the TopCoder API V4 base URL
  - `MESSAGE_API_BASE_URL`: the TopCoder message service API base URL
  - `TC_ADMIN_TOKEN`: the admin token to access TopCoder API - same for V3 and V4
- **Topcder specific**<br>
    Also it has probably temporary variables of TopCoder role ids for 'Connect Manager', 'Connect Copilot' and 'administrator':
  - `CONNECT_MANAGER_ROLE_ID`: 8,
  - `CONNECT_COPILOT_ROLE_ID`: 4,
  - `ADMINISTRATOR_ROLE_ID`: 1<br>
    Provided values are for development backend. For production backend they may be different.
    These variables are currently being used to retrieve above role members using API V3 `/roles` endpoint. As soon as this endpoint is replaced with more suitable one, these variables has to be removed if no need anymore.
  - `TCWEBSERVICE_ID` - id of the BOT user which creates post with various events in discussions
- **Machine to machine auth0 token**
  - `AUTH0_URL`: auth0 URL
  - `AUTH0_AUDIENCE`: auth0 audience
  - `TOKEN_CACHE_TIME`: time period of the cached token
  - `AUTH0_CLIENT_ID`: auth0 client id
  - `AUTH0_CLIENT_SECRET`: auth0 client secret
- **Email notification service**
  - `ENV`: environment variable (used to generate reply emails)
  - `AUTH_SECRET`: auth secret (used to sign reply emails)
  - `ENABLE_EMAILS`: if email service has to be enabled
  - `ENABLE_DEV_MODE`: send all emails to the `DEV_MODE_EMAIL` email address
  - `DEV_MODE_EMAIL`: address to send all email when `ENABLE_DEV_MODE` is enabled
  - `MENTION_EMAIL`: recipient email used for `notifications.action.email.connect.project.post.mention` event
  - `REPLY_EMAIL_PREFIX`: prefix of the genereated reply email address
  - `REPLY_EMAIL_DOMAIN`: email domain
  - `DEFAULT_REPLY_EMAIL`: default reply to email address, for example no-reply@topcoder.com

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

An admin token is needed to access TC API. This is already configured Postman notification
server API environment TC_ADMIN_TOKEN variable.
In case it expires, you may get a new token in this way:

- use Chrome to browse connect.topcoder-dev.com
- open developer tools, click the Network tab
- log in with suser1 / Topcoder123, or mess / appirio123
- once logged in, open some project, for example https://connect.topcoder-dev.com/projects/1936 and in the network inspector
  look for the call to the project api and get the token from the auth header, see
  http://pokit.org/get/img/68cdd34f3d205d6d9bd8bddb07bdc216.jpg


## Local deployment
- for local development environment you can set variables as following:
  - `authSecret`, `authDomain`, `validIssuers` can get from [tc-project-service config](https://github.com/topcoder-platform/tc-project-service/blob/dev/config/default.json)
  - `PORT=4000` because **connect-app** call this port by default
  - `jwksUri` - any
  - `KAFKA_TOPIC_IGNORE_PREFIX=joan-26673.` (with point at the end)
  - `TC_API_V4_BASE_URL=https://api.topcoder-dev.com/v4`
  - `TC_API_V3_BASE_URL=https://api.topcoder-dev.com/v3`
  - `TC_ADMIN_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoic3VzZXIxIiwiZXhwIjoxNTEzNDAxMjU4LCJ1c2VySWQiOiI0MDE1MzkzOCIsImlhdCI6MTUwOTYzNzYzOSwiZW1haWwiOiJtdHdvbWV5QGJlYWtzdGFyLmNvbSIsImp0aSI6IjIzZTE2YjA2LWM1NGItNDNkNS1iY2E2LTg0ZGJiN2JiNDA0NyJ9.REds35fdBvY7CMDGGFyT_tOD7DxGimFfVzIyEy9YA0Y` or follow section **TC API Admin Token** to obtain a new one if expired
  - `KAFKA_URL`, `KAFKA_CLIENT_CERT` and `KAFKA_CLIENT_CERT_KEY` get from [tc-bus-api readme](https://github.com/topcoder-platform/tc-bus-api/tree/dev)
- if you are willing to use notifications API which is hosted by the notifications server locally, you will need to use some patched `tc-core-library-js` module, which skips verification of user token. Because we don't know Topcoder `AUTH_SECRET` locally. So you can install this fork:
  ```
  npm i https://github.com/maxceem/tc-core-library-js/tree/skip-validation
  ```
  **WARNING** do not push package.json with this dependency as it skips users token validation.
- start local PostgreSQL db, create an empty database, update the config/default.js DATABASE_URL param to point to the db
- install dependencies `npm i`
- run code lint check `npm run lint`
- start connect notification server `npm start`
- the app is running at `http://localhost:4000`, it also starts Kafka consumer to listen for events and save unroll-ed notifications to db


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
- note that if you use the Heroku app, the app may be in sleep after some long idle time, you need to call any Postman test, e.g. the
  listNotifications test, so that the app wakes up, during wake up, the Heroku PostgreSQL database will be cleared and re-initialized
- in Postman, using the bus API collection and environment, run the `POST /events` / `Post event - XXX` tests,
  you may run it multiple times to create multiple events in Kafka,
  then you may watch the console output in the app, it should show info about handling the events
- in Postman, using the notification server API collection and environment, run the tests


## Swagger

Swagger API definition is provided at `docs/swagger_api.yaml`,
you may check it at `http://editor.swagger.io`.

