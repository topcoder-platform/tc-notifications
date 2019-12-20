# TOPCODER NOTIFICATIONS

## Description
This repository hosts the API and processors for enabling notifications in various topcoder apps. Currently it is limited to provide this facility to the [Connect](https://github.com/appirio-tech/connect-app) application. Theoretcially, it is a generic framework and application which could be used for sending and consuming notificaitons by any other topcoder app. In very simple words to send notifications using this application:

1. Send an event to bus
2. Listen that event in tc-notifications
3. There is a config in tc-notifications for each event it want to listen and we can specify rules who are the target users to whom we should send notifications for this event
4. By default it saves all notifications which are generated after parsing the rules specified in step 3 and these are the treated web notifications which we show in the app directly
5. Then there is option to add notification handlers where we get all these notifications one by one and we can process them further for more channels e.g. we send notification emails for each of notification generated
6. When one wants to show the notifications, we use the notifications api (hosted inside the tc-notifications itself as separate service) to fetch notifications, mark notifications read or unread etc.

tc-notifications (as a standard nodejs app) provides generic framework around notifications, it does not have config (used in step 3 of previous list) for specific apps. So, to have config for specific apps, we have to start the notification consumers per app e.g. for connect, we have a folder [`connect`](https://github.com/topcoder-platform/tc-notifications/blob/dev/connect) which hosts start script to start notification consumers with connect specific configuration ([`events-config.js`](https://github.com/topcoder-platform/tc-notifications/blob/dev/connect/events-config.js)). It also adds email notification service which sends emails for notifications as per notification settings (coming from common framework laid by tc-notifications) for the user.

### Steps needed to enable other apps to use the notifications are:
1. Have a separate start up script (in a new folder at the root of the repo) for the concerned app. I would call this as notification consumer/processor.
2. Write [`events-config.js`](https://github.com/topcoder-platform/tc-notifications/blob/dev/connect/events-config.js) (name is not important, we have to read this file in the start up script written in step 1) for app specific notifications
3. Write additional notification services (eg. if you want to send email or slack or any other notification) and add them to startup script
4. Specify a node script in package.json to launch the start up script written in step 1
5. Either add deployment for this new notification consumer/processor in existing deployment script (if you want to host the processor as separate service in the same ECS cluster) or write a new script if you want to keep the deployment separate.

## Dependencies
- nodejs https://nodejs.org/en/ (v6+, if newer version of node is used, e.g. v10, then it needs to install extra lib `npm i natives@1.1.6` to support the gulp build)
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
  - `KAFKA_GROUP_ID`: Kafka consumer group id
  - `KAFKA_CLIENT_CERT`: Kafka connection certificate, optional;
      if not provided, then SSL connection is not used, direct insecure connection is used;
      if provided, it can be either path to certificate file or certificate content
  - `KAFKA_CLIENT_CERT_KEY`: Kafka connection private key, optional;
      if not provided, then SSL connection is not used, direct insecure connection is used;
      if provided, it can be either path to private key file or private key content
- **Topcoder API**
  - `TC_API_V3_BASE_URL`: the TopCoder API V3 base URL
  - `TC_API_V4_BASE_URL`: the TopCoder API V4 base URL
  - `TC_API_V5_BASE_URL`: the TopCoder API V5 base URL
- **Notifications API**
  - `API_CONTEXT_PATH`: path to serve API on
- **Machine to machine auth0 token**
  - `AUTH0_URL`: auth0 URL
  - `AUTH0_AUDIENCE`: auth0 audience
  - `TOKEN_CACHE_TIME`: time period of the cached token
  - `AUTH0_CLIENT_ID`: auth0 client id
  - `AUTH0_CLIENT_SECRET`: auth0 client secret
  - `AUTH0_PROXY_SERVER_URL`: auth0 proxy server URL
- **Consumer handlers**
  - `KAFKA_CONSUMER_HANDLERS`: mapping from consumer topic to handlers
- **Consumer websocket support**
  - `WS_MAX_MESSAGE_COUNT`: Maximum number of messages kept in memory per topic
  - `WS_PORT`: Port to expose websocket endpoint
  - `WS_ZLIB_DEFLATE_CHUNK_SIZE`: Gzip Deflate chunk size
  - `WS_ZLIB_DEFLATE_MEM_LEVEL`: Gzip and Deflate compression memory level
  - `WS_ZLIB_INFLATE_CHUNK_SIZE`: Gzip Inflate chunk size
  - `WS_CLIENT_NO_CONTEXT_TAKEOVER`: Acknowledge disabling of client context takeover.
  - `WS_SERVER_NO_CONTEXT_TAKEOVER`: Whether to use context takeover or not.
  - `WS_SERVER_MAX_WINDOW_BITS`: Gzip window bits
  - `WS_CONCURRENCY_LIMIT`:  The number of concurrent calls to zlib. Calls above this limit will be queued
  - `WS_BYTES_THRESHOLD`: Payloads smaller than this will not be compressed.
- **Email notification**
  - `ENV`: used to construct email category
  - `ENABLE_EMAILS`: whether to enable email notifications
  - `ENABLE_DEV_MODE`: whether to enable dev mode
  - `DEV_MODE_EMAIL`: recipient email used in dev mode
  - `DEFAULT_REPLY_EMAIL`: default reply email


### Connect notification server
Configuration for the connect notification server is at `connect/config.js`.
The following parameters can be set in config files or in env variables:
- **Topcoder API**
  - `TC_API_V3_BASE_URL`: the TopCoder API V3 base URL
  - `TC_API_V4_BASE_URL`: the TopCoder API V4 base URL
  - `MESSAGE_API_BASE_URL`: the TopCoder message service API base URL
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

## Local deployment
- for local development environment you can set variables as following:
  - `AUTH_SECRET`,`VALID_ISSUERS` can get from [tc-project-service config](https://github.com/topcoder-platform/tc-project-service/blob/dev/config/default.json)
  - `PORT=4000` because **connect-app** call this port by default
  - `TC_API_V4_BASE_URL=https://api.topcoder-dev.com/v4`
  - `TC_API_V3_BASE_URL=https://api.topcoder-dev.com/v3`
  - `KAFKA_URL`, `KAFKA_CLIENT_CERT` and `KAFKA_CLIENT_CERT_KEY` get from [tc-bus-api readme](https://github.com/topcoder-platform/tc-bus-api/tree/dev)
- if you are willing to use notifications API which is hosted by the notifications server locally, you will need to use some patched `tc-core-library-js` module, which skips verification of user token. Because we don't know Topcoder `AUTH_SECRET` locally. So you can install this fork:
  ```
  npm i https://github.com/maxceem/tc-core-library-js/tree/skip-validation
  ```
  **WARNING** do not push package.json with this dependency as it skips users token validation.
- start local PostgreSQL db, create an empty database, update the config/default.js DATABASE_URL param to point to the db
- install dependencies `npm i`
- run code lint check `npm run lint`
- init DB `npm run reset:db`
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

