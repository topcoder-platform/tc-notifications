# TOPCODER NOTIFICATIONS - WEBSOCKET VERIFICATION

## Local Setup

Use local docker-compse file under test. Docker-compose file contains
- Zookeeper
- Kafka
- Postgresql 9.6

It maps port 9092 and 5432 to your local machine for kafka and database.

```
cd test
docker-compose up -d
```

## Create topics and database

```
cd test
$ ./create-topics.sh
WARNING: Due to limitations in metric names, topics with a period ('.') or underscore ('_') could collide. To avoid issues it is best to use either, but not both.
WARNING: Due to limitations in metric names, topics with a period ('.') or underscore ('_') could collide. To avoid issues it is best to use either, but not both.
WARNING: Due to limitations in metric names, topics with a period ('.') or underscore ('_') could collide. To avoid issues it is best to use either, but not both.
WARNING: Due to limitations in metric names, topics with a period ('.') or underscore ('_') could collide. To avoid issues it is best to use either, but not both.

```
or run each create topic command manually

```
cd test
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic challenge.notification.events
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic notifications.autopilot.events
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic submission.notification.create
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic dummy.topic
```

Set below environment variables

```
export LOG_LEVEL=debug
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
export KAFKA_URL=localhost:9092
export KAFKA_GROUP_ID=tc-notifications
export ENV=test
export DEV_MODE_EMAIL=testing@topcoder.com
export DEFAULT_REPLY_EMAIL=no-reply@topcoder.com
export AUTH0_CLIENT_ID=dummy
export AUTH0_CLIENT_SECRET=dummy
export AUTH0_URL=dummy
export AUTH0_AUDIENCE=dummy
export AUTH_SECRET=secret
export VALID_ISSUERS=[\"abc.com\"]
```

- install dependencies `npm install`
- run code lint check `npm run lint`
- create db tables if not present `node test/init-db`, this is needed only for local test

Update KAFKA_CONSUMER_RULESETS default config with dummy topic and consumer

```
'dummy.topic': [
      {
        handleDummy: {
          roles: ['Topcoder User'],
        },
      },
    ],
```


- start notification consumer `npm run startConsumer`

## Verification

Open the sample html page under test/websocket.html.

- Click : Run WebSocket, you will see below messages in order.
```
 WebSocket is supported by your Browser!
 Token is sent...
 Subscribed to topic watch for the messages..
```
And in the html page you will see

```
1-{"full":true,"topic":"dummy.topic","messages":[]}
```

Also you can check server logs for below. There is a custom generated token in the html page. You will see role of connected user.
The token will be masked in the logs for security reasons
```
debug: web socket connected
debug: web socket message: token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiYWRtaW5pc3RyYXRvciJdLCJpc3MiOiJhYmMuY29tIiwiaGFuZGxlIjoic2FjaGluIiwidXNlcklkIjoiMTAwIiwiZW1haWwiOiJhYmMuY29tIiwianRpIjoiMTdiYzc1Y2EtNmI2Yi00NzIyLWFlMzMtMzQ2NTg4YzlmZjJhIiwiaWF0IjoxNTY3NjgwNjU2LCJleHAiOjE1NzU0NTY2NTZ9.0Lo-t422h7n-Jmt_8qnTK81lmBiFVRWld8kYR2VeKr8
debug: web socket authorized with roles: Topcoder User,administrator
debug: web socket message: {"topic":"dummy.topic","count":5}
```

Topic items are empty in application now. We will put a sample message

Connect to console producer
```
 cd test
 docker-compose exec kafka opt/kafka/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic dummy.topic
```

- Put a sample message
```
{ "topic": "dummy.topic", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123, "type": "UPDATE_DRAFT_CHALLENGE" , "data" : {"id" : "30055164" }} }
```

- You will see logging in the app console:

```
info: Handle Kafka event message; Topic: dummy.topic; Partition: 0; Offset: 1; Message: { "topic": "dummy.topic", "originator": "tc-autopilot", "timestamp": "2018-02-16T00:00:00", "mime-type": "application/json", "payload": { "challengeId": 30054674, "challengeTitle": "test", "challengeUrl": "http://www.topcoder.com/123", "phase": "Submission", "remainingTime": 12345, "userId": 8547899, "initiatorUserId": 123, "type": "UPDATE_DRAFT_CHALLENGE" , "data" : {"id" : "30055164" }} }.
info: Run handler handleDummy
info: Going to insert 1 notifications in database.
Executing (default): INSERT INTO "Notifications" ("id","userId","type","contents","read","seen","version","createdAt","updatedAt") VALUES (DEFAULT,123,'dummy.topic','{"topic":"dummy.topic","originator":"tc-autopilot","timestamp":"2018-02-16T00:00:00","mime-type":"application/json","payload":{"challengeId":30054674,"challengeTitle":"test","challengeUrl":"http://www.topcoder.com/123","phase":"Submission","remainingTime":12345,"userId":8547899,"initiatorUserId":123,"type":"UPDATE_DRAFT_CHALLENGE","data":{"id":"30055164"}}}',false,false,NULL,'2019-09-09 19:14:38.349 +00:00','2019-09-09 19:14:38.349 +00:00');
info: Saved 1 notifications
info: Going to push 1 notifications to websocket.
info: Pushed 1 notifications to websocket
info: Handler handleDummy executed successfully

```

Now please check the websocket.html again and see that new message is inserted.

```
{"full":false,"topic":"dummy.topic","messages":[[{"userId":123,"notification":{"topic":"dummy.topic","originator":"tc-autopilot","timestamp":"2018-02-16T00:00:00","mime-type":"application/json","payload":{"challengeId":30054674,"challengeTitle":"test","challengeUrl":"http://www.topcoder.com/123","phase":"Submission","remainingTime":12345,"userId":8547899,"initiatorUserId":123,"type":"UPDATE_DRAFT_CHALLENGE","data":{"id":"30055164"}}}}]]}
```

Refresh the page and connect to websocket again. You should see that previous messages are published

```
{"full":true,"topic":"dummy.topic","messages":[[{"userId":123,"notification":{"topic":"dummy.topic","originator":"tc-autopilot","timestamp":"2018-02-16T00:00:00","mime-type":"application/json","payload":{"challengeId":30054674,"challengeTitle":"test","challengeUrl":"http://www.topcoder.com/123","phase":"Submission","remainingTime":12345,"userId":8547899,"initiatorUserId":123,"type":"UPDATE_DRAFT_CHALLENGE","data":{"id":"30055164"}}}}]]}
```

## Database Verification

Use some PostgreSQL client to connect to the database. Credentials are same as below

- Username : postgres
- Password : postgres
- Hostname : localhost
- Post     : 5432
- Database : postgres

```
select notifications: select * from "Notifications";
```

Then you will see generated notification records same as browser notifications
