const path = require('path')
const chalk = require('chalk')
const stringify = require('json-stringify-safe')

const Promise = require('bluebird')
const fs = require('fs')
Promise.promisifyAll(fs)

const findStrings = require('./findStrings')

/* eslint-disable no-unused-vars */
function dumpJSON(filename, v) {
  fs.writeFileAsync(
    filename,
    stringify(v, null, 4)
  ).then(_ => {
    console.log(chalk.blue(`${chalk.bold(path.basename(filename))} written`))
  }).catch(err => {
    console.log(chalk.red('Error:'), err)
  })
}
/* eslint-enable no-unused-vars */

function isSQL(str) {
  const patterns = [
    /SELECT.+FROM/im,
    /INSERT.+INTO/im,
    /UPDATE\w.+.+/im,
    /DELETE.+.+/im,
    /CALL.+\w/im
  ] // [^-]+[(]|\w+[^-]*
  for (const rx of patterns) {
    // if (!(rx instanceof RegExp)) { throw new Error(util.inspect(rx) + 'is not a RegExp') }
    if (str.startsWith('SELECT')) {
      console.log(rx, ' --> ', str.substr(0, Math.min(30, str.length)) + '...')
    }
    if (rx.test(str)) {
      // console.log(chalk.red(rx.toString()), rx.exec(str) )
      // console.log(chalk.green('passed'))
      return true
    }
  }
  // console.log(chalk.red('NotMatched'), str.substr(0, Math.min(str.length, 20)))
  return false
}

function appendLastSemicolon(str) {
  if (!/[;][\s\S]$/.test(str)) { return str + ';' }
}

function dumpStringsFromJsFiles(files, destDir) {
  files.forEach(file => {
    file = path.resolve(file)
    console.log(chalk.bold.yellow('Opening file'), chalk.bold.cyan(file))

    let fileContent = fs.readFileSync(file, 'utf8')
    let strings = findStrings(fileContent)

    console.log('%s strings found', strings.length)
    let sqls = []// strings.filter(isSQL)
    for (var str of strings) {
      // console.log(str.substr(0, Math.min(30, str.length)))
      if (isSQL(str)) {
        sqls.push(appendLastSemicolon(str))
      }
    }
    console.log('\t\t%s/%s sql/str', chalk.bold(sqls.length), strings.length)

    let filename = path.basename(file)
    filename = filename.substr(0, filename.lastIndexOf('.')) + '.sql'

    fs.writeFileAsync(
      path.join(destDir, filename),
      sqls.join('\n\n')
    ).then(_ => {
      console.log(chalk.bold.green(filename), 'Written')
    }).catch(err => {
      console.log(chalk.red('Error: '), chalk.bold.red(filename))
      console.log(err)
    })
  })
}

module.exports = dumpStringsFromJsFiles
