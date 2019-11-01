--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

-- Started on 2016-11-04 16:32:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 12387)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2139 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 188 (class 1259 OID 16425)
-- Name: Results; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE IF NOT EXISTS "Results" (
    "Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    "Result" json,
    "Name" text NOT NULL,
    "Type_Id" bigint DEFAULT 1 NOT NULL,
    "Broken" boolean DEFAULT false
);

--
-- TOC entry 187 (class 1259 OID 16423)
-- Name: Results_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "Results_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2140 (class 0 OID 0)
-- Dependencies: 187
-- Name: Results_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "Results_Id_seq" OWNED BY "Results"."Id";


--
-- TOC entry 185 (class 1259 OID 16403)
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE IF NOT EXISTS "Users" (
    "UserId" bigint NOT NULL,
    "Email" text,
    "Name" text NOT NULL,
    "Id" serial NOT NULL,
    PRIMARY KEY ("Id"),
    UNIQUE ("Id")
);


--
-- TOC entry 186 (class 1259 OID 16411)
-- Name: Users_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "Users_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2141 (class 0 OID 0)
-- Dependencies: 186
-- Name: Users_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "Users_Id_seq" OWNED BY "Users"."Id";


--
-- TOC entry 2010 (class 2604 OID 16428)
-- Name: Results Id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Results" ALTER COLUMN "Id" SET DEFAULT nextval('"Results_Id_seq"'::regclass);


--
-- TOC entry 2009 (class 2604 OID 16413)
-- Name: Users Id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Users" ALTER COLUMN "Id" SET DEFAULT nextval('"Users_Id_seq"'::regclass);


--
-- TOC entry 2014 (class 2606 OID 16433)
-- Name: Results Results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "Results_pkey" PRIMARY KEY ("Id");

--
-- TOC entry 2015 (class 2606 OID 16434)
-- Name: Results FK_Result_User; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "FK_Result_User" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON UPDATE RESTRICT ;


--
-- TOC entry 2012 (class 2606 OID 16415)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("Id");


-- Completed on 2016-11-04 16:32:54

--
-- PostgreSQL database dump complete
--

CREATE TABLE IF NOT EXISTS "ResultType"
(
    "Id" serial NOT NULL,
    "Name" text NOT NULL,
    PRIMARY KEY ("Id"),
    UNIQUE ("Id")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;


CREATE SEQUENCE "ResultType_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "ResultType_Id_seq" OWNED BY "ResultType"."Id";

ALTER TABLE ONLY "ResultType" ALTER COLUMN "Id" SET DEFAULT nextval('"ResultType_Id_seq"'::regclass);

ALTER TABLE ONLY "ResultType"
    ADD CONSTRAINT "ResultType_Name_key" UNIQUE ("Name");


--
-- TOC entry 2028 (class 2606 OID 16456)
-- Name: ResultType ResultType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultType"
    ADD CONSTRAINT "ResultType_pkey" PRIMARY KEY ("Id");


ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "FK_ResultType_Results" FOREIGN KEY ("Type_Id") REFERENCES "ResultType"("Id");


INSERT INTO public."ResultType"("Name") SELECT 'analisys' WHERE NOT EXISTS (SELECT * FROM public."ResultType" WHERE "Name" = 'analisys');
INSERT INTO public."ResultType"("Name") SELECT 'segment' WHERE NOT EXISTS (SELECT * FROM public."ResultType" WHERE "Name" = 'segment');

ALTER TABLE public."Results"
    ADD COLUMN "CreatedOn" timestamp without time zone NOT NULL DEFAULT now();

ALTER TABLE public."Users"
    ADD COLUMN "UserProfileUrl" text;

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
);

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

ALTER TABLE public."Results"
    ADD COLUMN "Deleted" boolean NOT NULL DEFAULT false;

CREATE TABLE public."ResultNotifications"
(
    "Result_Id" bigint NOT NULL,
    "Sent" boolean
);

CREATE TABLE public."Feedbacks"
(
    "User_Id" bigint NOT NULL,
    "Comment" text NOT NULL
);

ALTER TABLE public."UserLicense"
    ADD COLUMN "Rate_Id" bigint;
ALTER TABLE public."UserLicense"
    ADD CONSTRAINT "UserLicence_Rate_Id_fkey" FOREIGN KEY ("Rate_Id")
    REFERENCES public."Rates" ("Id") MATCH SIMPLE;

ALTER TABLE public."Users"
    ADD COLUMN "Money" bigint;

UPDATE "Users" SET "Money" = 0;

ALTER TABLE public."Users"
    ALTER COLUMN "Money" SET DEFAULT 0;

ALTER TABLE public."Users"
    ALTER COLUMN "Money" SET NOT NULL;

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

ALTER TABLE public."Activities"
    ADD COLUMN "Result_Id" bigint;

