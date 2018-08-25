import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import rimraf from 'rimraf';
import fancy from 'fancy-log';

function rmrf(dir: string) {
	return new Promise((resolve, reject) => {
		rimraf(dir, err => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

interface Dictionary {
	[index: string]: string;
}

type OutputCallback = (line: Buffer) => void;

interface SpawnOptions {
	path: string;
	args: Array<string>;
	name?: string;
	env?: Dictionary;
	onStdOut?: OutputCallback | null;
	onStdErr?: OutputCallback | null;
}

function spawn(opts: SpawnOptions): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		opts.name = opts.name || opts.path;

		const proc = childProcess.spawn(
			opts.path,
			opts.args,
			{ env: opts.env }
		);

		const onLogDefault = (buf: Buffer) => {
			buf.toString()
				.split('\n')
				.map(l => l.trim())
				.filter(l => l.length > 0)
				.forEach(l => {
					fancy(`[${opts.name}]`, l);
				});
		};

		const onStdOut =
			opts.onStdOut !== undefined
				? opts.onStdOut
				: onLogDefault;

		const onStdErr =
			opts.onStdErr !== undefined
				? opts.onStdErr
				: onLogDefault;

		if (onStdOut) {
			proc.stdout.on('data', onStdOut);
		}

		if (onStdErr) {
			proc.stderr.on('data', onStdErr);
		}

		proc.on('exit', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(
					`${opts.name} exited with non-zero code: ${code}`
				));
			}
		});

		proc.on('error', err => {
			reject(err);
		});
	});
}

interface SpawnBinOptions {
	mod: string;
	bin: string;
	name?: string;
	args: Array<string>;
	env?: Dictionary;
	onStdOut?: OutputCallback | null;
	onStdErr?: OutputCallback | null;
}

function spawnBin(opts: SpawnBinOptions) {
	const modPath = path.resolve(`./node_modules/${opts.mod}/`);
	const metaPath = path.resolve(modPath, 'package.json');
	const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

	const bins = meta.bin || {};
	const bin = bins[opts.bin];

	if (bin == null) {
		throw new Error(`No '${opts.bin}' bin found in package.json`);
	}

	const binPath = path.resolve(modPath, bin);

	return spawn({
		name: opts.name || opts.bin,
		path: 'node',
		args: [binPath, ...opts.args],
		env: opts.env,
		onStdOut: opts.onStdOut,
		onStdErr: opts.onStdErr
	});
}

export {
	rmrf,
	spawn,
	spawnBin
};
