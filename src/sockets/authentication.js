// Require Node.JS Dependencies
const { join } = require("path");

// Require Third-party Dependencies
const is = require("@sindresorhus/is");
const Datastore = require("nedb-promises");
const randToken = require("rand-token");

// Require settings
const settings = require("../../config/editableSettings.json").server.authentication;
const requirePassword = new Boolean(settings.password);
const dbDir = join(__dirname, "../../db");

// Always set anonymous to true if mordor is false
if (new Boolean(settings.mordor) === false) {
    settings.anonymous = true;
}

/**
 * @async
 * @func storeUser
 * @desc Store user in the local database
 * @param {Object} client client to authenticate
 * @returns {Promise<String>}
 */
async function storeUser(client) {
    // Load database
    const db = Datastore.create(join(dbDir, "storage.db"));
    await db.load();

    const token = randToken.generate(16);

    return token;
}

/**
 * @func authentication
 * @param {net.Socket} socket socket
 * @param {MordorClient} Mordor mordor api
 * @param {Object} options command options
 * @returns {Promise<void>}
 */
function authentication(socket, Mordor, { clientId, anonymous = false }) {
    return new Promise(async(resolve, reject) => {
        console.log("authentication event triggered!");
        if (socket.isAuthenticated) {
            return resolve();
        }

        // If anonymous (or Mordor off) authentication is requested!
        const forceAnonymous = !Mordor.isConnected;
        if (anonymous || forceAnonymous) {
            if (!forceAnonymous && settings.anonymous === false) {
                throw new Error("Anonymous authentication is not allowed by the server!");
            }

            // Request anonymous auth
            const { error, password } = await this.sendAndWait(socket, {
                title: "anonymousAuthRequest",
                body: { password: requirePassword },
                timeOut: 2000
            });
            if (!is.nullOrUndefined(error)) {
                return reject(error);
            }

            if (requirePassword && password !== settings.password) {
                throw new Error("Invalid Server password !");
            }
            socket.isAuthenticated = true;

            return resolve();
        }

        // Setup authentication timeout
        const timeOut = setTimeout(() => {
            reject(new Error("Authentication timeout!"));
        }, 5000);

        // Generate AccessToken on the remote Mordor!
        const { error: tokenError, serverId } = await Mordor.send("generateAccessToken", {
            socketId: socket.id,
            clientId
        }, 1000);
        if (!is.nullOrUndefined(tokenError)) {
            clearTimeout(timeOut);

            return reject(tokenError);
        }

        // Request AccessToken to client
        const { error: atError, accessToken } = await this.sendAndWait(socket, {
            title: "requestAccessToken",
            body: { serverId },
            timeOut: 2000
        });
        if (!is.nullOrUndefined(atError)) {
            clearTimeout(timeOut);

            return reject(atError);
        }

        // Verify token on Mordor
        const { error, client } = await Mordor.send("validateAccessToken", {
            accessToken,
            socketId: socket.id,
            clientId
        }, 1000);
        if (!is.nullOrUndefined(error)) {
            clearTimeout(timeOut);

            return reject(error);
        }

        // Clear timeout!
        clearTimeout(timeOut);
        await storeUser(client);
        socket.isAuthenticated = true;

        return resolve();
    });
}

module.exports = authentication;
