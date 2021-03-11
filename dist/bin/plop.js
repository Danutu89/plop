#!/usr/bin/env node
"use strict";

var _plop = require("../src/plop.js");

var _minimist = _interopRequireDefault(require("minimist"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const args = process.argv.slice(2);
const argv = (0, _minimist.default)(args);

_plop.Plop.launch({
  cwd: argv.cwd,
  configPath: argv.plopfile,
  require: argv.require,
  completion: argv.completion
}, _plop.run);