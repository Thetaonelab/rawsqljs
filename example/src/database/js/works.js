// This is generated file.
// Do not edit! as it will be overwritten
// Generated on Mon Apr 17 2017 15:53:10 GMT+0530 (IST)

/* eslint-disable camelcase */
const connection = require('../connection')
const Promise = require('bluebird')

const update_works_stage_status_assigned = (current_stage, status, assigned_to, id, work_details_table_id) => {
  return Promise.using(connection.getConnection(), conn =>
    conn.queryAsync(`
      UPDATE med_works
      SET current_stage=$0,
          status=$1,
          assigned_to=$2
      WHERE id=$3
        AND work_details_table_id=$4
        AND str = \`val 1\`
    `, [ current_stage, status, assigned_to, id, work_details_table_id ])
  )
}

const select_project_funcing = (project_id) => {
  return Promise.using(connection.getConnection(), conn =>
    conn.queryAsync(`
      SELECT pf.id AS project_funding_id,
             0 AS is_dirty,
             pf.project_id,
             pf.source,
             pf.sanctioned_cost,
             pf.addl_sanctioned_cost,
             pf.released,
             pf.remarks,
             pf.is_active,
             concat('[',if(pfrd.id IS NULL, '',GROUP_CONCAT(JSON_OBJECT('id',pfrd.id,'is_dirty',0,'is_active',pfrd.is_active,'doc_url',pfrd.doc_url,'released_date',pfrd.released_date))),']') AS project_fund_released_docs
      FROM med_project_funding pf
      LEFT JOIN med_project_fund_released_docs pfrd ON (pf.id=pfrd.project_funding_id)
      WHERE pf.project_id = $0
      GROUP BY pf.id
    `, [ project_id ])
  )
}

module.exports = {
  update_works_stage_status_assigned,
  select_project_funcing
}
/* eslint-enable camelcase */
