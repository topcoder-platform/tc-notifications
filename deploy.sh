#!/usr/bin/env bash
set -eo pipefail

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"

ENV=$1
TAG=$2
PROVIDER=$3
COUNTER_LIMIT=20
# Counter limit will be caluculaed based on sleep seconds

if [[ -z "$ENV" ]] ; then
	echo "Environment should be set on startup with one of the below values"
	echo "ENV must be one of - DEV, QA, PROD or LOCAL"
	exit
fi
if [[ -z "$TAG" ]] ; then
	echo "TAG must be specificed for image"
	exit
fi
if [[ -z "$PROVIDER" ]] ; then
	PROVIDER=$ENV
fi

AWS_REGION=$(eval "echo \$${ENV}_AWS_REGION")
AWS_ACCESS_KEY_ID=$(eval "echo \$${ENV}_AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=$(eval "echo \$${ENV}_AWS_SECRET_ACCESS_KEY")
AWS_ACCOUNT_ID=$(eval "echo \$${ENV}_AWS_ACCOUNT_ID")
AWS_REPOSITORY=$(eval "echo \$${ENV}_AWS_REPOSITORY")
AWS_ECS_CLUSTER=$(eval "echo \$${ENV}_AWS_ECS_CLUSTER")
AWS_ECS_SERVICE=$(eval "echo \$${ENV}_AWS_ECS_SERVICE")

KAFKA_CLIENT_CERT=$(eval "echo \$${ENV}_KAFKA_CLIENT_CERT")
KAFKA_CLIENT_CERT_KEY=$(eval "echo \$${ENV}_KAFKA_CLIENT_CERT_KEY")
KAFKA_GROUP_ID=$(eval "echo \$${ENV}_KAFKA_GROUP_ID")
KAFKA_TOPIC_IGNORE_PREFIX=$(eval "echo \$${ENV}_KAFKA_TOPIC_IGNORE_PREFIX")
KAFKA_URL=$(eval "echo \$${ENV}_KAFKA_URL")
AUTHSECRET=$(eval "echo \$${ENV}_AUTHSECRET")
AUTHDOMAIN=$(eval "echo \$${ENV}_AUTHDOMAIN")
VALID_ISSUERS=$(eval "echo \$${ENV}_VALID_ISSUERS")
JWKSURI=$(eval "echo \$${ENV}_JWKSURI")
TC_API_BASE_URL=$(eval "echo \$${ENV}_TC_API_BASE_URL")
TC_ADMIN_TOKEN=$(eval "echo \$${ENV}_TC_ADMIN_TOKEN")
LOG_LEVEL=$(eval "echo \$${ENV}_LOG_LEVEL")
PORT=$(eval "echo \$${ENV}_PORT")

TC_API_V3_BASE_URL=$(eval "echo \$${ENV}_TC_API_V3_BASE_URL")
TC_API_V4_BASE_URL=$(eval "echo \$${ENV}_TC_API_V4_BASE_URL")

DB_USER=$(eval "echo \$${ENV}_DB_USER")
DB_PASSWORD=$(eval "echo \$${ENV}_DB_PASSWORD")
DB_HOST=$(eval "echo \$${ENV}_DB_HOST")
DB_PORT=$(eval "echo \$${ENV}_DB_PORT")
DB_DATABASE=$(eval "echo \$${ENV}_DB_DATABASE")
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_DATABASE;

family=$(eval "echo \$${ENV}_AWS_ECS_TASK_FAMILY")
AWS_ECS_CONTAINER_NAME=$(eval "echo \$${ENV}_AWS_ECS_CONTAINER_NAME")

API_CONTEXT_PATH=$(eval "echo \$${ENV}_API_CONTEXT_PATH")

echo $APP_NAME

configure_aws_cli() {
	aws --version
	aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
	aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
	aws configure set default.region $AWS_REGION
	aws configure set default.output json
	echo "Configured AWS CLI."
}

push_ecr_image() {
	echo "Pushing Docker Image..."
	eval $(aws ecr get-login --region $AWS_REGION --no-include-email)
	docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$AWS_REPOSITORY:$TAG
	echo "Docker Image published."

}

deploy_cluster() {

    #family="nginx-api-dev-task"

    make_task_def
    register_definition
    update_result=$(aws ecs update-service --cluster $AWS_ECS_CLUSTER --service $AWS_ECS_SERVICE --task-definition $revision )
    #echo $update_result
    result=$(echo $update_result | $JQ '.service.taskDefinition' )
    echo $result
    if [[ $result != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    echo "Update service intialised successfully for deployment"
    return 0
}

make_task_def(){
	task_template='[
		{
				"name": "%s",
				"image": "%s.dkr.ecr.%s.amazonaws.com/%s:%s",
				"essential": true,
				"memory": 500,
				"cpu": 100,
				"environment": [
						{
								"name": "ENV",
								"value": "%s"
						},
						{
								"name": "KAFKA_CLIENT_CERT",
								"value": "%s"
						},
						{
								"name": "KAFKA_CLIENT_CERT_KEY",
								"value": "%s"
						},
						{
								"name": "KAFKA_GROUP_ID",
								"value": "%s"
						},
						{
								"name": "KAFKA_TOPIC_IGNORE_PREFIX",
								"value": "%s"
						},
						{
								"name": "KAFKA_URL",
								"value": "%s"
						},
						{
								"name": "DATABASE_URL",
								"value": "%s"
						},
						{
								"name": "authSecret",
								"value": "%s"
						},
						{
								"name": "authDomain",
								"value": "%s"
						},
						{
								"name": "jwksUri",
								"value": "%s"
						},
						{
								"name": "TC_API_BASE_URL",
								"value": "%s"
						},
						{
								"name": "TC_API_V3_BASE_URL",
								"value": "%s"
						},
						{
								"name": "TC_API_V4_BASE_URL",
								"value": "%s"
						},
						{
								"name": "TC_ADMIN_TOKEN",
								"value": "%s"
						},
						{
								"name": "LOG_LEVEL",
								"value": "%s"
						},
						{
								"name": "validIssuers",
								"value": "%s"
						},
						{
								"name": "PORT",
								"value": "%s"
						},
						{
								"name": "API_CONTEXT_PATH",
								"value": "%s"
						}
				],
				"portMappings": [
						{
								"hostPort": 0,
								"containerPort": 4000,
								"protocol": "tcp"
						}
				],
				"logConfiguration": {
						"logDriver": "awslogs",
						"options": {
								"awslogs-group": "/aws/ecs/%s",
								"awslogs-region": "%s",
								"awslogs-stream-prefix": "%s_%s"
						}
				}
		}
	]'

	task_def=$(printf "$task_template" $AWS_ECS_CONTAINER_NAME $AWS_ACCOUNT_ID $AWS_REGION $AWS_REPOSITORY $TAG $ENV "$KAFKA_CLIENT_CERT" "$KAFKA_CLIENT_CERT_KEY" $KAFKA_GROUP_ID "$KAFKA_TOPIC_IGNORE_PREFIX" $KAFKA_URL $DATABASE_URL $AUTHSECRET "$AUTHDOMAIN" "$JWKSURI" $TC_API_BASE_URL $TC_API_V3_BASE_URL $TC_API_V4_BASE_URL $TC_ADMIN_TOKEN $LOG_LEVEL $VALID_ISSUERS $PORT "$API_CONTEXT_PATH" $AWS_ECS_CLUSTER $AWS_REGION $AWS_ECS_CLUSTER $ENV)
}

register_definition() {
    if revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family $family | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
    else
        echo "Failed to register task definition"
        return 1
    fi

}

check_service_status() {
        counter=0
	sleep 60
        servicestatus=`aws ecs describe-services --service $AWS_ECS_SERVICE --cluster $AWS_ECS_CLUSTER | $JQ '.services[].events[0].message'`
        while [[ $servicestatus != *"steady state"* ]]
        do
           echo "Current event message : $servicestatus"
           echo "Waiting for 30 seconds to check the service status...."
           sleep 30
           servicestatus=`aws ecs describe-services --service $AWS_ECS_SERVICE --cluster $AWS_ECS_CLUSTER | $JQ '.services[].events[0].message'`
           counter=`expr $counter + 1`
           if [[ $counter -gt $COUNTER_LIMIT ]] ; then
                echo "Service does not reach steady state within 10 minutes. Please check"
                exit 1
           fi
        done
        echo "$servicestatus"
}

configure_aws_cli
push_ecr_image
deploy_cluster
check_service_status
