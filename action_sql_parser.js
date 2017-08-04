/*
TODO: README, testcase, test error msgs, improve error msgs, remove dead and duplicate code
ignoreSpace
**User a parser generator?**
*/
/* eslint-disable camelcase */
const chalk = require('chalk')
// copied and return chars until it gets oneOf(' ', '\t', '\n')
// @returns a object ...
function getSymbolName (str, pos) {
  var name = ''
  var strLen = str.length
  while (
    !(str[pos] === ' ' ||
      str[pos] === '\t' ||
      str[pos] === '\n' ||
      pos >= strLen)) {
    name += str[pos++]
  }

  return { name, pos }
}

function ignoreSpace (str, pos) {
  while (
    str[pos] === ' ' ||
    str[pos] === '\t') { ++pos }
  return pos
}

const codePoint = {
  zero: '0'.codePointAt(0),
  one: '1'.codePointAt(0),
  a: 'a'.codePointAt(0),
  A: 'A'.codePointAt(0),
  Z: 'Z'.codePointAt(0),
  z: 'z'.codePointAt(0)
}

const OUT_SPACE = 0
const SPACE = 1
const COMMENT = 2
const FUNCTION_NAME = 3
const FUNCTION_PARAM = 4
const SQL = 5
const SQL_X = 6
const SQL_STRING = 7
const SQL_PARAM = 8
const SQL_END = 9
const EOF = -1

// const state_map = {
//   0: 'OUT_SPACE',
//   1: 'SPACE',
//   2: 'COMMENT',
//   3: 'FUNCTION_NAME',
//   4: 'FUNCTION_PARAM',
//   5: 'SQL',
//   6: 'SQL_X',
//   7: 'SQL_STRING',
//   8: 'SQL_PARAM',
//   9: 'SQL_END'
// }
//
// let reverse_state_map = {};
// Object.keys(state_map).forEach(
//   k => {
//     reverse_state_map[state_map[k]] = k;
//   });

