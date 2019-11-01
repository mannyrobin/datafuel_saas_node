ALTER TABLE public."Results"
    ADD COLUMN "CreatedOn" timestamp without time zone NOT NULL DEFAULT now();