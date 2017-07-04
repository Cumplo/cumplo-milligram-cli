'use strict';

var fs            = require('fs');
var path          = require('path');
var pkg           = require(path.join(__dirname, './package.json'));
var inquirer      = require('inquirer');
var filehound     = require('filehound');
var _CUMPLOFILES  = getCumploFiles('./src/', 'scss');


/**
 * getCumploFiles
 * @type: function
 * @params: srcPath, extension
 * @return: array
 */

function getCumploFiles(srcPath, extension) {
  var htmlFiles = filehound.create()
    .ext(extension)
    .paths(srcPath)
    .findSync(htmlFiles);

  return htmlFiles;
}


/**
 * transformCumploFiles
 * @type: function
 * @params: file
 * @return: string
 */

function transformCumploFiles(file) {
  // return file.replace('Cumplo.scss', 'scss');
  return file.replace('src/', '').replace('Cumplo.scss', 'scss');
}


/**
 * getFileContent
 * @type: function
 * @params: srcPath, callback
 * @return: array
 */

function getFileContent(srcPath, callback) { 

  fs.readFile(srcPath, 'utf8', function (err, data) {
    if (err) throw err;
    callback(data);
  });

}


/**
 * replaceFileContent
 * @type: function
 * @params: srcPath, distPath
 * @return: nothing
 */

function replaceFileContent(srcPath, distPath) { 

  getFileContent(srcPath, function(data) {
    fs.writeFileSync(distPath, data, function(err) {
      if (err) throw err;
    });

    console.log('\nAcción realizada con éxito.');
    askAgain();

  });

}


/**
 * mergeFileContent
 * @type: function
 * @params: srcPathCumplo, srcPathMilligram, distPath
 * @return: nothing
 */

function mergeFileContent(srcPathCumplo, srcPathMilligram, distPath) {
  var mergedData = "";

  getFileContent(srcPathCumplo, function(data) {
    mergedData = data;

    getFileContent(srcPathMilligram, function(data) {
      mergedData += '\n' + data;

      fs.writeFileSync(distPath, mergedData, function(err) {
        if (err) throw err;
      });

      console.log('\nArchivos combinados con éxito.');
      askAgain();

    });

  });
}


/**
 * questions
 * @type: variable
 */

var questions = [
  {
    type: 'input',
    name: 'distPath',
    message: 'Ruta de archivos base Milligram:',
    default: function () {
      return '../milligram/src/';
    }
  },
  {
    type: 'input',
    name: 'srcPath',
    message: 'Ruta de archivos base Cumplo:',
    default: function () {
      return './';
    }
  },
  {
    type: 'list',
    name: 'files',
    message: 'Selecciona archivo:',
    choices: _CUMPLOFILES
  },
  {
    type: 'list',
    name: 'cual',
    message: 'Elige acción:',
    choices: ['Reemplazar', 'Combinar', 'Crear'],
    filter: function (val) {
      return val.toLowerCase();
    }
  },
  {
    type: 'confirm',
    name: 'confirm',
    message: '¿Seguro que quieres realizar esta acción?',
    default: true
  }
];

var againQuestion = [
  {
    type: 'confirm',
    name: 'askAgain',
    message: '¿Deseas seleccionar otro archivo?',
    default: true
  }
];

var intro = '\r\n[ Cumplo-Milligram CLI v.' + pkg.version + ' ]\r\n';


/**
 * initQuestion
 * @type: function
 * @return: nothing
 */

function initQuestion() {

  console.log(intro);

  inquirer.prompt(questions).then(function (answers) {

    _CUMPLOFILES = getCumploFiles(answers.srcPath, 'scss');

    if (answers.cual === 'reemplazar' || answers.cual === 'crear' ) {
      replaceFileContent(answers.srcPath + answers.files, answers.distPath + transformCumploFiles(answers.files));
    }
    else if (answers.cual === 'combinar') {
      mergeFileContent(answers.distPath + transformCumploFiles(answers.files), answers.files, answers.distPath + transformCumploFiles(answers.files));
    }

  });

}


/**
 * askAgain
 * @type: function
 * @return: nothing
 */

function askAgain() {

  inquirer.prompt(againQuestion).then(function(answers) {
    if (answers.askAgain) {
      initQuestion();
    }
  });

}

initQuestion();
