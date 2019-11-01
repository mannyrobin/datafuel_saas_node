ALTER TABLE public."Requests"
    ADD COLUMN "Status" text NOT NULL DEFAULT 'Finished';
ALTER TABLE public."Requests"
    ADD COLUMN "Context" json;