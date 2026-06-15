import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: !production,
  minify: production,
  outfile: 'dist/extension.js',
  logLevel: 'info'
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log('Watching extension sources...');
} else {
  await esbuild.build(options);
}
