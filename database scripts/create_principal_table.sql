CREATE TABLE public."Principal"
(
    "Id" bigserial NOT NULL,
    "Type" text NOT NULL,
    PRIMARY KEY ("Id")
);

INSERT INTO public."Principal"
select "Id", 'user' as "Type"
    from "Users";
ALTER SEQUENCE "Principal_Id_seq" RESTART WITH 10000;

ALTER TABLE public."Users"
    ADD FOREIGN KEY ("Id")
    REFERENCES public."Principal" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
ALTER TABLE public."Users"
    ALTER COLUMN "Id" TYPE integer ;

ALTER TABLE public."UserLicense" DROP CONSTRAINT "UserLicense_User_Id_fkey";

ALTER TABLE public."UserLicense"
    ADD FOREIGN KEY ("User_Id")
    REFERENCES public."Principal" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

CREATE TABLE public."Groups"
(
    "Name" text,
    "Id" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("Id")
        REFERENCES public."Principal" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE public."GroupMembers"
(
    "Group_Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    FOREIGN KEY ("Group_Id")
        REFERENCES public."Groups" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("User_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
ALTER TABLE public."Groups"
    ADD COLUMN "CreatedBy" bigint NOT NULL;
ALTER TABLE public."Groups"
    ADD FOREIGN KEY ("CreatedBy")
    REFERENCES public."Users" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public."UserLicense"
    ADD COLUMN "GroupSize" bigint DEFAULT 1;
ALTER TABLE public."Groups"
    ADD COLUMN "Size" bigint;

ALTER TABLE public."Rates"
    ADD COLUMN "GroupSize" bigint DEFAULT 1;

ALTER TABLE public."UserLicense"
    RENAME "Remain_Requests" TO "Requests";

ALTER TABLE public."UserLicense"
    ALTER COLUMN "Requests" TYPE bigint ;


ALTER TABLE public."Principal"
    ADD COLUMN "TotalRequestLimit" bigint;

ALTER TABLE public."Principal"
    ADD COLUMN "ExportLimit" bigint;