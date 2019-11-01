CREATE TABLE public."Requests"
(
    "Id" bigserial NOT NULL,
    "Result_Id" bigint NOT NULL,
    "Body" text,
    "User_Id" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("Result_Id")
        REFERENCES public."Results" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("User_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);