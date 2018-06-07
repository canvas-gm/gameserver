require("make-promises-safe");

// Require Node.JS Dependencies
const { createServer } = require("net");
const { promisify } = require("util");
const { join } = require("path");
const {
    mkdir,
    writeFile,
    readFile,
    writeFileSync
} = require("fs");

// Require Third-party Dependencies
const uuid = require("uuid/v4");
const is = require("@sindresorhus/is");
const inquirer = require("inquirer");
const { green } = require("chalk");
const winston = require("winston");

/**
 * @const settings
 * @type {server.Configuration}
 */
let settings;
try {
    settings = require("./config/editableSettings.json");
}
catch (error) {
    console.log("Editable configuration created in directory /config");
    console.log("Edit it like you want!");
    const defaultSettings = require("./config/defaultSettings.json");
    writeFileSync(
        join(__dirname, "config/editableSettings.json"),
        JSON.stringify(defaultSettings)
    );
    process.exit(0);
}

// Require Internal Dependencies
const MordorClient = require("./src/MordorClient");
const { hasEntry } = require("./src/utils");
const SocketHandler = new (require("./src/SocketHandler"))();
const autoLoader = require("./src/autoloader");

// Asynchronous FS Wrapper
const AsyncFS = {
    mkdir: promisify(mkdir),
    writeFile: promisify(writeFile),
    readFile: promisify(readFile)
};

/** @type {MordorClient} */
let MordorClientSocket = null;

/** @type {server.Manifest} */
let Manifest = null;

/**
 * @async
 * @func initializeProject
 * @desc Initialize root project!
 * @returns {Promise<server.Manifest>}
 */
async function initializeProject() {
    // Functions var
    const projectsDir = join(__dirname, "projects");
    const logsDir = join(__dirname, "logs");
    const manifestPath = join(projectsDir, "manifest.json");

    // Verify if we have access to directories and files
    for (const dir of [projectsDir, logsDir]) {
        if (await hasEntry(dir) === false) {
            await AsyncFS.mkdir(dir);
        }
    }

    // Initialize logger on global
    global.logger = winston.createLogger({
        level: "info",
        format: winston.format.json(),
        transports: [
            new winston.transports.File({
                filename: join(logsDir, "stdout.log")
            })
        ]
    });

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
 * @func socketIsListening
 * @desc Register server and projects to Mordor when the Socket Server is listening!
 * @returns {Promise<void>}
 */
async function socketIsListening() {
    console.log(`Socket server is listening on port ${settings.server.port}`);

    // Register server!
    const { error } = await MordorClientSocket.send("registerServer", {
        uid: Manifest.uid,
        name: Manifest.name
    });
    if (!is.nullOrUndefined(error)) {
        throw new Error(error.message);
    }
    console.log(green("Successfully registered server on MordorClient!"));
    global.logger.log({
        level: "info",
        message: "Successfully registered server on MordorClient!"
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
    Manifest = await initializeProject();
    MordorClientSocket = await new MordorClient().init();

    // Load all sockets commands.
    autoLoader(SocketHandler, MordorClientSocket, join(__dirname, "src/sockets"));

    // Initialize Socket Server
    const socketServer = createServer(SocketHandler.connectSocket);
    socketServer.on("error", console.error);
    socketServer.on("listening", socketIsListening);
    socketServer.listen(settings.server.port);
}

// Execute main handler!
try {
    main();
}
catch (error) {
    console.error(error);
    if (global.logger) {
        global.logger.log({ level: "error", message: error.toString() });
    }
}
