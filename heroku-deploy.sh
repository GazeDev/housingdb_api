#!/usr/bin/env bash

git push https://heroku:$(echo $HEROKU_API_KEY)@git.heroku.com/$(echo $HEROKU_REPO).git HEAD:main
