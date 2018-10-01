const gulp = require('gulp');
const sass = require('gulp-sass');
const replace = require('gulp-replace');
const inlineCss = require('gulp-inline-css');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var fs = require('fs');



//web preview base directoru
const baseDir = "./dist";

// compile sass to css
gulp.task('compileSass', function () {
    return gulp
        // import all email .scss files from src/scss folder
        .src('./src/styles/**/*.scss')
        .pipe(sass().on('error', sass.logError))

        // output to `src/css` folder
        .pipe(gulp.dest('./src/styles'));
});

// build complete HTML email template
gulp.task('inlineCss', ['compileSass'], function () {
    return gulp
        .src('src/**/*.html')

        // replace `.scss` file paths from template with compiled file paths
        .pipe(replace(/\/styles\/(.+)\.scss/ig, '/styles/$1.css'))

        // inline CSS
        //preserveMediaQueries not wokring ----------------------------------
        .pipe(inlineCss({ preserveMediaQueries: true }))
        .pipe(gulp.dest('temp/'));
});

// merge templates into a single file
gulp.task('mergeTemplates', ['inlineCss'], function () {

    return gulp
        .src('temp/partials/*.html')
        .pipe(concat('templates.html'))
        .pipe(gulp.dest('temp/'));
});

gulp.task('build', ['mergeTemplates'], function () {

    var contents = fs.readFileSync('temp/templates.html', 'utf8');

    return gulp
        .src('temp/template.html')
        .pipe(replace('CHILD_TEMPLATES',contents))
        .pipe(gulp.dest('dist/'));
});

// browserSync task to launch preview server
gulp.task('browserSync', function () {
    return browserSync.init({
        reloadDelay: 1000, // reload after 2s
        server: { baseDir: baseDir }
    });
});

// task to reload browserSync
gulp.task('reloadBrowserSync', function () {
    return browserSync.reload();
});

// watch source files for changes
// run `build` task when anything inside `src` folder changes (except .css)
// and reload browserSync
gulp.task('watch', ['build', 'browserSync'], function () {
    return gulp.watch([
        'src/**/*',
        '!src/**/*.css',
    ], ['build', 'reloadBrowserSync']);
});
