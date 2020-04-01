CREATE TABLE public."UploadedFiles"
(
    "Content" jsonb NOT NULL,
    "Id" bigserial NOT NULL,
    PRIMARY KEY ("Id")
);

INSERT INTO public."ResultType"("Name") SELECT 'usersByPhones' WHERE NOT EXISTS (SELECT * FROM public."ResultType" WHERE "Name" = 'usersByPhones');
ALTER TABLE public."UploadedFiles" ADD COLUMN "ResultId" bigint;