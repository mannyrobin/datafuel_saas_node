CREATE TABLE public."Knowledges"
(
    "Id" bigserial NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "CreatedOn" timestamp with time zone NOT NULL DEFAULT now(),
    "ModifiedOn" timestamp without time zone NOT NULL DEFAULT now(),
    "CreatedBy" bigint NOT NULL,
    "ModifiedBy" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("CreatedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("ModifiedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE public."Knowledges"
    ADD COLUMN "Deleted" boolean NOT NULL DEFAULT false;