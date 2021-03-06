require('colors');
const _ = require('./lodash');
const get = _.get;
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const fetch = require('node-fetch');

/*
 Public API.
 */
exports.contentsDiffer = contentsDiffer;
exports.safeRead = safeRead;
exports.safeWrite = safeWrite;
exports.log = log;
exports.logChange = logChange;
exports.logRemoval = logRemoval;
exports.logError = logError;
exports.parameterizeString = parameterizeString;
exports.lowerCaseFirst = lowerCaseFirst;
exports.fetch = fetch;
exports.normalizePath = normalizePath;

/*
 Implementation.
 */

/**
 * Looks at two strings to see if they contain the same content, ignoring line endings.
 * @param a
 * @param b
 * @returns {boolean}
 */
function contentsDiffer(a, b) {
  // Are a and b both empty?
  if (!a && !b) {
    return false;
  }
  // Is only one of them empty?
  if (!a || !b) {
    return true;
  }
  // Otherwise, compare them while ignoring line endings to see if they're equivalent.
  return normalizeLineEndings(a) !== normalizeLineEndings(b);
}

/**
 * Attempts to read in the provided file, returning the string contents if it exists, or null.
 * @param file
 * @returns {string}
 */
function safeRead(file) {
  let url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  return fs.existsSync(url)
    ? fs.readFileSync(url, 'UTF-8')
    : null;
}

/**
 * Writes the contents to the file, making sure the parent directories of the file exist.
 * @param file
 * @param contents
 */
function safeWrite(file, contents) {
  const url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  const dirs = url.split(path.sep).slice(0, -1);
  // Note: we start at 1 to avoid trying to create the root directory.
  for (let i = 1; i < dirs.length; i++) {
    let collectivePath = dirs.slice(0, i + 1).join(path.sep);
    if (!fs.existsSync(collectivePath)) {
      fs.mkdirSync(collectivePath);
    }
  }
  fs.writeFileSync(url, contents, 'UTF-8');
}

/**
 * If the file doesn't exist, logs a message saying it is being created. Otherwise, it's being updated.
 * @param file
 */
function logChange(file) {
  let url = normalizePath(typeof file === 'string'
    ? file
    : path.join(file.dirname, file.basename));
  log((`${fs.existsSync(url) ? 'updating' : 'creating'}: `).cyan + url.magenta);
}

/**
 * Logs a message saying the file is being removed.
 * @param url
 */
function logRemoval(url) {
  log((`removing: `).red + url.magenta);
}

/**
 * Logs an error.
 * @param text
 * @param [err]
 */
function logError(text, err) {
  log(text, err, true);
}

/**
 * Logs a message to the console with a nice prefix.
 * @param text The text to write.
 * @param [error] The optional error to log
 * @param writeAsError If we should use console.error or console.log.
 */
function log(text, error = null, writeAsError = false) {
  if (argv.silent) {
    return;
  }
  let prefix = `[${new Date().toTimeString().split(' ')[0]}] `.gray;
  if (writeAsError) {
    if (error) {
      console.error(prefix + text, error);
    }
    else {
      console.error(prefix + text);
    }
  }
  else {
    console.log(prefix + text);
  }
}

/**
 * Given a string with _parameters_ within it, substitute them with the real values from the given context.
 * @param str
 * @param context
 * @returns {string}
 */
function parameterizeString(str, context) {
  return str.replace(
    /_[a-z]*\.?[a-z]+_/ig,
    match => {
      const variableName = match.slice(1, -1);
      return get(context, variableName)
        || get(context, variableName.toLowerCase())
        || get(context, variableName.toUpperCase())
        || match;
    });
}

/**
 * Lowers the first letter of the provided string, leaving the rest of it alone.
 * @param val
 * @returns {string}
 */
function lowerCaseFirst(val) {
  if (!val || !val.toLowerCase) {
    return val;
  }
  return val[0].toLowerCase() + val.substr(1);
}

/**
 * Normalizes a path across platforms. (Root / paths are assumed to be on C:\ on windows).
 * @param ref
 * @returns {string}
 */
function normalizePath(ref) {
  return ref && ref.startsWith('/') ? path.resolve(ref) : path.normalize(ref);
}

/**
 * Normalizes line endings for comparison purposes.
 * @param contents
 * @returns {string}
 */
function normalizeLineEndings(contents) {
  return contents.replace(/\r\n?/g, '\n');
}
