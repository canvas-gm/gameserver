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
 * @desc Maximum number of requests from MordorClient
 */
const MAX_REQUESTS = 60;

/**
 * @class MordorClient
 * @extends events
 *
 * @property {Number} requestsCount
 * @property {Boolean} isConnected Know if Socket is connected
 * @property {Boolean} alwaysRestart Ask the client to always re-establish Socket connexion
 * @property {net.Socket} client
 */
class MordorClient extends events {

    /**
     * @constructor
     */
    constructor() {
        super();
        this.on("error", console.error);
        this.requestsCount = 0;
        this.isConnected = false;
        this.alwaysRestart = true;

        /** @type {net.Socket} */
        this.client = null;

        /**
         * Close every sockets properly on critical error(s)
         */
        process.once("SIGINT", this.close.bind(this));
        process.once("exit", this.close.bind(this));
    }

    /**
     * @method close
     * @desc Close MordorClient client
     * @memberof MordorClient#
     * @returns {void}
     */
    close() {
        this.alwaysRestart = false;
        if (this.client) {
            this.client.destroy();
        }
        this.isConnected = false;
        setImmediate(process.exit);
    }

    /**
     * @async
     * @method init
     * @desc Initialize socket client
     * @memberof MordorClient#
     * @returns {Promise<this>}
     */
    async init() {
        this.client = null;
        await this._synchroniseConnection();
        this.isConnected = true;

        // Handle (parse) socket data!
        this.client.on("data", this.dataHandler.bind(this));

        // If MordorClient connexion end, try to re-synchronise
        this.client.on("end", async() => {
            if (!this.alwaysRestart) {
                return;
            }
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
            console.log(blue("Ping received from MordorClient. Send-it back!"));
            this.send("ping", dt, 0).catch(console.error);
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
                this.client = await MordorClient.initializeSocketConnection();
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
     * @memberof MordorClient#
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
     * @desc Send a new message to the MordorClient!
     * @memberof MordorClient#
     * @param {!String} title message title
     * @param {Object=} [body={}] message body
     * @param {Number=} [timeOut=5000] Send timeout!
     * @returns {Promise<T | void>}
     *
     * @throws {TypeError}
     */
    send(title, body = {}, timeOut = 5000) {
        return new Promise((resolve, reject) => {
            if (!is.string(title)) {
                throw new TypeError("title argument should be typeof string");
            }
            const data = JSON.stringify({ title, body });
            this.client.write(Buffer.from(data.concat("\n")));

            // Return if we dont expect a return from MordorClient
            if (timeOut === 0) {
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
                reject(new Error(`Timeout message ${title}`));
            }, timeOut);
            this.addListener(title, handler);

            return void 0;
        });
    }

}

module.exports = MordorClient;
