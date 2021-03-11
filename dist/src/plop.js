#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = run;
exports.progressSpinner = exports.Plop = void 0;

var _path = _interopRequireDefault(require("path"));

var _liftoff = _interopRequireDefault(require("liftoff"));

var _minimist = _interopRequireDefault(require("minimist"));

var _v8flags = _interopRequireDefault(require("v8flags"));

var _interpret = _interopRequireDefault(require("interpret"));

var _chalk = _interopRequireDefault(require("chalk"));

var _ora = _interopRequireDefault(require("ora"));

var _nodePlop = _interopRequireDefault(require("node-plop"));

var _consoleOut = _interopRequireDefault(require("./console-out.js"));

var _bypass = require("./bypass.js");

var _inputProcessing = require("./input-processing.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const args = process.argv.slice(2);
const argv = (0, _minimist.default)(args);
const Plop = new _liftoff.default({
  name: "plop",
  extensions: _interpret.default.jsVariants,
  v8flags: _v8flags.default
});
exports.Plop = Plop;
const progressSpinner = (0, _ora.default)();
/**
 * The function to pass as the second argument to `Plop.launch`
 * @param env - This is passed implicitly
 * @param _ - Passed implicitly. Not needed, but allows for `passArgsBeforeDashes` to be explicitly passed
 * @param passArgsBeforeDashes - An opt-in `true` boolean that will allow merging of plop CLI API and generator API
 * @example
 * Plop.launch({}, env => run(env, undefined, true))
 *
 * !!!!!! WARNING !!!!!!
 * One of the reasons we default generator arguments as anything past `--` is a few reasons:
 * Primarily that there may be name-spacing issues when combining the arg order and named arg passing
 */

exports.progressSpinner = progressSpinner;

function run(env, _, passArgsBeforeDashes) {
  const plopfilePath = env.configPath; // handle basic argument flags like --help, --version, etc

  (0, _inputProcessing.handleArgFlags)(env); // use base path from argv or env if any is present, otherwise set it to the plopfile directory

  const destBasePath = argv.dest || env.dest;
  const plop = (0, _nodePlop.default)(plopfilePath, {
    destBasePath: destBasePath ? _path.default.resolve(destBasePath) : undefined,
    force: argv.force === true || argv.f === true || false
  });
  const generators = plop.getGeneratorList();
  const generatorNames = generators.map(v => v.name);
  const {
    generatorName,
    bypassArr,
    plopArgV
  } = (0, _inputProcessing.getBypassAndGenerator)(plop, passArgsBeforeDashes); // look up a generator and run it with calculated bypass data

  const runGeneratorByName = name => {
    const generator = plop.getGenerator(name);
    const bypassData = (0, _bypass.combineBypassData)(generator, bypassArr, plopArgV);
    doThePlop(generator, bypassData);
  }; // hmmmm, couldn't identify a generator in the user's input


  if (!generators.length) {
    // no generators?! there's clearly something wrong here
    console.error("No generator found in plopfile");
    process.exit(1);
  } else if (!generatorName && generators.length === 1) {
    // only one generator in this plopfile... let's assume they
    // want to run that one!
    runGeneratorByName(generatorNames[0]);
  } else if (!generatorName && generators.length > 1 && !bypassArr.length) {
    // more than one generator? we'll have to ask the user which
    // one they want to run.
    _consoleOut.default.chooseOptionFromList(generators, plop.getWelcomeMessage()).then(runGeneratorByName).catch(err => {
      console.error("Something went wrong with selecting a generator", err);
    });
  } else if (generatorNames.includes(generatorName)) {
    // we have found the generator, run it!
    runGeneratorByName(generatorName);
  } else {
    // we just can't make sense of your input... sorry :-(
    const fuzyGenName = (generatorName + " " + args.join(" ")).trim();
    console.error('Could not find a generator for "' + fuzyGenName + '"');
    process.exit(1);
  }
} /////
// everybody to the plop!
//


function doThePlop(generator, bypassArr) {
  generator.runPrompts(bypassArr).then(answers => {
    const noMap = argv["show-type-names"] || argv.t;

    const onComment = msg => {
      progressSpinner.info(msg);
      progressSpinner.start();
    };

    const onSuccess = change => {
      let line = "";

      if (change.type) {
        line += ` ${_consoleOut.default.typeMap(change.type, noMap)}`;
      }

      if (change.path) {
        line += ` ${change.path}`;
      }

      progressSpinner.succeed(line);
      progressSpinner.start();
    };

    const onFailure = fail => {
      let line = "";

      if (fail.type) {
        line += ` ${_consoleOut.default.typeMap(fail.type, noMap)}`;
      }

      if (fail.path) {
        line += ` ${fail.path}`;
      }

      const errMsg = fail.error || fail.message;

      if (errMsg) {
        line += ` ${errMsg}`;
      }

      progressSpinner.fail(line);
      progressSpinner.start();
    };

    progressSpinner.start();
    return generator.runActions(answers, {
      onSuccess,
      onFailure,
      onComment
    }).then(() => progressSpinner.stop());
  }).catch(function (err) {
    console.error(_chalk.default.red("[ERROR]"), err.message);
    process.exit(1);
  });
}