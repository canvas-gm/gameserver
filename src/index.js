require("make-promises-safe");

// Require Internal Dependencies
const Mordor = require("./class/mordor");

/**
 * @func main
 * @returns {Promise<void>}
 */
async function main() {
    const MordorSocket = new Mordor();
    await MordorSocket.init();
}
main().catch(console.error);
