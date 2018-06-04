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

/** @type {Mordor} */
let MordorSocket = null;

/**
 * @async
 * @func socketListening
 * @returns {Promise<void>}
 */
function socketListening() {
    console.log(`Socket server is listening on port ${settings.server.port}`);
}

/**
 * @func main
 * @desc Main (global) handler of the project
 * @returns {Promise<void>}
 */
async function main() {
    // Create and initialize Mordor Client connection
    MordorSocket = await new Mordor().init();
    // MordorSocket.client.on("end", process.exit);

    // Initialize Socket Server
    const socketServer = createServer(socketHandler);
    socketServer.on("error", console.error);
    socketServer.on("listening", socketListening);
    socketServer.listen(settings.server.port);
}
main().catch(console.error);
