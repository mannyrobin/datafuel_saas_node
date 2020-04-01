CREATE TABLE public."SpecialPromo"
(
    "Id" bigserial NOT NULL,
    "Name" text NOT NULL,
    "Rate_Id" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("Rate_Id")
        REFERENCES public."Rates" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

insert into "Rates" ( "Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") values ('WeLoveAgency', 500000, 70, 10, 0, null, 1, null);

insert into "SpecialPromo" ("Name", "Rate_Id") values ('WeLoveAgency', (select "Id" from "Rates" where "Name" = 'WeLoveAgency'));

insert into "Rates" ( "Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") values ('SMMPSKOV', 500000, 70, 10, 0, null, 1, null);

insert into "SpecialPromo" ("Name", "Rate_Id") values ('SMMPSKOV', (select "Id" from "Rates" where "Name" = 'SMMPSKOV'));