  -- rename "deliveryMethod" column to "serviceId"
  ALTER TABLE "public"."NotificationSettings"
      RENAME COLUMN "deliveryMethod" TO "serviceId";

  -- add "name" column
  ALTER TABLE "public"."NotificationSettings"
      ADD COLUMN "name" character varying(255);

  -- fill "name" column with the value 'enabled'
  UPDATE public."NotificationSettings"
      SET "name" = 'enabled';

  -- make "name" column NOT NULL
  ALTER TABLE "public"."NotificationSettings"
      ALTER COLUMN "name" SET NOT NULL;

