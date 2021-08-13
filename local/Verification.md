# Deployment & Verification Guide

> This guide is prepared for Linux OS, npm install command fails for Windows.
> Please switch to Node.js version 8.x before proceed.

1. I prepared a docker-compose file for local deployment. It will start the following services:
   * postgres
   * zookeeper
   * kafka
   * bus-api
2. Run following commands to start dependency services:
   ```bash
   cd local
   docker-compose build --no-cache
   docker-compose up -d
   ```
3. After services have started successfully, set environment variables for notifications api:
   ```sh
    # you need to provide the values for the next variables
    export AUTH0_CLIENT_ID
    export AUTH0_CLIENT_SECRET
    export SLACK_BOT_TOKEN

    # for other variables can uses these ones
    export AUTH0_URL='https://topcoder-dev.auth0.com/oauth/token'
    export AUTH0_AUDIENCE='https://m2m.topcoder-dev.com/'
    export AUTH0_AUDIENCE_UBAHN='https://u-bahn.topcoder.com'
    export AUTH_SECRET='mysecret'
    export VALID_ISSUERS='["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/", "https://auth.topcoder-dev.com/"]'
    export DATABASE_URL='postgres://postgres:postgres@localhost:5432/postgres'
    export PORT=4000
    export TC_API_V5_BASE_URL='http://localhost:8002/v5'
    export KAFKA_URL='localhost:9092'
    export KAFKA_GROUP_ID='tc-notifications'
    export SLACK_NOTIFY='true'
    export ENABLE_DEV_MODE='false'
    ```

4. Run command `npm install`
5. Run command `npm run reset:db` to initialize tables.
6. Run command `npm run startConsumer` to start kafka consumer.
7. Wait to see following logs:
   ```bash
   2021-07-24T15:11:01.512Z INFO no-kafka-client Joined group tc-notifications generationId 1 as no-kafka-client-2689c63f-9850-448a-a3f0-11d2ec8e49ce
   2021-07-24T15:11:01.512Z INFO no-kafka-client Elected as group leader
   2021-07-24T15:11:01.583Z DEBUG no-kafka-client Subscribed to notifications.autopilot.events:0 offset 0 leader localhost:9092
   2021-07-24T15:11:01.583Z DEBUG no-kafka-client Subscribed to challenge.notification.events:0 offset 0 leader localhost:9092
   2021-07-24T15:11:01.584Z DEBUG no-kafka-client Subscribed to notification.action.create:0 offset 0 leader localhost:9092
   2021-07-24T15:11:01.584Z DEBUG no-kafka-client Subscribed to admin.notification.broadcast:0 offset 0 leader localhost:9092
   ```
8. Now, we will prepare terminals to be used later for verifying api.
    * 1 terminal to watch kafka topic for email notifications.
    * 1 terminal to query Notifications table for web notifications.
    * Slack app, web or mobile application.
9.  Open a new terminal for watching kafka topic `external.action.email`
    ```bash
    docker exec notification-kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic external.action.email
    ```
10. **Alternative-1:**  Open a new terminal for postgres. It will be used to check if notifications are getting created.
    ```bash
    docker exec -it notification-postgres psql -U postgres
    \c postgres
    SELECT * FROM "Notifications";
    ```
    **Alternative-2:** Start notifications api and use postman to list notifications. Open a new terminal and change PORT to 3000
    ```bash
    . ./environment.sh
    export PORT=3000
    npm run startAPI
    ```
    Open postman and use following collection and environment:
    * collection: docs/tc-notifications.postman_collection.json
    * environment: docs/tc-notifications.postman_environment.json

    Existing postman collections are outdated and need to be converted to version 2.0.0. So, I had to create a new collection.

11. To verify slack messages, you can use following workspace and user credentials. Token for posting messages to slack was already shared inside environment variables and has been set at step 3.
    `https://tc-notifications.slack.com/`
    username: `tc.notification.slack@gmail.com`
    password: `@Topcoder123`


12. Now we can start testing. Open a new terminal for producing kafka messages for the topic `notification.action.create`
    ```bash
    docker exec -it notification-kafka /opt/kafka/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notification.action.create
    ```
13. You can copy and paste the following messages to the terminal we opened for producing kafka messages.
    send messages successfully
    ```json
    {"topic":"notification.action.create","originator":"tc-direct","timestamp":"2018-02-16T00:00:00","mime-type":"application\/json","payload":[{"serviceId":"email","type":"taas.notification.request-submitted","details":{"from":"example@example.com","recipients":[{"userId":123,"email":"test1@test.com"},{"userId":456,"email":"test2@test.com"}],"cc":[{"userId":789,"email":"test3@test.com"},{"userId":987,"email":"test4@test.com"}],"data":{"subject":"...","body":"...","field1":"...","field2":"...","filedN":"..."},"sendgridTemplateId":"...","version":"v3"}},{"serviceId":"slack","type":"taas.notification.request-submitted","details":{"channel":"general","text":"test message"}},{"serviceId":"web","type":"taas.notification.request-submitted","details":{"userId":40152856,"contents":{},"version":1}}]}
    ```
    email: fail (invalid email), web: success, slack: success
    ```json
    {"topic":"notification.action.create","originator":"tc-direct","timestamp":"2018-02-16T00:00:00","mime-type":"application\/json","payload":[{"serviceId":"email","type":"taas.notification.request-submitted","details":{"from":"example.com","recipients":[{"userId":123,"email":"test1@test.com"},{"userId":456,"email":"test2@test.com"}],"cc":[{"userId":789,"email":"test3@test.com"},{"userId":987,"email":"test4@test.com"}],"data":{"subject":"...","body":"...","field1":"...","field2":"...","filedN":"..."},"sendgridTemplateId":"...","version":"v3"}},{"serviceId":"slack","type":"taas.notification.request-submitted","details":{"channel":"random","text":"test message"}},{"serviceId":"web","type":"taas.notification.request-submitted","details":{"userId":40152856,"contents":{},"version":1}}]}
    ```