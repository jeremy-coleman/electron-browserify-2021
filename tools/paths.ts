import * as path from 'path'

export const PATHS = {
  server: {
    src: 'src/server/main.ts',
    dest: 'dist/server/'
  },
  electron: {
    src: 'src/desktop/main.ts',
    dest: 'dist/desktop/'
  },
  client: {
    src: 'src/client/app.tsx',
    SRC_PUG_INDEX: 'src/client/index.pug',
    OUT_FILE: path.join('dist', 'client', 'app.js'),
    OUT_DIR: 'dist/client/',
    dest: 'dist/client/',
    SRC_STYLES: [
    './src/**/*.css',
    'src/**/*.scss',
    'src/**/*.sass',
    'src/**/*.styl',
    'src/**/*.less'
    ],
    DEST_STYLES: 'dist/client/styles.min.css'
  },
}
  