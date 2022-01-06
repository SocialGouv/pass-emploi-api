#!/bin/bash

yarn start:prod

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  scalingo -a $APP env-set "BASE_URL=plopplop"
  BASE_URL=plop yarn start:prod
else
    yarn start:prod
fi
