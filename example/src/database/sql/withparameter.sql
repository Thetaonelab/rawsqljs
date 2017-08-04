 -- @@@ update_works_stage_status_assigned
  UPDATE med_works
  SET current_stage = ${current_stage},
      status= ${status},
      assigned_to= ${work_assigned_to}
  WHERE id=${works_id}
    AND work_details_table_id= ${work_details_table_id};


 -- name: project_funding_info

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
WHERE pf.project_id = ${project_id}
GROUP BY pf.id;