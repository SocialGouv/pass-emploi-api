#!/bin/bash

yarn migration 

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "On lance les seeds"
  yarn seed
fi
