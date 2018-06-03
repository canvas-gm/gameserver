// Require Node.JS Dependencies
const net = require("net");
const events = require("events");

// Require Third-party dependencies
const is = require("@sindresorhus/is");
const { red, blue, yellow, green } = require("chalk");

// Require Internal Dependencies
const { timeout, parseSocketMessages } = require("../utils");

/**
 * @const settings
 * @desc Project configuration!
 * @type {server.Configuration}
 */
const settings = require("../../config/settings.json");

/**
 * @class Mordor
 * @extends events
 */
class Mordor extends events {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.on("error", console.error);
    }

    /**
     * @async
     * @method init
     * @returns {Promise<void>}
     *
     * @fires ready
     */
    async init() {
        const addr = `${settings.mordor.socket.host}:${settings.mordor.socket.port}`;
        console.log(yellow(`Try to iniatiliaze remote socket conn on ${addr}`));
        while (is.nullOrUndefined(this.client)) {
            try {
                this.client = await Mordor.initializeClient();
            }
            catch (error) {
                if (error.code === "ECONNREFUSED") {
                    console.error(
                        red(`Unable to establish Socket conn on remote server with addr ${addr}`)
                    );
                }
                console.error(
                    blue(`We will made a new attempt in ${settings.mordor.retryInterval} ms!`)
                );
                await timeout(settings.mordor.retryInterval);
            }
        }

        this.client.on("data", Mordor.dataHandler);
        this.client.on("end", Mordor.closeHandler);
        console.log(green("Successfully initialized socket connection"));
        this.emit("ready");
    }

    /**
     * @static
     * @func initializeClient
     * @returns {Promise<Socket>}
     */
    static initializeClient() {
        return new Promise((resolve, reject) => {
            const client = net.connect(settings.mordor.socket, () => {
                resolve(client);
            });
            client.on("error", reject);
        });
    }

    /**
     * @static
     * @method dataHandler
     * @desc Method to handle socket data
     * @param {*} data data
     * @returns {void}
     */
    static dataHandler(data) {
        console.log("data received!");
        const messages = parseSocketMessages(data.toString());
        console.log(messages);
    }

    /**
     * @static
     * @method closeHandler
     * @desc socket close (end) handler
     * @returns {void}
     */
    static closeHandler() {
        console.log("connexion closed!");
    }

}

module.exports = Mordor;
