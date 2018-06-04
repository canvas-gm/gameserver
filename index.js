require("make-promises-safe");

// Require Node.JS Dependencies
const { createServer } = require("net");

// Require Internal Dependencies
const Mordor = require("./src/mordor");
const socketHandler = require("./src/socketHandler");

/**
 * @const settings
 * @type {server.Configuration}
 */
const settings = require("./config/settings.json");

/**
 * @func main
 * @desc Main (global) handler of the project
 * @returns {Promise<void>}
 */
async function main() {
    // Create and initialize Mordor Client connection
    const MordorSocket = await new Mordor().init();

    // Initialize Socket Server
    const socketServer = createServer(socketHandler);
    socketServer.on("error", console.error);
    socketServer.on("listening", function listening() {
        console.log(`Socket server is listening on port ${settings.server.port}`);
    });
    socketServer.listen(settings.server.port);
}
main().catch(console.error);
