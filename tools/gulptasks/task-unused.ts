import gulp from 'gulp';

import * as tsc from './typescript';
import { rmrf } from './helpers';

const app: tsc.Project = {
	name: 'app',
	tsconfig: './source/tsconfig.json',
	tslint: './tslint.json'
};

const everything: tsc.Project = {
	name: 'everything',
	tsconfig: './tsconfig.json',
	tslint: './tslint.json'
};

gulp.task('copy-html', () => (
	gulp.src(`./source/*.html`)
		.pipe(gulp.dest('./output'))
));

gulp.task('clean-output', () => (
	rmrf('./output')
));

gulp.task('clean-packages', () => (
	rmrf('./packages')
));

gulp.task('clean',
	gulp.series(
		'clean-output',
		'clean-packages'
	)
);

gulp.task('compile-app',
	gulp.series('copy-html', () => (
		tsc.compile(app)
	))
);

gulp.task('compile',
	gulp.series(
		'clean-output',
		'compile-app'
	)
);

gulp.task('default',
	gulp.task('compile')
);
