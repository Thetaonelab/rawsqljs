#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const mkdirp = require('mkdirp')
const fs = require('fs')
const cli = require('cli').enable('glob')
const glob = require('glob')
const dumpStringsFromJsFiles = require('./dumpStringsFromJsFile')
const generateSqlEmbbedJS = require('./generateSqlEmbbedJS')
const path = require('path')

/// /////// Utility functions

const absolutePath = basepath => _path => path.isAbsolute(_path) ? _path : path.join(basepath, _path)
const mkdirpIfNxists = _path => fs.existsSync(_path) ? null : mkdirp.sync(_path)
const copyFile = (dest, src) => fs.createReadStream(src).pipe(fs.createWriteStream(dest))

/// ////////////////////////////

var options = cli.parse({
  'copy': ['cp', 'Copies configuration files, & database connection file', 'boolean'],
  'extract-sql': ['x', 'Extract sql like strings from .js files', 'boolean'],
  'sql-glob': ['s', 'Sql glob', 'string'],
  'js-path': ['o', 'directory for generated files', 'file'],
  'template-file': ['t', 'handlebar template file', 'file'],
  config: ['c', 'Alternative config file(default: rawsql.conf.js)', 'file'],
  'print-config': ['p', 'Print consolidated config', 'boolean'],
  verbose: ['v', 'Display all messages', 'boolean']
})

let defaultConfig = require('./defaults/rawsql.conf.js')
// eslint-disable-next-line
let projectConfig = {}
let config = defaultConfig
const projectRoot = fs.realpathSync(process.cwd())
const projectConfigFile = options.config || path.join(projectRoot, 'rawsql.conf.js')
if (fs.existsSync(projectConfigFile)) {
  const projectConfObj = require(projectConfigFile)
  const typeofConf = typeof projectConfObj
  if (typeofConf !== 'object') {
    console.error(chalk.red(path.basename(projectConfigFile) + ' should return a object, instead got a ' + typeofConf))
  } else {
    projectConfig = projectConfObj
    config = Object.assign(config, projectConfObj)
  }
}

if (options.verbose || options['print-config']) {
  console.error('Configuration')
  console.dir(config)
  if (options['print-config']) { process.exit(0) }
}

if (options['copy']) {
  const questions = [{
    type: 'confirm',
    name: 'copyTemplate',
    message: 'Do you want to copy the template for customizing generated js files',
    default: false
  }, {
    type: 'list',
    name: 'dbtype',
    message: 'Choose default database',
    choices: ['mysql', 'postgres']
  }, {
    type: 'input',
    name: 'dbmodulepath',
    message: 'Select db modules path(creates dirs if not exists)',
    default: 'src/database'
  }, {
    type: 'input',
    name: 'sqlpath',
    message: 'Select .sql files path',
    default: 'src/database/sql'
  }, {
    type: 'input',
    name: 'jspath',
    message: 'Select generated .js files path',
    default: 'src/database/js'
  }]
  inquirer
    .prompt(questions)
    .then(({ copyTemplate, dbtype, dbmodulepath, sqlpath, jspath }) => {
      const projectAbs = absolutePath(projectRoot)
      const defaultsRoot = absolutePath(__dirname)('defaults')
      const dbFileName = 'connection.' + dbtype + '.js'
      const absoluteDbModPath = projectAbs(dbmodulepath)

      if (copyTemplate === true) {
        copyFile(
          projectAbs(path.basename(defaultConfig.template)),
          defaultConfig.template)
      }
      mkdirpIfNxists(absoluteDbModPath)
      mkdirpIfNxists(projectAbs(sqlpath))
      mkdirpIfNxists(projectAbs(jspath))

      copyFile(
        path.join(absoluteDbModPath, dbFileName),
        path.join(defaultsRoot, dbFileName))
      // if (sqlpath !== config.src_glob || jspath !== config.dest_folder) {
      //   let userConf = '1' // FIXME
      // }
    }).catch(err => {
      console.error(chalk.red('Error'), err)
    })
} else {
  let files // source sql files
  let outputDir // destination .js file directory
  let templateFile // template file path

  if (options['sql-glob']) {
    // if (options.verbose) {
    //   console.log('Sql source glob not given in command line, falling back to conf')
    // }
    files = glob.sync(options['sql-glob']).map(file => path.resolve(file))
  } else {
    // files = cli.args.map(file => path.resolve(file))
    files = glob.sync(config.src_glob).map(file => path.resolve(file))
    if (files.length === 0) {
      console.log(chalk.magenta('Warning:'), 'Zero files matched in command line glob, falling back to conf')
      files = glob.sync(config.src_glob).map(file => path.resolve(file))
    }
  }

  if (!options['js-path']) {
    outputDir = path.resolve(config.dest_folder)
  } else {
    outputDir = path.resolve(options['js-path'])
  }

  if (!options['template-file']) {
    let projectTempleteFileOverridePath = path.resolve(path.join(projectRoot, config.template))
    // Maybe config.template is absolute path
    if (!fs.existsSync(projectTempleteFileOverridePath)) { projectTempleteFileOverridePath = path.resolve(config.template) }
    if (config.template === defaultConfig.template && !fs.existsSync(projectTempleteFileOverridePath)) {
      templateFile = path.join(__dirname, defaultConfig.template)
    } else {
      templateFile = projectTempleteFileOverridePath
    }
  } else {
    templateFile = options['template-file']
  }

  if (options.verbose) {
    console.log(chalk.cyan('INFO'), files.length, 'files found')
    console.log(chalk.cyan('Input'), outputDir)
    console.log(chalk.cyan('Output'), outputDir)
    console.log(chalk.cyan('Template'), templateFile)
  }

  let logger = {
    error: (...args) => console.error(...args),
    info: (...args) => { }
  }

  if (options.verbose) {
    logger.info = (...args) => console.log(...args)
  }

  if (options['extract-sql']) {
    if (options.verbose) {
      console.log(chalk.bold('Extracting sql like strings'))
      console.log(chalk.grey('files -> ' + files))
      console.log(chalk.grey('dest -> ' + outputDir))
    }
    dumpStringsFromJsFiles(files, outputDir)
  } else {
    if (options.verbose) {
      console.log(chalk.bold('Generating js file from .sql statements using template'), chalk.bold.cyan(templateFile))
    }
    generateSqlEmbbedJS(files, outputDir, templateFile, logger)
  }
}
