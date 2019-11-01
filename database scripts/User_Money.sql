ALTER TABLE public."Users"
    ADD COLUMN "Money" bigint;

UPDATE "Users" SET "Money" = 0;

ALTER TABLE public."Users"
    ALTER COLUMN "Money" SET DEFAULT 0;

ALTER TABLE public."Users"
    ALTER COLUMN "Money" SET NOT NULL;