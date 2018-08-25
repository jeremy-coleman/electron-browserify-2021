import * as ts from 'typescript';
import fancy from 'fancy-log';
import * as path from 'path';

interface Project {
	name: string;
	tsconfig: string;
	tslint: string;
}

interface ProjectConfig {
	compilerOptions?: ts.CompilerOptions;
	transformers?: {
		before?: Array<string>;
		after?: Array<string>;
	};
}

type TransformerFactory = (
	context: ts.TransformationContext,
	program: ts.Program
) => ts.Transformer<ts.SourceFile>;

interface Transformers {
	before: Array<TransformerFactory>;
	after: Array<TransformerFactory>;
}

type Logger = typeof fancy['info'];

const timestamps = new Map<string, number>();

const helperHost: ts.ParseConfigHost & ts.FormatDiagnosticsHost = {
	useCaseSensitiveFileNames: false,
	readDirectory: ts.sys.readDirectory,
	fileExists: ts.sys.fileExists,
	readFile: ts.sys.readFile,
	getCanonicalFileName: fileName => fileName,
	getCurrentDirectory: ts.sys.getCurrentDirectory,
	getNewLine: () => ts.sys.newLine
};

function readConfigFile(
	fileName: string,
	readFile: (filePath: string) => string | undefined
) {
	const { config, error } = ts.readConfigFile(fileName, readFile);

	if (error) {
		throw new Error(ts.formatDiagnostic(error, helperHost));
	}

	const result = config as ProjectConfig;

	result.compilerOptions = {
		...result.compilerOptions,
		noEmit: false
	};

	return result;
}

function parseTransformers(cfg: ProjectConfig) {
	cfg.transformers = cfg.transformers || {};
	cfg.transformers.before = cfg.transformers.before || [];
	cfg.transformers.after = cfg.transformers.after || [];

	const result: Transformers = {
		before: cfg.transformers.before.map(
			file => require(file)
		),
		after: cfg.transformers.after.map(
			file => require(file)
		)
	};

	return result;
}

function bindProgram(
	transformers: Transformers,
	program: ts.Program
) {
	transformers.before = transformers.before.map(
		t => (ctx: ts.TransformationContext) => t(ctx, program)
	);

	transformers.after = transformers.after.map(
		t => (ctx: ts.TransformationContext) => t(ctx, program)
	);

	return transformers as ts.CustomTransformers;
}

function readTransformers(host: ts.CompilerHost, cfgPath: string) {
	return parseTransformers(readConfigFile(cfgPath, host.readFile));
}

function isMsgStarted(msg: string) {
	return (
		msg.indexOf('File change detected.') >= 0 ||
		msg.indexOf('Starting compilation in watch mode...') >= 0
	);
}

function isMsgCompleted(msg: string) {
	return msg.indexOf('Watching for file changes.') >= 0;
}

function logStarted(project: Project, log: Logger) {
	timestamps.set(project.name, Date.now());
	log(`Compiling '${project.name}'...`);
}

function logCompleted(project: Project, log: Logger) {
	const lastTime = timestamps.get(project.name);
	timestamps.delete(project.name);
	if (lastTime != null) {
		const elapsedTime = Date.now() - lastTime;
		log(`Compilation finished after ${elapsedTime} ms.`);
	}
	else {
		log(`Compilation finished.`);
	}
}

function logDiagnostic(project: Project, diagnostic: ts.Diagnostic) {
	const lines = ts.formatDiagnostic(diagnostic, helperHost)
		.replace(/\r/g, '')
		.split(/\n/g)
		.map(l => l.trim())
		.filter(l => l.length > 0);

	const { category } = diagnostic;

	let log = fancy.info;
	if (category === ts.DiagnosticCategory.Warning) {
		log = fancy.warn;
	} else if (category === ts.DiagnosticCategory.Error) {
		log = fancy.error;
	}

	for (const line of lines) {
		if (isMsgStarted(line)) {
			logStarted(project, log);
		} else if (isMsgCompleted(line)) {
			logCompleted(project, log);
		} else {
			log(line);
		}
	}
}

async function compile(project: Project) {
	logStarted(project, fancy.info);

	const configPath = path.resolve(project.tsconfig);
	const configDir = path.dirname(configPath);
	const configJson = readConfigFile(configPath, ts.sys.readFile);

	const config = ts.parseJsonConfigFileContent(
		configJson,
		helperHost,
		configDir
	);

	const program = ts.createProgram({
		rootNames: config.fileNames,
		options: config.options,
		configFileParsingDiagnostics: config.errors
	});

	const transformers = bindProgram(
		parseTransformers(configJson),
		program
	);

	const preEmitDiagnostics = ts.getPreEmitDiagnostics(program);
	if (preEmitDiagnostics.length > 0) {
		for (const diagnostic of preEmitDiagnostics) {
			logDiagnostic(project, diagnostic);
		}

		throw new Error('Compilation failed');
	}

	const emitResult = program.emit(
		undefined,
		undefined,
		undefined,
		undefined,
		transformers
	);

	if (emitResult.emitSkipped) {
		throw new Error('Compilation failed (emit skipped)');
	}

	const postEmitDiagnostics = emitResult.diagnostics;
	if (postEmitDiagnostics.length > 0) {
		for (const diagnostic of emitResult.diagnostics) {
			logDiagnostic(project, diagnostic);
		}

		throw new Error('Compilation failed');
	}

	logCompleted(project, fancy.info);
}

function watch(project: Project) {
	const compilerHost = ts.createWatchCompilerHost(
		project.tsconfig,
		{ noEmit: false },
		ts.sys,
		ts.createEmitAndSemanticDiagnosticsBuilderProgram,
		diagnostic => logDiagnostic(project, diagnostic),
		diagnostic => logDiagnostic(project, diagnostic)
	);

	const origCreateProgram = compilerHost.createProgram;
	compilerHost.createProgram = (
		rootNames,
		options,
		host,
		oldProgram,
		configFileParsingDiagnostics
	) => {
		const builderProgram = origCreateProgram(
			rootNames,
			options,
			host,
			oldProgram,
			configFileParsingDiagnostics
		);

		const program = builderProgram.getProgram();

		const cfgPath = project.tsconfig;
		const transformers = bindProgram(
			readTransformers(host!, cfgPath),
			program
		);

		const origEmit = program.emit;
		program.emit = (
			targetSourceFile,
			writeFile,
			cancellationToken,
			emitOnlyDtsFiles
		) => {
			return origEmit(
				targetSourceFile,
				writeFile,
				cancellationToken,
				emitOnlyDtsFiles,
				transformers
			);
		};

		return builderProgram;
	};

	ts.createWatchProgram(compilerHost);

	// tslint:disable-next-line:no-empty
	return new Promise<void>(() => { });
}

export {
	Project,
	compile,
	watch
};
