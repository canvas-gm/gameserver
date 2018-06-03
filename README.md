# gameserver
CGM Game Server

## Getting started

```bash
$ npm install
$ npm start
```

## TODO

> Think about how to scale for real-time performance

- How to store settings and projects ?
 -> Versioned data should be stored as pure .json
 -> Temporary or in-memory (for opt) should be stored in a nedb DB

- We should handle a logs mechanism

- On start:
 -> Initialize a Socket Connection to the Central API (Mordor)
 -> Initialize the Socket Server.
 -> Registering the Server and be sure to be the only one registered!
 -> Registering (Public) Projects of the server (none in the beginning).

- How to authenticate users ?
 -> Authenticate user by generating a AccessToken on the Mordor API.
 -> Allow users to Authenticate in anonymous (With an optional server password).
 -> Request approval

- How to manage ACL for a user or a group of users ?
 -> ACL should be managed at the server level (not at the level project).
 -> They can be applied to the server or a project.

- Manage project as a GIT repository
- How to achieve addon(s) ?
 -> Registry?
 -> ACL?

- Runtime behavior ?
