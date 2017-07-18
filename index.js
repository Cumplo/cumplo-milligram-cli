'use strict';

var fs            = require('fs');
var path          = require('path');
var pkg           = require(path.join(__dirname, './package.json'));
var inquirer      = require('inquirer');
var filehound     = require('filehound');
var promisify     = require('promisify-node');
var fse           = promisify(require('fs-extra'));
var cloneOrPull   = require('git-clone-or-pull');
var cmd           = require('node-cmd');
var bs            = require('browser-sync').create();

var _REPOPATH     = './milligram';
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
 * cloneMilligramFromRepo
 * @type: function
 * @params: none
 * @return: none
 */
function cloneMilligramFromRepo() {
  console.log('Clonando desde repositorio de GitHub...');

  fse.remove(_REPOPATH).then(function() {
    cloneOrPull('https://github.com/milligram/milligram-scss', _REPOPATH, function(err) {
        if (err) throw err;
     
        console.log('OK.')
        initQuestion();
    });
  })
}

/**
 * transformCumploFiles
 * @type: function
 * @params: file
 * @return: string
 */

function transformCumploFiles(file) {
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
      return './milligram/src/';
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

var cloneRepoQuestion = [
  {
    type: 'confirm',
    name: 'cloneRepo',
    message: 'Deseas clonar el repositorio de Milligram Scss?',
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

var compileQuestion = [
  {
    type: 'confirm',
    name: 'compileFiles',
    message: '¿Deseas compilar el build de Milligram?',
    default: true
  }
];

var staticQuestion = [
  {
    type: 'confirm',
    name: 'staticServe',
    message: '¿Deseas abrir el ejemplo en tu navegador?',
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
 * cloneRepo
 * @type: function
 * @return: nothing
 */

function cloneRepo() {

  inquirer.prompt(cloneRepoQuestion).then(function(answers) {
    if (answers.cloneRepo) {
      cloneMilligramFromRepo();
    } else {
      initQuestion();
    }
  });

}


/**
 * compileMilligram
 * @type: function
 * @param: srcPath | string
 * @return: nothing, executes
 */

function compileMilligram(srcPath) {

  cmd.get(
    `
      cd ${srcPath}
      yarn
      npm run build
    `,
      function(err, data, stderr) {
        console.log('Milligram compilado exitosamente.');
        cmd.get(
          `
          cd ${srcPath}/test/
          ls -1 $(pwd)/*.css
          `,
          function(err, data, stderr) {
            console.log('Los archivos se encuentran en:\r\n', data);
            askStatic();
          }
        );
      }
  );

}


/**
 * staticServe
 * @type: function
 * @return: nothing, executes
 */

function staticServe() {
  fs.createReadStream(_REPOPATH + '/test/milligram.min.css').pipe(fs.createWriteStream('./example/milligram.min.css'));
  bs.init({
    server: "./example"
  });
}


/**
 * compileFiles
 * @type: function
 * @return: nothing
 */

function compileFiles(srcPath) {

  inquirer.prompt(compileQuestion).then(function(answers) {
    if (answers.compileFiles) {
      compileMilligram(_REPOPATH);
    }
  });


}

function askStatic() {

  inquirer.prompt(staticQuestion).then(function(answers) {
    if (answers.staticServe) {
      staticServe();
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
    } else {
      compileFiles(_REPOPATH);
    }
  });

}


cloneRepo();