function parseNdActionOnSQL (fileName, sqlStr, queries, errors) {
  const strLen = sqlStr.length
  let query = {}

  let line_idx = 1
  let pos = 0

  let paramCount
  let declaredParamCount
  let fname
  let obj

  let typeStack = [ EOF, SQL, COMMENT, OUT_SPACE ]

  while (true) {
    if (pos >= strLen) {
      typeStack = [EOF]
    }
    // console.log({pos, line_idx, typeStack: typeStack.map( v => state_map[v])})

    switch (typeStack.pop()) {
      case EOF:
        return
      case SPACE: // ignore immediate consecutive space on that particular line
        while (
          sqlStr[pos] === ' ' ||
          sqlStr[pos] === '\t') {
          ++pos
        }
      case OUT_SPACE: // ignore till we have whitespaces
        while (
          sqlStr[pos] === ' ' ||
          sqlStr[pos] === '\t') {
          ++pos
        }
        while (sqlStr[pos] === '\n') {
          ++pos
          ++line_idx
          typeStack.push(OUT_SPACE)
        }
        break
      case COMMENT:
        if (!(sqlStr[pos] === '-' && sqlStr[pos + 1] === '-')) { break }
        // ignore the line till encountering a @@@
        while (
          !(sqlStr[pos] === '\n' ||
            sqlStr[pos] === '@' ||
            pos >= strLen)) {
          ++pos
        }
        if (sqlStr[pos] === '\n') {
          ++pos
          ++line_idx
        } else if (sqlStr[pos] === '@') {
          if (sqlStr[++pos] === '@' && sqlStr[++pos] === '@') {
            ++pos
            typeStack.push(COMMENT)
            typeStack.push(FUNCTION_NAME)
            typeStack.push(SPACE)
          } else {
            console.log(
              chalk.yellow(
              `Found '@' in ${fileName}:${line_idx}\n
               Did you mean @@@ <func_name> # <param1> # <param2> ... ?`
              ))
          }
        }
        break
      case FUNCTION_NAME:
        declaredParamCount = 0
        obj = getSymbolName(sqlStr, pos)
        fname = obj.name
        pos = obj.pos
        // console.log({ fname, pos })

        if (fname === '') {
          console.log(`${fileName}:${line_idx} expected function`)
          typeStack.pop()// === COMMENT
        } else {
          let fstCharCodePoint = fname.codePointAt(0)
          if (fstCharCodePoint < codePoint.A || fstCharCodePoint > codePoint.z) {
            console.log(`Warn: ${fileName}:${line_idx} function name must start with A-Za-z, got ${fname}`)
            typeStack.pop()// === COMMENT
          } else {
            query = {
              funcName: fname,
              params: [],
              sql: null
            }
            typeStack.push(FUNCTION_PARAM)
            typeStack.push(SPACE)
            console.log(`${fileName}:${line_idx} \n\t@@@ ${fname}`)
          }
        }
        break
      case FUNCTION_PARAM:
        if (sqlStr[pos] === '#') {
          pos = ignoreSpace(sqlStr, ++pos)
          obj = getSymbolName(sqlStr, pos)
          fname = obj.name
          pos = obj.pos
          ++declaredParamCount
          query.params.push(fname)
          // console.log({ fname, pos})
          console.log('\t\tparam:', fname)
          fname = ''
          // if(fname.indexOf('group') !== -1)
          //   return;
          typeStack.push(FUNCTION_PARAM)
          typeStack.push(SPACE)
        }
        break
      case SQL:
        fname = ''
        paramCount = 0
        typeStack.push(SQL_X)
        break
      case SQL_X:
        while (!(
          sqlStr[pos] === '?' ||
          sqlStr[pos] === '"' ||
          sqlStr[pos] === "'" ||
          sqlStr[pos] === '`' ||
          (sqlStr[pos] === '-' && sqlStr[pos + 1] === '-') ||
          sqlStr[pos] === ';')) {
          if (pos >= strLen) {
            console.log(`Premature end of input, ${fileName}:${line_idx}`)
            errors.push(`Premature end of input, ${fileName}:${line_idx}`)
            typeStack = [EOF]
            break
          } else if (sqlStr[pos] === '\n') { ++line_idx }
          fname += sqlStr[pos++]
        }
        if (sqlStr[pos] === '"' ||
            sqlStr[pos] === "'" ||
            sqlStr[pos] === '`') {
          typeStack.push(SQL_STRING)
        } else if (sqlStr[pos] === '-' && sqlStr[pos + 1] === '-') {
          typeStack.push(SQL_X)
          typeStack.push(COMMENT)
        } else if (sqlStr[pos] === '?') {
          // console.log('SQL_PARAM', sqlStr[pos], {typeStack})
          typeStack.push(SQL_PARAM)
        } else if (sqlStr[pos] === ';') {
          // console.log('SQL_END', sqlStr[pos])
          typeStack.push(SQL_END)
        }
        break
      case SQL_STRING:
        let str_s = sqlStr[pos]
        while (sqlStr[pos] !== str_s) {
          if (pos >= strLen) {
            console.log(`Premature end of input, ${fileName}:${line_idx}`)
            errors.push(`Premature end of input, ${fileName}:${line_idx}`)
            typeStack = [EOF]
            break
          } else if (sqlStr[pos] === '\n') { ++line_idx }

          fname += sqlStr[pos++]
        }
        fname += sqlStr[pos++]
        typeStack.push(SQL_X)
        break
      case SQL_PARAM:
        fname += '$' + paramCount // sqlStr[pos++]
        ++pos
        ++paramCount
        typeStack.push(SQL_X)
        break
      case SQL_END:
        // console.log('XXX->SQL_END',{typeStack,line_idx})
        ++pos
        if (query === null) { break }
        // console.log({pos, paramCount, declaredParamCount})
        query.sql = fname
        queries.push(query)
        query = null
        if (declaredParamCount !== paramCount) {
          console.log(chalk.red(`Error: ${fileName}:${line_idx} declaredParamCount !== paramCount\n\t\t`), declaredParamCount, '!==', paramCount)
          errors.push(`Error: ${fileName}:${line_idx} declaredParamCount !== paramCount\n`)
          // typeStack = [EOF]
        } else {
          console.log('\t\tcount:', paramCount)
          if (strLen - pos > 'CALL f();'.length) { typeStack = [ EOF, SQL, COMMENT, OUT_SPACE ] }
        }
        // console.log(typeStack.map( v => state_map[v]))
    }// switch
  }// while(true)
}// parseNdActionSQL()

/*
queries.oneOf.schema = {
  funcName: type.String,
  params: type.Array,
  sql: type.string
}
*/
function parseSql (fileName, sqlString) {
  var parser = {
    errors: [],
    queries: []
  }
  parseNdActionOnSQL(fileName, sqlString, parser.queries, parser.errors)
  return parser
}

module.exports = parseSql
