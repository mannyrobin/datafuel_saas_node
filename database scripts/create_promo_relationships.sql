ALTER TABLE public."Users"
    ADD COLUMN "Promo" text;

ALTER TABLE public."Users"
    ADD COLUMN "IP" text;

CREATE TABLE public."PromoRelationships"
(
    "PrimaryUser_Id" bigint NOT NULL,
    "SecondaryUser_Id" bigint NOT NULL,
    "CreatedOn" timestamp without time zone NOT NULL DEFAULT now(),
    "Duplicate" boolean NOT NULL DEFAULT false,
    FOREIGN KEY ("PrimaryUser_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("SecondaryUser_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);