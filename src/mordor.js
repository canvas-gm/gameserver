// Require Node.JS Dependencies
const net = require("net");
const events = require("events");

// Require Third-party dependencies
const is = require("@sindresorhus/is");
const { red, blue, yellow, green } = require("chalk");

// Require Internal Dependencies
const { timeout, parseSocketMessages } = require("./utils");

/**
 * @const settings
 * @desc Project configuration!
 * @type {server.Configuration}
 */
const settings = require("../config/settings.json");

/**
 * @const MAX_REQUESTS
 * @type {Number}
 * @desc Maximum number of requests from Mordor
 */
const MAX_REQUESTS = 60;

/**
 * @class Mordor
 * @extends events
 *
 * @property {Number} requestsCount
 * @property {net.Socket} client
 */
class Mordor extends events {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.on("error", console.error);
        this.requestsCount = 0;

        /** @type {net.Socket} */
        this.client = null;
    }

    /**
     * @async
     * @method init
     * @desc Initialize socket client
     * @memberof Mordor#
     * @returns {Promise<this>}
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

        this.client.on("data", this.dataHandler.bind(this));
        this.client.on("end", () => {
            this.emit("close");
            console.log("Mordor Socket connection closed!");
        });
        console.log(green("Successfully initialized socket connection"));

        return this;
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
     * @method dataHandler
     * @desc Method to handle socket data
     * @memberof Mordor#
     * @param {!Buffer} data data
     * @returns {void}
     */
    dataHandler(data) {
        // Return if data is undefined
        if (is.nullOrUndefined(data)) {
            return void 0;
        }

        // Parse received message(s).
        const messages = parseSocketMessages(data.toString());

        // Verify if the maximum requests is below the threshold
        this.requestsCount += messages.length;
        if (this.requestsCount > MAX_REQUESTS) {
            return this.client.destroy("Maximum number of requests hit!");
        }

        // Handle message
        for (const message of messages) {
            this.emit(message.title, message.body);
        }

        return void 0;
    }

    /**
     * @public
     * @method send
     * @template T
     * @desc Send a new message to the mordor!
     * @memberof Mordor#
     * @param {!String} title message title
     * @param {Object=} [body={}] message body
     * @returns {Promise<T>}
     *
     * @throws {TypeError}
     */
    send(title, body = {}) {
        return new Promise((resolve, reject) => {
            if (!is.string(title)) {
                throw new TypeError("title argument should be typeof string");
            }
            const data = JSON.stringify({ title, body });
            this.client.write(Buffer.from(data.concat("\n")));

            /** @type {NodeJS.Timer} */
            let timeOutRef = null;
            function handler(data) {
                if (timeOutRef) {
                    clearTimeout(timeOutRef);
                }
                resolve(data);
            }
            timeOutRef = setTimeout(() => {
                this.removeListener(title, handler);
                reject(new Error("Timeout"));
            }, 5000);
            this.addListener(title, handler);
        });
    }

}

module.exports = Mordor;
