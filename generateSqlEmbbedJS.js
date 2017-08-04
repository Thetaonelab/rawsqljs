const path = require('path')
const sqlParser = require('./action_sql_parser')
const chalk = require('chalk')
const fs = require('fs')
const hbs = require('handlebars')

function generateSqlEmbbedJS (fileList, genJsPath, templateFile, logger) {
  hbs.registerHelper('indent', (data, indent) => {
    var out = data.replace(/\n/g, '\n' + indent)
    return new hbs.SafeString(out)
  })

  hbs.registerHelper('indentsql', (data, indent) => {
    var out = data.replace(/\n/g, '\n' + indent).replace(/`/g, '\\`')
    return out
  })

  hbs.registerHelper('sql', (data) => data.replace(/`/g, '\\`'))

  let template = hbs.compile(
    fs.readFileSync(templateFile, 'utf-8'), {
      noEscape: true
    })

  for (var file_ of fileList) {
    let sqlString = fs.readFileSync(file_, 'utf-8')
    var parsed = sqlParser(file_, sqlString)
    sqlString = null

    if (parsed.errors.length > 0) {
      logger.error('There are errors, doing nothing')
    } else {
      let fname = path.basename(file_)
      fname = fname.substr(0, fname.lastIndexOf('.'))
      fname = path.join(genJsPath, fname + '.js')
      logger.info('Generating', fname)
      let args = {
        generatedTime: new Date(),
        parsedArray: parsed.queries
      }

      let jsStr = template(args)

      fs.writeFileSync(fname, jsStr)
      logger.info(chalk.bold.cyan('FILE DONE:'), fname)
    }
  }
}

module.exports = generateSqlEmbbedJS
