'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const debug = require('gulp-debug');
const jsonlint = require('gulp-jsonlint');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence');

const LINT_FILES = {
  JS: ['./*.js', 'src/**/*.js'],
  JSON: ['src/**/*.json']
};

gulp.task('jslint', function() {
  const completionTracker = function(results) {
    results = results || [];

    const result = results.reduce(function(all, current) {
      all.errors += current.errorCount;
      all.warnings += current.warningCount;
      return all;
    }, { errors: 0, warnings: 0 });

    if (result.errors > 0) {
      gutil.log(gutil.colors.red('>>> Javascript linting: ' + gutil.colors.underline('FAILED') + '.'));
    } else if (result.warnings > 0) {
      gutil.log(gutil.colors.yellow('>>> Javascript linting ' + gutil.colors.underline('COMPLETED with warnings') + '.'));
    } else {
      gutil.log(gutil.colors.green('>>> Javascript linting ' + gutil.colors.underline('COMPLETED') + '.'));
    }
  };

  return gulp.src(LINT_FILES.JS)
    .pipe(debug({title: 'Linting'}))
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.format('codeframe')) 
    .pipe(eslint.format())
    .pipe(eslint.format(completionTracker));
});

gulp.task('jsonlint', function() {
  let success;
  const completionTracker = function() {
    success = true;

    return function (file) {
      success = success && file.jsonlint.success;
    };
  };

  return gulp.src(LINT_FILES.JSON)
    .pipe(debug({title: 'Linting'}))
    .pipe(jsonlint())     
    .pipe(jsonlint.reporter())
    .pipe(jsonlint.reporter(completionTracker()))
    .on('end', function() {
      if (success) {
        gutil.log(gutil.colors.green('>>> JSON linting ' + gutil.colors.underline('COMPLETED') + '.'));
      } else {
        gutil.log(gutil.colors.red('>>> JSON linting ' + gutil.colors.underline('FAILED.') + '.'));
      }
    });     

});

gulp.task('lint', function(callback) {
  runSequence('jslint', 'jsonlint', callback);
});

gulp.task('watch', function() {
  return gulp.watch([LINT_FILES.JS, LINT_FILES.JSON], ['lint']);
});

gulp.task('default', ['lint', 'watch']);