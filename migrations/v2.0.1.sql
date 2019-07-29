 -- rename "topic" column to "topicOld"
  ALTER TABLE "public"."NotificationSettings"
      RENAME COLUMN "topic" TO "topicOld";

  -- add "topic" column 
  ALTER TABLE "public"."NotificationSettings"
      ADD COLUMN "topic" character varying(255);

  