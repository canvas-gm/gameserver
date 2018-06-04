require("make-promises-safe");

// Require Node.JS Dependencies
const { createServer } = require("net");
const { promisify } = require("util");
const { join } = require("path");
const {
    mkdir,
    writeFile,
    readFile
} = require("fs");

// Require Third-party Dependencies
const uuid = require("uuid/v4");
const is = require("@sindresorhus/is");
const inquirer = require("inquirer");
const { green } = require("chalk");
const winston = require("winston");

// Require Internal Dependencies
const Mordor = require("./src/mordor");
const socketHandler = require("./src/socketHandler");
const { hasEntry } = require("./src/utils");

/**
 * @const settings
 * @type {server.Configuration}
 */
const settings = require("./config/settings.json");

// Asynchronous FS Wrapper
const AsyncFS = {
    mkdir: promisify(mkdir),
    writeFile: promisify(writeFile),
    readFile: promisify(readFile)
};

/** @type {Mordor} */
let MordorSocket = null;

/** @type {server.Manifest} */
let Manifest = null;

// Winston logger;
let logger = null;

/**
 * @async
 * @func verifyRootProject
 * @desc Initialize root project!
 * @returns {Promise<server.Manifest>}
 */
async function verifyRootProject() {
    // Functions var
    const projectsDir = join(__dirname, "projects");
    const logsDir = join(__dirname, "logs");
    const manifestPath = join(projectsDir, "manifest.json");

    // Verify if we have access to directories and files
    if (await hasEntry(projectsDir) === false) {
        await AsyncFS.mkdir(projectsDir);
    }
    if (await hasEntry(logsDir) === false) {
        await AsyncFS.mkdir(logsDir);
    }

    // Initialize logger on global
    logger = winston.createLogger({
        level: "info",
        format: winston.format.json(),
        transports: [
            new winston.transports.File({
                filename: join(logsDir, "stdout.log")
            })
        ]
    });
    global.logger = logger;

    // Get server manifest!
    if (await hasEntry(manifestPath) === false) {

        // Prompt for missing information!
        const { serverName } = await inquirer.prompt([
            {
                type: "input",
                name: "serverName",
                message: "Name of your server ?"
            }
        ]);

        const serverConfiguration = {
            uid: uuid(),
            name: serverName,
            projects: []
        };
        await AsyncFS.writeFile(manifestPath, JSON.stringify(serverConfiguration, null, 2));

        return serverConfiguration;
    }

    return JSON.parse(
        (await AsyncFS.readFile(manifestPath)).toString()
    );
}

/**
 * @async
 * @func socketListening
 * @returns {Promise<void>}
 */
async function socketListening() {
    console.log(`Socket server is listening on port ${settings.server.port}`);

    // Register server!
    const { error } = await MordorSocket.send("registerServer", {
        uid: Manifest.uid,
        name: Manifest.name
    });
    if (!is.nullOrUndefined(error)) {
        throw new Error(error.message);
    }
    console.log(green("Successfully registered server on Mordor!"));
    logger.log({
        level: "info",
        message: "Successfully registered server on Mordor!"
    });

    // Register projects!
    if (Manifest.projects.length > 0) {
        // ...Do thing here!
    }
}

/**
 * @func main
 * @desc Main (global) handler of the project
 * @returns {Promise<void>}
 */
async function main() {
    // Verify if the project is correctly initialized!
    Manifest = await verifyRootProject();

    // Create and initialize Mordor Client connection
    MordorSocket = await new Mordor().init();

    // Initialize Socket Server
    const socketServer = createServer(socketHandler);
    socketServer.on("error", console.error);
    socketServer.on("listening", socketListening);
    socketServer.listen(settings.server.port);
}
main().catch(function errorHandler(error) {
    console.error(error);
    if (logger) {
        logger.log({
            level: "error",
            message: error.toString()
        });
    }
});
