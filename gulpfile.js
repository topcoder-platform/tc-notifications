const gulp = require('gulp');
const sass = require('gulp-sass');
const replace = require('gulp-replace');
const inlineCss = require('gulp-inline-css');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();

// web preview base directoru
const baseDir = './dist/emails';

// compile sass to css
gulp.task('compileSass', () => gulp
  // import all email .scss files from src/scss folder
  .src('./src/emails/styles/**/*.scss')
  .pipe(sass().on('error', sass.logError))

  // output to `src/emails/styles` folder
  .pipe(gulp.dest('./src/emails/styles')));

// build complete HTML email template
gulp.task('build', ['compileSass'], () => gulp
  .src('src/emails/*.html')

  // replace `.scss` file paths from template with compiled file paths
  .pipe(replace(/\/styles\/(.+)\.scss/ig, '/styles/$1.css'))

  // inline CSS
  // preserveMediaQueries not working
  .pipe(inlineCss({ preserveMediaQueries: true }))

  // do not generate sub-folders inside dist folder
  .pipe(rename({ dirname: '' }))
  .pipe(gulp.dest('dist/emails')));

// browserSync task to launch preview server
gulp.task('browserSync', () => browserSync.init({
  reloadDelay: 1000, // reload after 1s
  server: { baseDir },
}));

// task to reload browserSync
gulp.task('reloadBrowserSync', () => browserSync.reload());

// watch source files for changes
// run `build` task when anything inside `src` folder changes (except .css)
// and reload browserSync
gulp.task('watch', ['build', 'browserSync'], () => gulp.watch([
  'src/**/*',
  '!src/**/*.css',
], ['build', 'reloadBrowserSync']));
