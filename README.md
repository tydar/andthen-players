# And Then players service

Microservice handling player information for the [And Then](https://github.com/tydar/andthen-infra/) web game.

Provides verified player credentials once account authentication has been achieved. Uses pg listen/notify to coordinate the creation of a new player for each new user.

TODOs:
* Rewrite authentication/authorization through middleware
* Use that middleware to refresh credentials via async communication with the auth service.
* Determine whether needs additional options for providing updated player tokens or if the endpoint is sufficient.
