#!/usr/bin/env node

import path from "path";
import Liftoff from "liftoff";
import minimist from "minimist";
import v8flags from "v8flags";
import interpret from "interpret";
import chalk from "chalk";
import ora from "ora";

const args = process.argv.slice(2);
const argv = minimist(args);

import nodePlop from "node-plop";
import out from "./console-out.js";
import { combineBypassData } from "./bypass.js";
import { getBypassAndGenerator, handleArgFlags } from "./input-processing.js";

const Plop = new Liftoff({
	name: "plop",
	extensions: interpret.jsVariants,
	v8flags: v8flags,
});

const progressSpinner = ora();

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
function run(env, _, passArgsBeforeDashes) {
	const plopfilePath = env.configPath;

	// handle basic argument flags like --help, --version, etc
	handleArgFlags(env);

	// use base path from argv or env if any is present, otherwise set it to the plopfile directory
	const destBasePath = argv.dest || env.dest;
	const plop = nodePlop(plopfilePath, {
		destBasePath: destBasePath ? path.resolve(destBasePath) : undefined,
		force: argv.force === true || argv.f === true || false,
	});

	const generators = plop.getGeneratorList();
	const generatorNames = generators.map((v) => v.name);
	const { generatorName, bypassArr, plopArgV } = getBypassAndGenerator(
		plop,
		passArgsBeforeDashes
	);

	// look up a generator and run it with calculated bypass data
	const runGeneratorByName = (name) => {
		const generator = plop.getGenerator(name);
		const bypassData = combineBypassData(generator, bypassArr, plopArgV);
		doThePlop(generator, bypassData);
	};

	// hmmmm, couldn't identify a generator in the user's input
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
		out
			.chooseOptionFromList(generators, plop.getWelcomeMessage())
			.then(runGeneratorByName)
			.catch((err) => {
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
}

/////
// everybody to the plop!
//
function doThePlop(generator, bypassArr) {
	generator
		.runPrompts(bypassArr)
		.then((answers) => {
			const noMap = argv["show-type-names"] || argv.t;
			const onComment = (msg) => {
				progressSpinner.info(msg);
				progressSpinner.start();
			};
			const onSuccess = (change) => {
				let line = "";
				if (change.type) {
					line += ` ${out.typeMap(change.type, noMap)}`;
				}
				if (change.path) {
					line += ` ${change.path}`;
				}
				progressSpinner.succeed(line);
				progressSpinner.start();
			};
			const onFailure = (fail) => {
				let line = "";
				if (fail.type) {
					line += ` ${out.typeMap(fail.type, noMap)}`;
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
			return generator
				.runActions(answers, { onSuccess, onFailure, onComment })
				.then(() => progressSpinner.stop());
		})
		.catch(function (err) {
			console.error(chalk.red("[ERROR]"), err.message);
			process.exit(1);
		});
}

export { Plop, run, progressSpinner };
