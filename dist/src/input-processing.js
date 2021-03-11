"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBypassAndGenerator = getBypassAndGenerator;
exports.handleArgFlags = handleArgFlags;

var _chalk = _interopRequireDefault(require("chalk"));

var _minimist = _interopRequireDefault(require("minimist"));

var _consoleOut = _interopRequireDefault(require("./console-out.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const args = process.argv.slice(2);
const argv = (0, _minimist.default)(args);

/**
 * Parses the user input to identify the generator to run and any bypass data
 * @param plop - The plop context
 * @param passArgsBeforeDashes - Should we pass args before `--` to the generator API
 */
function getBypassAndGenerator(plop, passArgsBeforeDashes) {
  // See if there are args to pass to generator
  const eoaIndex = args.indexOf("--");
  const {
    plopArgV,
    eoaArg
  } = passArgsBeforeDashes ? {
    plopArgV: argv
  } : eoaIndex === -1 ? {
    plopArgV: []
  } : {
    plopArgV: (0, _minimist.default)(args.slice(eoaIndex + 1, args.length)),
    eoaArg: args[eoaIndex + 1]
  }; // locate the generator name based on input and take the rest of the
  // user's input as prompt bypass data to be passed into the generator

  let generatorName = "";
  let bypassArr = [];
  const generatorNames = plop.getGeneratorList().map(v => v.name);

  for (let i = 0; i < argv._.length; i++) {
    const nameTest = (generatorName.length ? generatorName + " " : "") + argv._[i];

    if (listHasOptionThatStartsWith(generatorNames, nameTest)) {
      generatorName = nameTest;
    } else {
      let index = argv._.findIndex(arg => arg === eoaArg); // If can't find index, slice until the very end - allowing all `_` to be passed


      index = index !== -1 ? index : argv._.length; // Force `'_'` to become undefined in nameless bypassArr

      bypassArr = argv._.slice(i, index).map(arg => /^_+$/.test(arg) ? undefined : arg);
      break;
    }
  }

  return {
    generatorName,
    bypassArr,
    plopArgV
  };
}

function listHasOptionThatStartsWith(list, prefix) {
  return list.some(function (txt) {
    return txt.indexOf(prefix) === 0;
  });
}
/**
 * Handles all basic argument flags
 * @param env - Values parsed by Liftoff
 */


function handleArgFlags(env) {
  // Make sure that we're not overwritting `help`, `init,` or `version` args in generators
  if (argv._.length === 0) {
    // handle request for usage and options
    if (argv.help || argv.h) {
      _consoleOut.default.displayHelpScreen();

      process.exit(0);
    } // handle request for initializing a new plopfile


    if (argv.init || argv.i) {
      const force = argv.force === true || argv.f === true || false;

      try {
        _consoleOut.default.createInitPlopfile(force);

        process.exit(0);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    }
  } // abort if there's no plopfile found


  if (env.configPath == null) {
    console.error("No plopfile found");

    _consoleOut.default.displayHelpScreen();

    process.exit(1);
  }
}