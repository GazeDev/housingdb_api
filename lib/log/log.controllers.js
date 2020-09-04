module.exports = (models) => {
  const Boom = require('@hapi/boom');

  return {
    getLogs: async function(request, h) {
      let logs;
      try {
        logs = await getLogs();
      } catch (e) {
        throw Boom.badImplementation('Error during getLogs(). ' + e);
      }
      return h
        .response(logs);
    },
    getLog: async function(request, h) {
      let log;
      try {
        log = await getLog(request.params.id);
      } catch (e) {
        throw Boom.badImplementation('Error during getLog(). ' + e);
      }
      return h
        .response(log);
    },
    replayLog: async function(request, h) {
      let log;
      try {
        log = await getLog(request.params.id);
      } catch (e) {
        throw Boom.badImplementation('Error during getLog(). ' + e);
      }

      if (log.data.hasOwnProperty('replayable') && log.data.replayable === true) {
        let response;
        try {
          response = await request.server.inject(log.data.replayableRequest);
        } catch (e) {
          console.log('Error injecting replayable Log request', e);
        }
        return h.response(response.payload);
      }
      throw Boom.badRequest('This log is not marked as replayable');
    },
    lib: {
      data: createDataLog,
      request: createRequestLog,
    },
  };

  function getLogs() {
    return models.Log.findAll();
  }

  function getLog(id) {
    return models.Log.findByPk(id);
  }

  /*
    type: string, ex: property.submit.failed.street_number
    severity: ENUM (see models.db)
    data: json
   */
  function createDataLog(details) {
    return models.Log.create(details);
  }

  /*
    type: string, ex: property.submit.failed.street_number
    severity: ENUM (see models.db)
    request: request,
   */
  function createRequestLog(details) {
    // extract selected info from details.request, save to details.data
    details.data = extractRequestInfo(details.request);
    // delete details.request so details can be saved to database Log entity
    delete details.request;
    return models.Log.create(details);
  }

  function extractRequestInfo(request) {
    // TODO: Logs are not actually replayable unless we submit an auth token
    // (not just the subjectId), but that would either mean saving user
    // credentials in the database or lending the admin's auth token. Both of
    // these could be bad ideas.
    let data = {};
    data.replayable = true;
    data.replayableRequest = {
      method: request.method,
      url: request.url.path,
    };
    data.replayableRequest.payload = request.payload;
    if (request.hasOwnProperty('auth')) {
      data.replayableRequest.auth = {
        strategy: request.auth.strategy,
        credentials: {
          subjectId: request.auth.credentials.subjectId,
        },
      };
      // data.replayableRequest.auth = request.auth;
    }
    return data;
  }

};
