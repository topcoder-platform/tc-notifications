 -- rename "topic" column to "topicOld"
  ALTER TABLE "public"."NotificationSettings"
      RENAME COLUMN "topic" TO "topicOld";

  ALTER TABLE "public"."NotificationSettings"
      ALTER COLUMN "topicOld" DROP NOT NULL;

  -- add "topic" column 
  ALTER TABLE "public"."NotificationSettings"
      ADD COLUMN "topic" character varying(255) NOT NULL;