ALTER TABLE public."Activities"
    ADD CONSTRAINT "Activities_Result_Id_fkey" FOREIGN KEY ("Result_Id")
    REFERENCES public."Results" ("Id") MATCH SIMPLE;
ALTER TABLE public."Activities"
    ALTER COLUMN "CreatedOn" TYPE timestamp without time zone ;

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

CREATE TABLE public."Knowledges"
(
    "Id" bigserial NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "CreatedOn" timestamp with time zone NOT NULL DEFAULT now(),
    "ModifiedOn" timestamp without time zone NOT NULL DEFAULT now(),
    "CreatedBy" bigint NOT NULL,
    "ModifiedBy" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("CreatedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("ModifiedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE public."Knowledges"
    ADD COLUMN "Deleted" boolean NOT NULL DEFAULT false;

ALTER TABLE public."Users"
    ADD COLUMN "AccountId" bigint;

CREATE TABLE public."Blog"
(
    "Id" bigserial NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "CreatedOn" timestamp with time zone NOT NULL DEFAULT now(),
    "ModifiedOn" timestamp without time zone NOT NULL DEFAULT now(),
    "CreatedBy" bigint NOT NULL,
    "ModifiedBy" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("CreatedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("ModifiedBy")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER TABLE public."Blog"
    ADD COLUMN "Deleted" boolean NOT NULL DEFAULT false;

ALTER TABLE public."Blog"
    ADD COLUMN "Component_Id" bigint NOT NULL;
ALTER TABLE public."Blog"
    ADD FOREIGN KEY ("Component_Id")
    REFERENCES public."Components" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public."Results"
    ADD COLUMN "Progress" double precision;

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

ALTER TABLE public."Requests"
    ADD COLUMN "Status" text NOT NULL DEFAULT 'Finished';
ALTER TABLE public."Requests"
    ADD COLUMN "Context" json;

ALTER TABLE public."Requests"
    ADD COLUMN "Guid" text;

ALTER TABLE public."Rates"
    ALTER COLUMN "Cost" TYPE money ;

ALTER TABLE public."Users"
    ALTER COLUMN "Money" TYPE money ;

CREATE TABLE public."Principal"
(
    "Id" bigserial NOT NULL,
    "Type" text NOT NULL,
    PRIMARY KEY ("Id")
);

INSERT INTO public."Principal"
select "Id", 'user' as "Type"
    from "Users";
ALTER SEQUENCE "Principal_Id_seq" RESTART WITH 10000;

ALTER TABLE public."Users"
    ADD FOREIGN KEY ("Id")
    REFERENCES public."Principal" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;
ALTER TABLE public."Users"
    ALTER COLUMN "Id" TYPE integer ;

ALTER TABLE public."UserLicense" DROP CONSTRAINT "UserLicense_User_Id_fkey";

ALTER TABLE public."UserLicense"
    ADD FOREIGN KEY ("User_Id")
    REFERENCES public."Principal" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

CREATE TABLE public."Groups"
(
    "Name" text,
    "Id" bigint NOT NULL,
    PRIMARY KEY ("Id"),
    FOREIGN KEY ("Id")
        REFERENCES public."Principal" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE public."GroupMembers"
(
    "Group_Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    FOREIGN KEY ("Group_Id")
        REFERENCES public."Groups" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("User_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);
ALTER TABLE public."Groups"
    ADD COLUMN "CreatedBy" bigint NOT NULL;
ALTER TABLE public."Groups"
    ADD FOREIGN KEY ("CreatedBy")
    REFERENCES public."Users" ("Id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

ALTER TABLE public."UserLicense"
    ADD COLUMN "GroupSize" bigint DEFAULT 1;
ALTER TABLE public."Groups"
    ADD COLUMN "Size" bigint;

ALTER TABLE public."Rates"
    ADD COLUMN "GroupSize" bigint DEFAULT 1;

ALTER TABLE public."UserLicense"
    RENAME "Remain_Requests" TO "Requests";

ALTER TABLE public."UserLicense"
    ALTER COLUMN "Requests" TYPE bigint ;


ALTER TABLE public."Principal"
    ADD COLUMN "TotalRequestLimit" bigint;
    
ALTER TABLE public."Rates"
    ADD COLUMN "TotalRequestLimit" bigint;

ALTER TABLE public."Rates"
    ADD COLUMN "ExportLimit" bigint DEFAULT 0;  

ALTER TABLE public."Principal"
    ADD COLUMN "ExportLimit" bigint;

INSERT INTO public."Rates"(
	"Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit")
	VALUES ('Promo', 30000, 70, 7, 0, 30000, 1, 100000);

ALTER TABLE public."Users"
    ADD COLUMN "Promo" text;

ALTER TABLE public."Users"
    ADD COLUMN "IP" text;

CREATE TABLE public."PromoRelationships"
(
    "PrimaryUser_Id" bigint NOT NULL,
    "SecondaryUser_Id" bigint NOT NULL,
    "CreatedOn" timestamp without time zone NOT NULL DEFAULT now(),
    "Duplicate" boolean NOT NULL DEFAULT false,
    FOREIGN KEY ("PrimaryUser_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    FOREIGN KEY ("SecondaryUser_Id")
        REFERENCES public."Users" ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

-- Started on 2017-04-05 20:59:39
--
-- TOC entry 2205 (class 0 OID 16535)
-- Dependencies: 192
-- Data for Name: Rates; Type: TABLE DATA; Schema: public; Owner: postgres
--


INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Light', 300000, 6, 30, '$490.00', 500000 * 1, 1000000);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Light', 300000, 6, 90, '$1323.00', 500000 *3, 1000000 * 3);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Light', 300000, 6, 180, '$2352.00', 500000 * 6, 1000000 * 6);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Light', 300000, 6, 360, '$4116.00', 500000 * 12, 1000000 * 12);

INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Optimum', 700000, 6, 30, '$900.00', 1000000 * 1, 2000000 * 1);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Optimum', 700000, 6, 90, '$2430.00', 1000000 * 3, 2000000 * 3);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Optimum', 700000, 6, 180, '$4320.00', 1000000 * 6, 2000000 * 6);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Optimum', 700000, 6, 360, '$7560.00', 1000000 * 12, 2000000 * 12);

INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Pro', 2000000, 70, 30, '$1900.00', 2500000 * 1, 3000000 * 1);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Pro', 2000000, 70, 90, '$5130.00', 2500000 * 3, 3000000 * 3);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Pro', 2000000, 70, 180, '$9120.00', 2500000 * 6, 3000000 * 6);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('Pro', 2000000, 70, 360, '$15960.00', 2500000 * 12, 3000000 * 12);

INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('The King', 3000000, 70, 30, '$3900.00', 5000000, 5000000);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('The King', 3000000, 70, 90, '$10530.00', 5000000 * 3, 5000000 * 3);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('The King', 3000000, 70, 180, '$18720.00', 5000000 * 6, 5000000 * 6);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "TotalRequestLimit") VALUES ('The King', 3000000, 70, 360, '$32760.00', 5000000 * 12, 5000000 * 12);
update "Rates" set  "Request" = 5000, "Limitation"= 3, "Cost" = '$0.00', "ExportLimit" = 0 where "Name" = 'Guest';


INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") 
VALUES ('Business', 5000000, 70, 30, '$4900.00', 15000000 * 1, 5, 10000000);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") 
VALUES ('Business', 5000000, 70, 30 * 3, '$13230.00', 15000000 * 3, 5, 10000000 * 3);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") 
VALUES ('Business', 5000000, 70, 30 * 6, '$23520.00', 15000000 * 6, 5, 10000000 * 6);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") 
VALUES ('Business', 5000000, 70, 30 * 12, '$41160.00', 15000000 * 12, 5, 10000000 * 12);


INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Corporate', 10000000, 70, 30, '$8900.00', 40000000, 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Corporate', 10000000, 70, 30 * 3, '$24030.00', 40000000 * 3 , 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Corporate', 10000000, 70, 30 * 6, '$42720.00', 40000000 * 6, 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Corporate', 10000000, 70, 30 * 12, '$74760.00', 40000000 * 12, 5);


INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Ultimate', 100000000, 70, 30, '$14900.00', null, 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Ultimate', 100000000, 70, 30 * 3, '$40230.00', null , 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Ultimate', 100000000, 70, 30 * 6, '$71230.00', null, 5);
INSERT INTO "Rates" ("Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize") 
VALUES ('Ultimate', 100000000, 70, 30 * 12, '$125160.00', null, 5);
-- Completed on 2017-04-05 20:59:39

--
-- PostgreSQL database dump complete
--

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

CREATE TABLE if not exists public."MBTI_Types"
(
    "Type" text NOT NULL,
    "Id" serial NOT NULL,
    PRIMARY KEY ("Id")
);

insert into "MBTI_Types" ("Type") values ('ENFJ'), ('ESFP'), ('INFJ'), ('ESTJ'), ('ISTJ'), ('ENTJ'), ('ISFP'), ('INTJ'), ('ISTP'), ('ENTP'), ('ESTP'), ('INTP'), ('ESFJ'), ('ISFJ'), ('ENFP'), ('INFP');

alter table "SpecialPromo"
	add column "Times" integer default 1;

insert into "Rates" ( "Name", "Request", "Permissions", "Limitation", "Cost", "ExportLimit", "GroupSize", "TotalRequestLimit") values ('ReBorn', 500000, 70, 10, 0, null, 1, null);
insert into "SpecialPromo" ("Name", "Rate_Id", "Times") values ('ReBorn', (select "Id" from "Rates" where "Name" = 'ReBorn'), 2);