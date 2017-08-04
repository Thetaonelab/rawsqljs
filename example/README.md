# Description

**package.json** : 

  + lists rawsqljs as its dependency
  + Adds build script in the script section in package.js
    - "rawsql": "rawsql"

# Usage

Sql files are on src/database/sql
And we are placing generated js files in **src/database/js**

To generate run
`npm run rawsql`

To clean generated files run
`npm run clean`