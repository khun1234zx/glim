/**
 * Logger utility for Glim
 *
 * Provides unified logging capabilities with both console
 * and file output for better debugging and traceability.
 *
 * @module logger
 * @author Bagi
 */
import fs from "fs";
import path from "path";

/**
 * ANSI escape color codes for terminal output
 * Used to color log level labels in console output
 */
const COLORS = {
    INFO: "\x1b[32m", // green
    WARN: "\x1b[33m", // yellow
    ERROR: "\x1b[31m", // red
    DEBUG: "\x1b[34m", // blue
    RESET: "\x1b[0m",
};

/**
 * Logger class for structured application logging
 */
class Logger {
    /**
     * Create a new logger instance
     * @param {string} name - Logger name/component identifier
     * @param {string} logFile - Log file path (default: "glim.log")
     */
    constructor(name, logFile = "glim.log") {
        this.name = name;
        this.logFile = logFile;

        // Ensure log directory exists
        try {
            const dir = path.dirname(this.logFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (err) {
            console.error(`Could not create log directory: ${err.message}`);
        }
    }

    /**
     * Log a message with specified level
     * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
     * @param {string} message - Message to log
     */
    log(level, message = "") {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${this.name} - ${level} - ${message}`;

        // Strip ANSI color codes to get raw level
        const rawLevel = level.replace(/\x1b\[[0-9;]*m/g, "");

        // Choose appropriate console function based on raw level
        let consoleLog = console.log;
        switch (rawLevel) {
            case "ERROR":
                consoleLog = console.error;
                break;
            case "WARN":
                consoleLog = console.warn;
                break;
            case "DEBUG":
                consoleLog = console.debug;
                break;
        }

        // Log to console (with colored level)
        consoleLog(logMessage);

        // Log to file (strip ANSI codes from entire message)
        const plainLogMessage = `${timestamp} - ${this.name} - ${rawLevel} - ${message}`;
        try {
            fs.appendFileSync(this.logFile, plainLogMessage + "\n");
        } catch (err) {
            console.error(
                `${COLORS.ERROR}Failed to write to log file: ${err.message}${COLORS.RESET}`,
            );
        }
    }

    /**
     * Log an informational message
     * @param {string} message - Message to log
     */
    info(message) {
        this.log(`${COLORS.INFO}INFO${COLORS.RESET}`, message);
    }

    /**
     * Log an error message
     * @param {string} message - Error message to log
     */
    error(message) {
        this.log(`${COLORS.ERROR}ERROR${COLORS.RESET}`, message);
    }

    /**
     * Log a warning message
     * @param {string} message - Warning message to log
     */
    warn(message) {
        this.log(`${COLORS.WARN}WARN${COLORS.RESET}`, message);
    }

    /**
     * Log a debug message
     * @param {string} message - Debug message to log
     */
    debug(message) {
        if (!process.env.DEBUG) {
            return;
        }
        this.log(`${COLORS.DEBUG}DEBUG${COLORS.RESET}`, message);
    }
}

// Create and export default logger instances
const glimLogger = new Logger("glim");
export default glimLogger;

// Create specific loggers for different components
export const youtubeLogger = new Logger(
    "youtube_processor",
    "youtube_processor.log",
);
export const llmLogger = new Logger("llm", "llm_processor.log");
