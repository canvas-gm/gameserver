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

        // Setup authentication timeout
        const timeOut = setTimeout(() => {
            reject(new Error("Authentication timeout!"));
        }, 5000);

        // Generate AccessToken on the remote Mordor!
        const { error: tokenError } = await Mordor.send("generateAccessToken", {
            socketId: socket.id,
            clientId
        }, 1000);
        if (!is.nullOrUndefined(tokenError)) {
            clearTimeout(timeOut);

            return reject(tokenError);
        }

        const { error: atError } = await this.sendAndWait(socket, {
            title: "requestAccessToken",
            timeOut: 2000
        });
        if (!is.nullOrUndefined(atError)) {
            clearTimeout(timeOut);

            return reject(atError);
        }

        // Clear timeout!
        clearTimeout(timeOut);

        return resolve();
    });
}

module.exports = authentication;
