// Require Third-party Dependencies
const is = require("@sindresorhus/is");

/**
 * @func authentication
 * @param {net.Socket} socket socket
 * @param {MordorClient} Mordor mordor api
 * @param {Object} options command options
 * @returns {Promise<void>}
 */
function authentication(socket, Mordor, { clientId }) {
    return new Promise(async(resolve, reject) => {
        console.log("authentication event triggered!");
        if (socket.isAuthenticated) {
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
        const { error } = await Mordor.send("validateAccessToken", {
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
        socket.isAuthenticated = true;

        return resolve();
    });
}

module.exports = authentication;
