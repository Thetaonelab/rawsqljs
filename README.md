Generate javascript file from sql file, wrapping each sql(ended with a semicolon) in a js function.

## Description

rawsqljs wraps each sql statements in a javascript function with its parameter as argument of the generated functions. The function returns a Promise of result.

## Get Started

We haven't published it to npm yet so, install from github

`yarn add --dev git+https://github.com/debjyoti-in/rawsqljs.git`  
_or_

`npm install --save-dev git+https://github.com/debjyoti-in/rawsqljs.git`

rawsql will copy database connection module if you run

```bash
$(npm bin)/rawsql --copy
#or if you have a rawsql target in npm script as described below run
npm run rawsql -- --copy
# Args after -- are passed to the underlying npm script cmd
```

In your package.json 's scripts section add a `<script_name>` and run using `npm run <script_name>`

**package.json**
```json
...otheroptions
"scripts": {
  "rawsql": "rawsql"
}
...otheroptions
```
run
`npm run rawsql`

It will expect your `.sql` files in `src/database` folder and will write the generated files in the same folder.

To override the default behavior add a `rawsql.conf.js` file in your project dir(the same directory where package.json resides).
e.g.

```js
//rawsql.conf.js
module.exports = {
  src_glob: 'src/database/sql/*.sql',
  dest_folder: 'src/database/js'
}
```

**See `example/` folder**

#### Notes

Before every sql statement in a sql file write a name of the of the query 
followed by its parameter names like.
**Note:** Every sql statement must ends with semicolon(;).

```sql
  -- @@@ update_works_stage_status_assigned # current_stage # status # assigned_to # id # work_details_table_id
  UPDATE med_works
  SET current_stage=?,
      status=?,
      assigned_to=?
  WHERE id=?
    AND work_details_table_id=?;
```

###### Generated js file

The generated js files will export each sql statement by its name.
See [example/src/database/js/works.js](https://github.com/debjyoti-in/rawsqljs/src/master/example/src/database/js/works.js#L5)


# TODO

  + Configarable logging

  + Load sql in a in memory object and return the sql by name.
      This will make the code generation part optional

  + Without listing out parameter names just before the sql, which is error prone
      name them along side placeholder. e.g.
  
  + Indicate query name with `-- name: <query_name>` e.g.
```sql
    -- name: records_by_clients
    SELECT * FROM records WHERE client_id = :client_id
```

# CONTRIBUTING

Whenever you see something broken and not working as expected please create an [issue](https://github.com/debjyoti-in/rawsqljs/issues).
And you are welcome to fork and create pull request.

#### Commits

- Commit title should be short and descriptive
  + title (or summary line) is the first line of the commit message
  + that says what the commit is doing
  + in no more than 50 characters
  + starting with a word like 'Fix' or 'Add' or 'Change'
  + without a period (.) at the end
  + followed by a blank line
- Commit messages are
  + up to 72 characters
  + with break lines
- Reference the issue(s) the commit closes
  + https://help.github.com/articles/closing-issues-via-commit-messages
  + If you haven't done so since the beginning, you should reference the issue when you squash your commits

#### Coding Style

Run `npm run lint` or `yarn run lint` before you commit, and try to reasonably keep a consistent style
You may read more about this project's coding style on [standardjs.com](https://standardjs.com/rules.html)