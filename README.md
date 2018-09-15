# Modular Hapi Sequelize Lab

## Goals

The goal of this structuring is to allow code to be packaged into 'modules':
collections of files all related to a specific purpose/content type packaged
together. This is so it is easy to find all pieces (models, routes, controllers,
tests) related to a content type in the same place, and so it can easily be
picked up and placed in another project. We also wanted to make sure that the
stack was built with testing from the start.

## Installation/Docker Commands

It is intended that you will use [docker](https://docs.docker.com/engine/installation/)
and [docker compose](https://docs.docker.com/compose/install/). You'll need to
copy variables.env.example to variables.env and set the values and then run the
commands below via command line to get started:

Run this command:
`docker-compose build`

Then run the container:
`docker-compose up -d`

Your app should be running. You can now view the logs to make sure and find the url:
`docker-compose logs --follow`

If you need terminal access inside your application (for example, to install npm dependencies):

`docker-compose exec lab bash`
(Note: exec requires that we choose a service, which is why we have to specify lab, which is defined in our docker/docker-compose.yml)

Filling out variables.env:
- To find the DB_HOST:
-- `docker network inspect bridge | grep Gateway`
(This assumes you have a postgres db container running on your machine. Depending on your local development choices you may need to find your database host another way.)

To stop the container:
`docker-compose stop`

To remove the container's image:
`docker-compose rm`

## Testing

In order to run the test suites, you can either

1) Use terminal access inside your application to run the tests:
`docker-compose exec lab bash`
`$ npm run test`

2) In `docker/docker-compose.yml` change the line
`command: npm run dev` to `command: npm run test`
Then you can restart the container with
`docker-compose up -d`
and view the logs from the test with
`docker-compose logs --follow`

## Auto Generated API Docs

The API docs are auto-generated with hapi-swagger when the server is running

To start the server, run the Installation/Docker Commands, primarily

`docker-compose up -d`

The docs should now be available at http://localhost:23084
