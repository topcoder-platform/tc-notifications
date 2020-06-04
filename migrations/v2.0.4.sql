
-- query to identify the duplicate rows in bulk_message_user_refs table
SELECT count(*), bulk_message_id, user_id  FROM "bulk_message_user_refs" 
   GROUP BY bulk_message_id, user_id HAVING count(*) > 1;

-- create temp table and store duplicate broadcast notification rows
SELECT * INTO temptable FROM "Notifications" WHERE id IN  
   (
       SELECT a.notification_id FROM "bulk_message_user_refs" AS "a", 
       "bulk_message_user_refs" AS "b" 
       WHERE a.id < b.id 
       AND a.bulk_message_id = b.bulk_message_id 
       AND a.user_id = b.user_id
    );

-- DELETE duplicate rows from bulk_message_user_refs table
DELETE FROM "bulk_message_user_refs" AS "a" 
  USING "bulk_message_user_refs" AS "b" 
  WHERE a.id < b.id 
  AND a.bulk_message_id = b.bulk_message_id 
  AND a.user_id = b.user_id;

-- DELETE duplicate rows from Notifications
DELETE FROM "Notifications" 
WHERE id IN (SELECT id FROM temptable) 
AND type = 'admin.notification.broadcast';

-- make unique column to avoid duplicate insert 
ALTER TABLE bulk_message_user_refs ADD UNIQUE (bulk_message_id, user_id);

-- get duplicate broadcast rows
SELECT * FROM "Notifications" AS a
   LEFT JOIN "bulk_message_user_refs" AS b
   ON a.id=b.notification_id
   WHERE a.type='admin.notification.broadcast'
   AND b.id IS NULL;

