# HousingDB Documentation

We have a built in interface to explore and make requests against the api using a browser. The `/documentation` uri has a swagger interface for our api.

## Authorized Requests (Logged in API calls)

Normally a user would login via the front end which would redirect them to our auth server, which would send them back to the front end with a code which would get exchanged with the auth server for an access token which would seamlessly be passed along with requests to the api.

We have created some helper routes on the api to do this process without the front end. If you want to use authorized requests you can do this using the swagger interface.

1. Go to /documentation and scroll to the 'Auth' section
2. Expand `/auth/login` and follow the implementation notes. (Open the response text url in a new tab and log in).
3. After you login you will be redirected to a page with an access token. Paste the access token on screen in the `api_key` box on the `/documentation` page.
