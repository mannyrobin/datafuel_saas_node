CREATE TABLE public."Activities"
(
    "Id" bigserial NOT NULL,
    "User_Id" bigint NOT NULL,
    "Description" text,
    "CreatedOn" date DEFAULT now(),
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("User_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);