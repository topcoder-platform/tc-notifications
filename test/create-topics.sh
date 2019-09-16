#!/bin/bash
#Create minimal topics for local testing
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic challenge.notification.events
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic notifications.autopilot.events
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic submission.notification.create
docker-compose exec kafka opt/kafka/bin/kafka-topics.sh  --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic dummy.topic