"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

var _nodePlop = _interopRequireDefault(require("node-plop"));

var _fs = _interopRequireDefault(require("fs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultChoosingMessage = " Please choose a generator.";

var _default = function () {
  function getHelpMessage(generator) {
    const maxLen = Math.max(...generator.prompts.map(prompt => prompt.name.length));
    console.log(["", _chalk.default.bold("Options:"), ...generator.prompts.map(prompt => "  --" + prompt.name + " ".repeat(maxLen - prompt.name.length + 2) + _chalk.default.dim(prompt.help ? prompt.help : prompt.message))].join("\n"));
  }

  function chooseOptionFromList(plopList, message) {
    const plop = (0, _nodePlop.default)();
    const generator = plop.setGenerator("choose", {
      prompts: [{
        type: "list",
        name: "generator",
        message: message || defaultChoosingMessage,
        choices: plopList.map(function (p) {
          return {
            name: p.name + _chalk.default.gray(!!p.description ? " - " + p.description : ""),
            value: p.name
          };
        })
      }]
    });
    return generator.runPrompts().then(results => results.generator);
  }

  function displayHelpScreen() {
    console.log(["", _chalk.default.bold("Usage:"), "  $ plop                 " + _chalk.default.dim("Select from a list of available generators"), "  $ plop <name>          " + _chalk.default.dim("Run a generator registered under that name"), "  $ plop <name> [input]  " + _chalk.default.dim("Run the generator with input data to bypass prompts"), "", _chalk.default.bold("Options:"), "  -h, --help             " + _chalk.default.dim("Show this help display"), "  -t, --show-type-names  " + _chalk.default.dim("Show type names instead of abbreviations"), "  -i, --init             " + _chalk.default.dim("Generate a basic plopfile.js"), "  -v, --version          " + _chalk.default.dim("Print current version"), "  -f, --force            " + _chalk.default.dim("Run the generator forcefully"), "", _chalk.default.dim(" ------------------------------------------------------"), _chalk.default.dim("  ⚠  danger waits for those who venture below the line"), "", _chalk.default.dim("  --plopfile             Path to the plopfile"), _chalk.default.dim("  --cwd                  Directory from which relative paths are calculated against while locating the plopfile"), _chalk.default.dim("  --require              String or array of modules to require before running plop"), _chalk.default.dim("  --dest                 Output to this directory instead of the plopfile's parent directory"), "", _chalk.default.bold("Examples:"), "  $ " + _chalk.default.blue("plop"), "  $ " + _chalk.default.blue("plop component"), "  $ " + _chalk.default.blue('plop component "name of component"'), ""].join("\n"));
  }

  function createInitPlopfile(force = false) {
    var initString = "module.exports = function (plop) {\n\n" + "\tplop.setGenerator('basics', {\n" + "\t\tdescription: 'this is a skeleton plopfile',\n" + "\t\tprompts: [],\n" + "\t\tactions: []\n" + "\t});\n\n" + "};";

    if (_fs.default.existsSync(process.cwd() + "/plopfile.js") && force === false) {
      throw Error('"plopfile.js" already exists at this location.');
    }

    _fs.default.writeFileSync(process.cwd() + "/plopfile.js", initString);
  }

  const typeDisplay = {
    function: _chalk.default.yellow("->"),
    add: _chalk.default.green("++"),
    addMany: _chalk.default.green("+!"),
    modify: `${_chalk.default.green("+")}${_chalk.default.red("-")}`,
    append: _chalk.default.green("_+"),
    skip: _chalk.default.green("--")
  };

  const typeMap = (name, noMap) => {
    const dimType = _chalk.default.dim(name);

    return noMap ? dimType : typeDisplay[name] || dimType;
  };

  return {
    chooseOptionFromList,
    displayHelpScreen,
    createInitPlopfile,
    typeMap,
    getHelpMessage
  };
}();

exports.default = _default;