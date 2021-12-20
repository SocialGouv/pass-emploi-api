#!/bin/bash

./bin/elastic-agent enroll --e --url $FLEET_URL --enrollment-token $FLEET_ENROLLMENT_TOKEN
./bin/elastic-agent run --e &
yarn start:prod
