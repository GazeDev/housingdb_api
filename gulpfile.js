// gulpfile.js
var gulp = require('gulp');
var lab = require('gulp-lab');

const modules = require('./lib/modules.js');

gulp.task('test', function () {
  let argArray = [
    '--globals', 'core,__core-js_shared__,@@any-promise/REGISTRATION',
    '--verbose',
    '--assert',
    '@hapi/code',
  ];
  // build the files to test
  for (let mod of modules) {
    argArray.push(`lib/${mod}/${mod}.tests.js`);
  }
  return gulp.src('test', { allowEmpty: true })
    .pipe(lab({
      args: argArray,
      opts: {
        emitLabError: true
      }
    }));
});

gulp.task('default', gulp.parallel('test'));
