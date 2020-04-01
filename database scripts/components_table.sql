CREATE TABLE public."Components"
(
    "Id" bigserial NOT NULL,
    "Type" text NOT NULL,
    PRIMARY KEY ("Id")
);

ALTER TABLE public."Knowledges"
    ADD COLUMN "Component_Id" bigint NOT NULL;
ALTER TABLE public."Knowledges"
    ADD FOREIGN KEY ("Component_Id")
    REFERENCES public."Components" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public."Results"
    ADD COLUMN "Component_Id" bigint;
ALTER TABLE public."Results"
    ADD FOREIGN KEY ("Component_Id")
    REFERENCES public."Components" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


do $$
DECLARE
   cust_rec bigint;
BEGIN
FOR cust_rec IN (SELECT "Id" FROM "Results") LOOP

	INSERT INTO public."Components"("Type")
	VALUES ('Result');
    
    UPDATE "Results" SET "Component_Id" = (SELECT "Id" FROM "Components" ORDER BY "Id" DESC LIMIT 1)
        WHERE  "Id" = cust_rec;
END LOOP;
end;
$$
language plpgsql;

ALTER TABLE public."Results"
    ALTER COLUMN "Component_Id" TYPE bigint ;
ALTER TABLE public."Results"
    ALTER COLUMN "Component_Id" SET NOT NULL;

ALTER TABLE public."Activities"
    RENAME "Result_Id" TO "RootComponent_Id";

ALTER TABLE public."Activities"
    ALTER COLUMN "RootComponent_Id" TYPE bigint ;
ALTER TABLE public."Activities" DROP CONSTRAINT "Activities_Result_Id_fkey";

ALTER TABLE public."Activities"
    ADD FOREIGN KEY ("RootComponent_Id")
    REFERENCES public."Components" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;