CREATE TABLE public."UserLicense"
(
    "Id" bigserial NOT NULL,
    "User_Id" bigint NOT NULL,
    "Capabilities" integer NOT NULL DEFAULT 0,
    "Remain_Requests" bigint NOT NULL DEFAULT 0,
    "Start_Date" timestamp without time zone NOT NULL DEFAULT now(),
    "End_Date" timestamp without time zone,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("User_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)