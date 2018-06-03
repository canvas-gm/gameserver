/**
 * @namespace utils
 * @desc Utils functions
 */

// Require Third-party Dependencies
const { red } = require("chalk");
const is = require("@sindresorhus/is");

/**
 * @func timeout
 * @desc Asynchronous Timeout
 * @param {!Number} delay delay in ms
 * @returns {Promise<void>}
 */
function timeout(delay = 1000) {
    return new Promise((res) => setTimeout(res, delay));
}

/**
 * @exports utils/parseSocketMessages
 * @func parseSocketMessages
 * @desc Parse socket messages
 * @param {!String} msg complete message string or buffer
 * @returns {Mordor.SocketMessage[]}
 */
function parseSocketMessages(msg) {
    const ret = [];

    // Split the string by Return to line "\n"
    const lines = msg.split("\n");
    for (const line of lines) {
        // Continue if the line is empty!
        if (line.trim() === "") {
            continue;
        }

        try {
            const sockMessage = JSON.parse(line);
            if (!is.string(sockMessage.title)) {
                throw new TypeError("title field of socket message should be a string!");
            }
            ret.push({ title: sockMessage.title, body: sockMessage.body || {} });
        }
        catch (error) {
            console.error(red("Failed to parse the following socket message:"));
            console.error(red(error));
            continue;
        }
    }

    return ret;
}

module.exports = {
    parseSocketMessages,
    timeout
};
