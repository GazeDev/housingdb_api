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

---
NOTE: We are going to use a bash alias to make running docker-compose files a bit less verbose. You can run the following to create `docker-compose-local`, `docker-compose-deploy`, and `docker-compose-test` alias commands:
```
echo "alias docker-compose-local='docker-compose --file=docker-compose-local.yml'" >> ~/.bashrc
echo "alias docker-compose-deploy='docker-compose --file=docker-compose-deploy.yml'" >> ~/.bashrc
source ~/.bashrc
echo "alias docker-compose-test='docker-compose --file=docker-compose-test.yml'" >> ~/.bashrc
source ~/.bashrc
```
---

Copy the variables example file:
`cp docker/variables.env.example docker/variables.env`

The file should be ready-to-go for local development, but if you needed to modify it you could run (or use any other editor of your choice):
`nano docker/variables.env`

Note: If this is your first time running the api/db you'll need to restructure the database so it matches the ORM code. THIS WILL WIPE/EMPTY THE DATABASE, so don't do that in any environment you have data you need to keep around. You can restructure the db by un-commenting (removing the `#`) from this line in `docker/variables.env`: `# DB_DESTROY_DATABASE_RESTRUCTURE=DB_DESTROY_DATABASE_RESTRUCTURE`

This will continually re-structure the database any time any code is changed in development mode. This can be useful if you are building db models, or annoying if you are trying to create data. Re-comment that line, stop your docker container, and re-up it to cease database restructuring on code change.


Run this command:
`docker-compose build`

Then run the container:
`docker-compose up api`

You should then be able to access the api at the following url:
`http://localhost:23085`

To instead run a container detached, you can run the following:
`docker-compose up -d api`

To view a detached container's logs as they are generated:
`docker-compose logs --follow`

To stop a detached container:
`docker-compose stop`

To open a bash shell in a container:
`docker-compose exec bash api`

## Testing

In order to run the tests, ensure your variables-test.env is filled out, the bash alias 'docker-compose-test' is set, and then from your terminal run the command, `docker-compose-test up`

## Auto Generated API Docs

The API docs are auto-generated with hapi-swagger when the server is running

To start the server, run the Installation/Docker Commands, primarily

`docker-compose up api`

The docs should now be available at http://localhost:23085/documentation

## Additional Documentation

Additional documentation can be found in markdown format in the [docs directory](docs/index.md)

## Features/Roadmap

### What it does:
- Create a property
- Get an individual property
- Get a list of properties
- Create a landlord
- Get and individual landlord
- Get a list of landlords
- Add a landlord to a property
- Create an account
- Create content attached to account
- Create Reviews
- View Reviews and External Reviews

### Roadmap
- Housing Wanted and Housing Available
