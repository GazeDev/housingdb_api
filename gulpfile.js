// gulpfile.js
var gulp = require('gulp');
var lab = require('gulp-lab');

const modules = require('./lib/modules.js');

gulp.task('test', function () {
  let argArray = [
    '--verbose',
    '--assert',
    '@hapi/code',
  ];
  // build the files to test
  for (let mod of modules) {
    argArray.push(`lib/${mod}/${mod}.tests.js`);
  }
  return gulp.src('test', { allowEmpty: true })
    .pipe(lab(argArray));
});

gulp.task('default', gulp.parallel('test'));
