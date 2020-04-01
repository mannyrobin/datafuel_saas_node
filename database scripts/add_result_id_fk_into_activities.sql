ALTER TABLE public."Activities"
    ADD COLUMN "Result_Id" bigint;

ALTER TABLE public."Activities"
    ADD CONSTRAINT "Activities_Result_Id_fkey" FOREIGN KEY ("Result_Id")
    REFERENCES public."Results" ("Id") MATCH SIMPLE;
ALTER TABLE public."Activities"
    ALTER COLUMN "CreatedOn" TYPE timestamp without time zone ;