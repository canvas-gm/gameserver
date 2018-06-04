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
const settings = require("../config/editableSettings.json");

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
        this.client = null;
        await this._synchroniseConnection();

        // Handle (parse) socket data!
        this.client.on("data", this.dataHandler.bind(this));

        // If mordor connexion end, try to re-synchronise
        this.client.on("end", async() => {
            try {
                await timeout(1000);
                await this.init();
            }
            catch (error) {
                console.error(error);
                process.exit(1);
            }
        });

        // Handle event ping/pong
        this.on("ping", (dt) => {
            console.log(blue("Ping received from Mordor. Send-it back!"));
            this.send("ping", dt, true).catch(console.error);
        });
        console.log(green("Successfully initialized socket connection"));
        global.logger.log({
            level: "info",
            message: "Successfully initialized socket connection"
        });

        return this;
    }

    /**
     * @private
     * @async
     * @method _synchroniseConnection
     * @desc Initialize (or-resync) socket connection
     * @returns {Promise<void>}
     */
    async _synchroniseConnection() {
        const addr = `${settings.mordor.socket.host}:${settings.mordor.socket.port}`;
        console.log(yellow(`Try to iniatiliaze remote socket conn on ${addr}`));
        global.logger.log({
            level: "info",
            message: `Try to iniatiliaze remote socket conn on ${addr}`
        });

        while (is.nullOrUndefined(this.client)) {
            try {
                this.client = await Mordor.initializeSocketConnection();
            }
            catch (error) {
                if (error.code === "ECONNREFUSED") {
                    const message = `Unable to establish Socket conn on remote server with addr ${addr}`;
                    console.error(red(message));
                    global.logger.log({ level: "warn", message });
                }
                console.error(
                    blue(`We will made a new attempt in ${settings.mordor.retryInterval} ms!`)
                );
                await timeout(settings.mordor.retryInterval);
            }
        }
    }

    /**
     * @static
     * @func initializeSocketConnection
     * @returns {Promise<Socket>}
     */
    static initializeSocketConnection() {
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
     * @param {Boolean=} [dontExpectReturn=false] True if we dont expect a return from Mordor
     * @returns {Promise<T | void>}
     *
     * @throws {TypeError}
     */
    send(title, body = {}, dontExpectReturn = false) {
        return new Promise((resolve, reject) => {
            if (!is.string(title)) {
                throw new TypeError("title argument should be typeof string");
            }
            const data = JSON.stringify({ title, body });
            this.client.write(Buffer.from(data.concat("\n")));

            // Return if we dont expect a return from Mordor
            if (dontExpectReturn) {
                return resolve();
            }

            /** @type {NodeJS.Timer} */
            let timeOutRef = null;
            function handler(data) {
                clearTimeout(timeOutRef);
                resolve(data);
            }
            timeOutRef = setTimeout(() => {
                this.removeListener(title, handler);
                reject(new Error("Timeout"));
            }, 5000);
            this.addListener(title, handler);

            return void 0;
        });
    }

}

module.exports = Mordor;
