let StringBucket = []

function findStrings (astPart) {
  if (Array.isArray(astPart)) {
    astPart.forEach(findStrings)
  } else if (astPart && typeof astPart === 'object' && astPart.type) {
    if (astPart.type === 'StringLiteral') {
      StringBucket.push(astPart.value)
    } else if (astPart.type === 'TemplateLiteral') {
      // StringBucket.push( /*astPart )*/ astPart.quasis.map( (v, i) => lo.pick(v, ['type', 'value', 'tail']) )  )
      StringBucket.push(astPart.quasis.reduce((str, qv) => qv.type === 'TemplateElement' ? str + qv.value.cooked : str, ''))
    } else {
      let values = Object.keys(astPart).map(k => astPart[k])
      for (var val of values) {
        if (val && typeof val === 'object') { findStrings(val) }
      }
    }
  }
}

const babylon = require('babylon')

function findStringsFromJsCode (str) {
  StringBucket = []
  findStrings(babylon.parse(str, {sourceType: 'module'}))
  return StringBucket
}

module.exports = findStringsFromJsCode
