#!/bin/bash
until npx ts-node src/app.ts
do
  echo "Server Crashed! Attempting to restart!"
  sleep 2; 
done
