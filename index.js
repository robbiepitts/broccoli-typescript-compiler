'use strict';

var ts        = require('typescript');
var Writer    = require('broccoli-caching-writer');
var stringify = require('json-stable-stringify');
var crypto    = require('crypto');
var glob      = require('glob');
var path      = require('path');

var getCallerFile = require('get-caller-file');

var loadTSConfig = require('./lib/load-ts-config');
var findTSConfig = require('./lib/find-ts-config');

module.exports = TypeScript;

TypeScript.prototype = Object.create(Writer.prototype);
TypeScript.prototype.constructor = TypeScript;

function TypeScript(inputNodes, options) {
  options = options || {};
  // options.inputFiles === array of globs, to consider for the cache key

  if (!(this instanceof TypeScript)) {
    return new TypeScript(inputNodes, options);
  }

  Writer.call(this, inputNodes, {
    annotation: options.annotation
  });
}

TypeScript.prototype.build = function() {
  // cache has been busted
  // do anything, for example:
  //   1. read from this.inputPaths
  //   2. do something based on the result
  //   3. and then, write to this.outputPath

  let files = [];

  this.inputPaths.forEach(inputPath => {
    files += glob.sync(path.join(inputPath, '*.ts'));
  });

  compile(files, {
    noEmitOnError: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
  });
};

function compile(fileNames, options) {
  var program = ts.createProgram(fileNames, options);
  var emitResult = program.emit();

  var allDiagnostics =
    ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  console.log(allDiagnostics);

  allDiagnostics.forEach(function(diagnostic) {
    if (!diagnostic.file) { return; }

    var lineAndCharacter =
      diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var line = lineAndCharacter.line;
    var character = lineAndCharacter.character;
    var message =
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    console.log(
      diagnostic.file.fileName,
      '(',
      (line + 1),
      ', ',
      (character + 1),
      '):',
      message
    );
  });

  var exitCode = emitResult.emitSkipped ? 1 : 0;
  process.exit(exitCode);
}
