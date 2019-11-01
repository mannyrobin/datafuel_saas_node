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
    "Id" integer NOT NULL
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
    ADD CONSTRAINT "FK_Result_User" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON UPDATE RESTRICT WHERE ;


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
