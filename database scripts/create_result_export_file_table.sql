CREATE TABLE public."ResultExportFiles"
(
    "Content" jsonb NOT NULL,
    "Id" bigserial NOT NULL,
    "Result_Id" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("Result_Id")
        REFERENCES public."Results" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);