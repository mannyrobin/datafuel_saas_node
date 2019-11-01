CREATE TABLE public."Rates"
(
    "Id" serial NOT NULL,
    "Name" text NOT NULL,
    "Request" bigint NOT NULL,
    "Permissions" bigint NOT NULL,
    "Limitation" integer NOT NULL,
    "Cost" integer NOT NULL,
    PRIMARY KEY ("Id")
);


INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Guest', '0', 0, -1, 0);

INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Free', '10000', 2, 3, 0);
    
    INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Light', '100000', 2, 7, 500);
    
    INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Medium', '500000', 6, 30, 1000);
    
    INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Heavy', '2000000', 6, 30, 3000);
    
    INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Admin', '0', 1, -1, 0);

    
    INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost")
	VALUES ('Dev', '0', 9, -1, 0);