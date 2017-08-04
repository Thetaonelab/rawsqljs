const { resolve, join } = require('path')

const currentDirectory = __dirname

const conf = {
  'template': join(resolve(currentDirectory), 'template_sql2js.hbs'),
  'src_glob': 'src/database/*.sql',
  'dest_folder': 'src/database/js'
}

module.exports = conf
