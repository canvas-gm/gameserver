# Auth flow

1. App Connect to gameserv
2. Gameserv ask mordor to generate an AccessToken
3. Mordor respond ok or ko when to the .2
4. Gameserv respond ok or ko to .1 (ok is equal to request AccessToken)
5. App ask mordor for AccessToken
6. Mordor respond ok or ko to .5
7. App send AccessToken to Gameserv (to get final access).
8. Gameserv ask Mordor if the AccessToken is valid
9. Mordor respond ok or ko to .8
10. Gameserv respond ok or ko to .7
11. App Enjoy :)
