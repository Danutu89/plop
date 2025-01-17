"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineBypassData = combineBypassData;

var _chalk = _interopRequireDefault(require("chalk"));

var _consoleOut = _interopRequireDefault(require("./console-out.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Combine different types of bypass data
 * @param generator - The generator object involved
 * @param bypassArr - The array of overwritten properties
 * @param plopArgV - The original args passed to plop without using names
 */
function combineBypassData(generator, bypassArr, plopArgV) {
  // skip bypass if prompts is a function
  if (typeof generator.prompts === "function") {
    return [];
  } // Get named prompts that are passed to the command line


  const promptNames = generator.prompts.map(prompt => prompt.name); // Check if bypassArr is too long for promptNames

  if (bypassArr.length > promptNames.length) {
    console.error('Too many bypass arguments passed for "' + generator.name + '"');

    _consoleOut.default.getHelpMessage(generator);

    process.exit(1);
  }

  let namedBypassArr = [];

  if (Object.keys(plopArgV).length > 0) {
    // Let's make sure we made no whoopsy-poos (AKA passing incorrect inputs)
    let errors = false;
    Object.keys(plopArgV).forEach(arg => {
      if (!promptNames.find(name => name === arg) && arg !== "_") {
        console.error('"' + arg + '"' + ' is an invalid argument for "' + generator.name + '"');
        errors = true;
      }
    });

    if (errors) {
      _consoleOut.default.getHelpMessage(generator);

      process.exit(1);
    }

    namedBypassArr = promptNames.map(name => plopArgV[name] ? plopArgV[name] : undefined);
  } // merge the bypass data with named bypass values


  const mergedBypass = mergeArrays(bypassArr, namedBypassArr); // clean up `undefined` values

  return mergedBypass.map(v => v === undefined ? "_" : v);
}

function mergeArrays(baseArr, overlay) {
  const length = Math.max(baseArr.length, overlay.length);
  return new Array(length).fill().map((v, i) => overlay[i] !== undefined ? overlay[i] : baseArr[i]);
}