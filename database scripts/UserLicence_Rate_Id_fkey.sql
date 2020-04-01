ALTER TABLE public."UserLicense"
    ADD COLUMN "Rate_Id" bigint;
ALTER TABLE public."UserLicense"
    ADD CONSTRAINT "UserLicence_Rate_Id_fkey" FOREIGN KEY ("Rate_Id")
    REFERENCES public."Rates" ("Id") MATCH SIMPLE;