/**
 * Formats a log output line using a structured, predictable timestamp architecture.
 * @param {string} level - Log categorization tier (INFO, WARN, ERROR)
 * @param {any} arg1 - Either a context object or the message
 * @param {string} [arg2] - The message if arg1 is a context object
 */
const formatLog = (level, arg1, arg2) => {
    const timestamp = new Date().toISOString();
    let context = null;
    let message = '';
    
    if (typeof arg2 === 'string') {
        context = arg1;
        message = arg2;
    } else {
        message = arg1;
    }
    
    let logLine = `[${timestamp}] [${level}] ${message}`;
    if (context) {
        logLine += ` | ${JSON.stringify(context)}`;
    }
    
    return logLine;
};

/** Logs a standard tracking or event operation informational message. */
export const info = (arg1, arg2) => console.log(formatLog('INFO', arg1, arg2));

/** Logs debug-level messages (for development only). */
export const debug = (arg1, arg2) => console.log(formatLog('DEBUG', arg1, arg2));

/** Logs non-fatal unexpected anomalies or temporary service drops. */
export const warn = (arg1, arg2) => console.warn(formatLog('WARN', arg1, arg2));

/** Logs fatal runtime execution traps or exception issues. */
export const error = (arg1, arg2) => console.error(formatLog('ERROR', arg1, arg2));