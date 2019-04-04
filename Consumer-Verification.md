# TOPCODER NOTIFICATIONS - CONSUMER VERIFICATION

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to the extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create topics:
```
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic notifications.community.challenge.created
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic notifications.community.challenge.phasewarning
```

- verify that the topic is created:
```
bin/kafka-topics.sh --list --zookeeper localhost:2181
``` 
  it should list out the created topics

- run producer and then write some message into the console to send to the `notifications.community.challenge.created` topic:
```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notifications.community.challenge.created
```
- In the console, write some message, one message per line:
E.g.
```
{ "topic": "notifications.community.challenge.created", "originator": "tc-direct", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "userId": 8547899, "initiatorUserId": 123, "skills": ["dotnet", "xcode"] } }
```

- optionally, use another terminal, go to same directory, start a consumer to view the messages:
```
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic notifications.community.challenge.created --from-beginning
```


## Local deployment

- start local Kafka, start local PostgreSQL db, create an empty database `notification`
- set some config params via env as below, use `set` instead of `export` for windows OS,
  instead, you may set them via `config/default.js`, modify the DATABASE_URL according to your setup db:
```
export LOG_LEVEL=debug
export DATABASE_URL=postgres://postgres:123456@localhost:5432/notification
export KAFKA_URL=localhost:9092
export KAFKA_GROUP_ID=tc-notifications
export ENV=test
export DEV_MODE_EMAIL=testing@topcoder.com
export DEFAULT_REPLY_EMAIL=no-reply@topcoder.com
```

- to override TC API base URLs to use mock APIs, it is not needed if mock APIs are not used:
```
export TC_API_V3_BASE_URL=http://localhost:4000/v3
export TC_API_V4_BASE_URL=http://localhost:4000/v4
export TC_API_V5_BASE_URL=http://localhost:4000/v5
```

- set M2M config params:
```
export AUTH0_CLIENT_ID=8QovDh27SrDu1XSs68m21A1NBP8isvOt
export AUTH0_CLIENT_SECRET=3QVxxu20QnagdH-McWhVz0WfsQzA1F8taDdGDI4XphgpEYZPcMTF4lX3aeOIeCzh
export AUTH0_URL=https://topcoder-dev.auth0.com/oauth/token
export AUTH0_AUDIENCE=https://m2m.topcoder-dev.com/
```

- install dependencies `npm i`
- run code lint check `npm run lint`
- fix some lint errors `npm run lint:fix`
- create db tables if not present `node test/init-db`, this is needed only for local test, in production the tables are already present
- start notification consumer `npm run startConsumer`


## Verification

- Run Kafka console producer to write message to topic `notifications.community.challenge.created`:

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notifications.community.challenge.created
```

- Write message of challenge created:

```
{ "topic": "notifications.community.challenge.created", "originator": "tc-direct", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "userId": 8547899, "initiatorUserId": 123, "skills": ["dotnet", "xcode"] } }
```

- You will see logging in the app console:

```
info: Run handler handleChallengeCreated
...
verbose: Searched users: ...
...
info: Successfully sent notifications.action.email.connect.project.notifications.generic event with body ... to bus api
...
error: Failed to send email to user id: 5, handle: handle5
...
info: Saved 8 notifications for users: 1, 2, 3, 4, 5, 6, 7, 8
info: Handler handleChallengeCreated was run successfully
```


- Run Kafka console producer to write message to topic `notifications.community.challenge.phasewarning`:

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notifications.community.challenge.phasewarning
```

- Write message of challenge phase warning:

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

- You will see logging in the app console:

```
info: Run handler handleChallengePhaseWarning
...
verbose: Searched users: ...
...
info: Successfully sent notifications.action.email.connect.project.notifications.generic event with body ... to bus api
...
error: Failed to send email to user id: 5, handle: handle5
...
info: Saved 8 notifications for users: 1, 2, 3, 4, 5, 6, 7, 8
info: Handler handleChallengePhaseWarning was run successfully
```


- Write message of challenge retrieved with error:

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 1111, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

- You will see logging in the app console:

```
info: Run handler handleChallengePhaseWarning
...
error: Handler handleChallengePhaseWarning failed
...
error: { Error: Internal Server Error ...
```


- Write message of challenge which is not found:

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 2222, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

- You will see logging in the app console:

```
info: Run handler handleChallengePhaseWarning
...
error: Handler handleChallengePhaseWarning failed
...
error: { Error: Not Found ...
```


- Write message of challenge of id 3333:

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 3333, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

- You will see logging in the app console:

```
info: Run handler handleChallengePhaseWarning
...
error: Handler handleChallengePhaseWarning failed
...
error: { Error: Internal Server Error ...
... { message: 'there is some error' } ...
... Error: cannot GET /v3/members/_search?query=handle:%22handle1%22%20OR%20handle:%22handle2%22%20OR%20handle:%22handle3%22&offset=0&limit=5&fields=userId,email,handle,firstName,lastName,photoURL,status (500) ...
...
```


- You may write some invalid messages like below:

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "invalid", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

```
{ "topic": "notifications.community.challenge.phasewarning", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123 } }
```

```
{ [ xyz
```

- You will see error logging in the app console.

- Use some PostgreSQL client to connect to the database, e.g. you may use the PostgreSQL's built-in client psql to connect to the database: `psql -U postgres`

- connect to database: `\c notification`

- select notifications: `select * from "Notifications";`

- you will see notification records:

```
  1 | 23154497 | notifications.community.challenge.created      | {"skills": ["dotnet", "xcode"], "userId": 8547899, "challengeId": 30054522, "challengeUrl": "http://www.topcoder.com/123", "challengeTitle": "test", "initiatorUserId": 123}                 | f    | f    |         | 2019-04-01 19:49:08.232+08 | 2019-04-01 19:49:08.232+08
  2 |   294446 | notifications.community.challenge.created      | {"skills": ["dotnet", "xcode"], "userId": 8547899, "challengeId": 30054522, "challengeUrl": "http://www.topcoder.com/123", "challengeTitle": "test", "initiatorUserId": 123}                 | f    | f    |         | 2019-04-01 19:49:08.232+08 | 2019-04-01 19:49:08.232+08
  ...
```

