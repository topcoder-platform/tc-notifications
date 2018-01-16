-- Column: public."Notifications".version

-- ALTER TABLE public."Notifications" DROP COLUMN version;

ALTER TABLE public."Notifications"
    ADD COLUMN version smallint;