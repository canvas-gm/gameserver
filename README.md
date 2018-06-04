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
```
-> Versioned data should be stored as pure .json
-> Temporary or in-memory (for opt) should be stored in a nedb DB
```

- We should handle a logs mechanism
```
-> Native Node.JS Console
```

- How to authenticate users ?
```
-> Authenticate user by generating a AccessToken on the Mordor API.
-> Allow users to Authenticate in anonymous (With an optional server password).
-> Request approval
```

- How to manage ACL for a user or a group of users ?
```
-> ACL should be managed at the server level (not at the level project).
-> They can be applied to the server or a project.
```

- Manage project as a GIT repository
- How to achieve addon(s) ?
```
-> Registry?
-> ACL?
```

- Runtime behavior ?
