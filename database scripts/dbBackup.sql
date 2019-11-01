--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

-- Started on 2017-03-06 21:35:48

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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2301 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- TOC entry 214 (class 1255 OID 38694)
-- Name: array_distinct(anyarray); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION array_distinct(anyarray) RETURNS anyarray
    LANGUAGE sql IMMUTABLE
    AS $_$
  SELECT array_agg(DISTINCT x) FROM unnest($1) t(x);
$_$;


ALTER FUNCTION public.array_distinct(anyarray) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 198 (class 1259 OID 16646)
-- Name: Activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Activities" (
    "Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    "Description" text,
    "CreatedOn" timestamp without time zone DEFAULT now(),
    "RootComponent_Id" bigint
);


ALTER TABLE "Activities" OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 16644)
-- Name: Activities_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Activities_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Activities_Id_seq" OWNER TO postgres;

--
-- TOC entry 2302 (class 0 OID 0)
-- Dependencies: 197
-- Name: Activities_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Activities_Id_seq" OWNED BY "Activities"."Id";


--
-- TOC entry 204 (class 1259 OID 16750)
-- Name: Blog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Blog" (
    "Id" bigint NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "CreatedOn" timestamp with time zone DEFAULT now() NOT NULL,
    "ModifiedOn" timestamp without time zone DEFAULT now() NOT NULL,
    "CreatedBy" bigint NOT NULL,
    "ModifiedBy" bigint NOT NULL,
    "Deleted" boolean DEFAULT false NOT NULL,
    "Component_Id" bigint NOT NULL
);


ALTER TABLE "Blog" OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 16748)
-- Name: Blog_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Blog_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Blog_Id_seq" OWNER TO postgres;

--
-- TOC entry 2303 (class 0 OID 0)
-- Dependencies: 203
-- Name: Blog_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Blog_Id_seq" OWNED BY "Blog"."Id";


--
-- TOC entry 202 (class 1259 OID 16700)
-- Name: Components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Components" (
    "Id" bigint NOT NULL,
    "Type" text NOT NULL
);


ALTER TABLE "Components" OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 16698)
-- Name: Components_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Components_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Components_Id_seq" OWNER TO postgres;

--
-- TOC entry 2304 (class 0 OID 0)
-- Dependencies: 201
-- Name: Components_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Components_Id_seq" OWNED BY "Components"."Id";


--
-- TOC entry 196 (class 1259 OID 16621)
-- Name: Feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Feedbacks" (
    "User_Id" bigint NOT NULL,
    "Comment" text NOT NULL
);


ALTER TABLE "Feedbacks" OWNER TO postgres;

--
-- TOC entry 200 (class 1259 OID 16677)
-- Name: Knowledges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Knowledges" (
    "Id" bigint NOT NULL,
    "Title" text NOT NULL,
    "Description" text,
    "CreatedOn" timestamp with time zone DEFAULT now() NOT NULL,
    "ModifiedOn" timestamp without time zone DEFAULT now() NOT NULL,
    "CreatedBy" bigint NOT NULL,
    "ModifiedBy" bigint NOT NULL,
    "Component_Id" bigint NOT NULL,
    "Deleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Knowledges" OWNER TO postgres;

--
-- TOC entry 199 (class 1259 OID 16675)
-- Name: Knowledges_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Knowledges_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Knowledges_Id_seq" OWNER TO postgres;

--
-- TOC entry 2305 (class 0 OID 0)
-- Dependencies: 199
-- Name: Knowledges_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Knowledges_Id_seq" OWNED BY "Knowledges"."Id";


--
-- TOC entry 208 (class 1259 OID 17731)
-- Name: MBTI_Types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "MBTI_Types" (
    "Id" bigint NOT NULL,
    "Type" text
);


ALTER TABLE "MBTI_Types" OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 17729)
-- Name: MBTI_Types_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "MBTI_Types_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "MBTI_Types_Id_seq" OWNER TO postgres;

--
-- TOC entry 2306 (class 0 OID 0)
-- Dependencies: 207
-- Name: MBTI_Types_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "MBTI_Types_Id_seq" OWNED BY "MBTI_Types"."Id";


--
-- TOC entry 192 (class 1259 OID 16535)
-- Name: Rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Rates" (
    "Id" integer NOT NULL,
    "Name" text NOT NULL,
    "Request" bigint NOT NULL,
    "Permissions" bigint NOT NULL,
    "Limitation" integer NOT NULL,
    "Cost" integer NOT NULL
);


ALTER TABLE "Rates" OWNER TO postgres;

--
-- TOC entry 191 (class 1259 OID 16533)
-- Name: Rates_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Rates_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rates_Id_seq" OWNER TO postgres;

--
-- TOC entry 2307 (class 0 OID 0)
-- Dependencies: 191
-- Name: Rates_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Rates_Id_seq" OWNED BY "Rates"."Id";


--
-- TOC entry 211 (class 1259 OID 28508)
-- Name: Requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Requests" (
    "Id" bigint NOT NULL,
    "Result_Id" bigint NOT NULL,
    "Body" text,
    "User_Id" bigint NOT NULL,
    "Status" text DEFAULT 'loading'::text NOT NULL,
    "Context" json
);


ALTER TABLE "Requests" OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 28506)
-- Name: Requests_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Requests_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Requests_Id_seq" OWNER TO postgres;

--
-- TOC entry 2308 (class 0 OID 0)
-- Dependencies: 210
-- Name: Requests_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Requests_Id_seq" OWNED BY "Requests"."Id";


--
-- TOC entry 213 (class 1259 OID 28530)
-- Name: ResultExportFiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "ResultExportFiles" (
    "Id" bigint NOT NULL,
    "Result_Id" bigint NOT NULL,
    "Content" jsonb NOT NULL
);


ALTER TABLE "ResultExportFiles" OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 28528)
-- Name: ResultExportFiles_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "ResultExportFiles_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "ResultExportFiles_Id_seq" OWNER TO postgres;

--
-- TOC entry 2309 (class 0 OID 0)
-- Dependencies: 212
-- Name: ResultExportFiles_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "ResultExportFiles_Id_seq" OWNED BY "ResultExportFiles"."Id";


--
-- TOC entry 195 (class 1259 OID 16611)
-- Name: ResultNotifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "ResultNotifications" (
    "Result_Id" bigint NOT NULL,
    "Sent" boolean
);


ALTER TABLE "ResultNotifications" OWNER TO postgres;

--
-- TOC entry 189 (class 1259 OID 16441)
-- Name: ResultType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "ResultType" (
    "Name" text NOT NULL,
    "Id" bigint NOT NULL
);


ALTER TABLE "ResultType" OWNER TO postgres;

--
-- TOC entry 190 (class 1259 OID 16452)
-- Name: ResultType_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "ResultType_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "ResultType_Id_seq" OWNER TO postgres;

--
-- TOC entry 2310 (class 0 OID 0)
-- Dependencies: 190
-- Name: ResultType_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "ResultType_Id_seq" OWNED BY "ResultType"."Id";


--
-- TOC entry 188 (class 1259 OID 16425)
-- Name: Results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Results" (
    "Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    "Result" json,
    "Name" text NOT NULL,
    "Type_Id" bigint DEFAULT 1 NOT NULL,
    "Broken" boolean DEFAULT false,
    "CreatedOn" timestamp without time zone DEFAULT now() NOT NULL,
    "Deleted" boolean DEFAULT false NOT NULL,
    "Component_Id" bigint NOT NULL,
    "Progress" double precision
);


ALTER TABLE "Results" OWNER TO postgres;

--
-- TOC entry 187 (class 1259 OID 16423)
-- Name: Results_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Results_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Results_Id_seq" OWNER TO postgres;

--
-- TOC entry 2311 (class 0 OID 0)
-- Dependencies: 187
-- Name: Results_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Results_Id_seq" OWNED BY "Results"."Id";


--
-- TOC entry 209 (class 1259 OID 17740)
-- Name: Segments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Segments" (
    "Result_Id" bigint NOT NULL,
    "Type_Id" bigint,
    "UserIds" bigint[],
    "Age" text,
    "Type" text NOT NULL
);


ALTER TABLE "Segments" OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 16862)
-- Name: UserForProcessing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "UserForProcessing" (
    "UserIds" bigint[],
    "Result_Id" bigint NOT NULL,
    "Id" bigint NOT NULL,
    "Status" text DEFAULT 'idle'::text
);


ALTER TABLE "UserForProcessing" OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 16873)
-- Name: UserForProcessing_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UserForProcessing_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UserForProcessing_Id_seq" OWNER TO postgres;

--
-- TOC entry 2312 (class 0 OID 0)
-- Dependencies: 206
-- Name: UserForProcessing_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "UserForProcessing_Id_seq" OWNED BY "UserForProcessing"."Id";


--
-- TOC entry 194 (class 1259 OID 16546)
-- Name: UserLicense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "UserLicense" (
    "Id" bigint NOT NULL,
    "User_Id" bigint NOT NULL,
    "Capabilities" integer DEFAULT 0 NOT NULL,
    "Remain_Requests" bigint DEFAULT 0 NOT NULL,
    "Start_Date" timestamp without time zone DEFAULT now() NOT NULL,
    "End_Date" timestamp without time zone,
    "Rate_Id" bigint
);


ALTER TABLE "UserLicense" OWNER TO postgres;

--
-- TOC entry 193 (class 1259 OID 16544)
-- Name: UserLicense_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UserLicense_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UserLicense_Id_seq" OWNER TO postgres;

--
-- TOC entry 2313 (class 0 OID 0)
-- Dependencies: 193
-- Name: UserLicense_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "UserLicense_Id_seq" OWNED BY "UserLicense"."Id";


--
-- TOC entry 185 (class 1259 OID 16403)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "Users" (
    "UserId" bigint NOT NULL,
    "Email" text,
    "Name" text NOT NULL,
    "Id" integer NOT NULL,
    "UserProfileUrl" text,
    "Money" bigint DEFAULT 0,
    "AccountId" bigint
);


ALTER TABLE "Users" OWNER TO postgres;

--
-- TOC entry 186 (class 1259 OID 16411)
-- Name: Users_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Users_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Users_Id_seq" OWNER TO postgres;

--
-- TOC entry 2314 (class 0 OID 0)
-- Dependencies: 186
-- Name: Users_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Users_Id_seq" OWNED BY "Users"."Id";


--
-- TOC entry 2113 (class 2604 OID 16649)
-- Name: Activities Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Activities" ALTER COLUMN "Id" SET DEFAULT nextval('"Activities_Id_seq"'::regclass);


--
-- TOC entry 2120 (class 2604 OID 16753)
-- Name: Blog Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Blog" ALTER COLUMN "Id" SET DEFAULT nextval('"Blog_Id_seq"'::regclass);


--
-- TOC entry 2119 (class 2604 OID 16703)
-- Name: Components Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Components" ALTER COLUMN "Id" SET DEFAULT nextval('"Components_Id_seq"'::regclass);


--
-- TOC entry 2115 (class 2604 OID 16680)
-- Name: Knowledges Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Knowledges" ALTER COLUMN "Id" SET DEFAULT nextval('"Knowledges_Id_seq"'::regclass);


--
-- TOC entry 2126 (class 2604 OID 17734)
-- Name: MBTI_Types Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "MBTI_Types" ALTER COLUMN "Id" SET DEFAULT nextval('"MBTI_Types_Id_seq"'::regclass);


--
-- TOC entry 2108 (class 2604 OID 16538)
-- Name: Rates Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Rates" ALTER COLUMN "Id" SET DEFAULT nextval('"Rates_Id_seq"'::regclass);


--
-- TOC entry 2127 (class 2604 OID 28511)
-- Name: Requests Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Requests" ALTER COLUMN "Id" SET DEFAULT nextval('"Requests_Id_seq"'::regclass);


--
-- TOC entry 2129 (class 2604 OID 28533)
-- Name: ResultExportFiles Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultExportFiles" ALTER COLUMN "Id" SET DEFAULT nextval('"ResultExportFiles_Id_seq"'::regclass);


--
-- TOC entry 2107 (class 2604 OID 16454)
-- Name: ResultType Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultType" ALTER COLUMN "Id" SET DEFAULT nextval('"ResultType_Id_seq"'::regclass);


--
-- TOC entry 2102 (class 2604 OID 16428)
-- Name: Results Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Results" ALTER COLUMN "Id" SET DEFAULT nextval('"Results_Id_seq"'::regclass);


--
-- TOC entry 2124 (class 2604 OID 16875)
-- Name: UserForProcessing Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserForProcessing" ALTER COLUMN "Id" SET DEFAULT nextval('"UserForProcessing_Id_seq"'::regclass);


--
-- TOC entry 2109 (class 2604 OID 16549)
-- Name: UserLicense Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserLicense" ALTER COLUMN "Id" SET DEFAULT nextval('"UserLicense_Id_seq"'::regclass);


--
-- TOC entry 2100 (class 2604 OID 16413)
-- Name: Users Id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Users" ALTER COLUMN "Id" SET DEFAULT nextval('"Users_Id_seq"'::regclass);


--
-- TOC entry 2143 (class 2606 OID 16655)
-- Name: Activities Activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2149 (class 2606 OID 16760)
-- Name: Blog Blog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Blog"
    ADD CONSTRAINT "Blog_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2147 (class 2606 OID 16708)
-- Name: Components Components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Components"
    ADD CONSTRAINT "Components_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2145 (class 2606 OID 16687)
-- Name: Knowledges Knowledges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Knowledges"
    ADD CONSTRAINT "Knowledges_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2153 (class 2606 OID 17739)
-- Name: MBTI_Types MBTI_Types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "MBTI_Types"
    ADD CONSTRAINT "MBTI_Types_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2139 (class 2606 OID 16543)
-- Name: Rates Rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Rates"
    ADD CONSTRAINT "Rates_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2155 (class 2606 OID 28516)
-- Name: Requests Requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Requests"
    ADD CONSTRAINT "Requests_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2157 (class 2606 OID 28553)
-- Name: ResultExportFiles ResultExportFiles_Result_Id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultExportFiles"
    ADD CONSTRAINT "ResultExportFiles_Result_Id_key" UNIQUE ("Result_Id");


--
-- TOC entry 2159 (class 2606 OID 28538)
-- Name: ResultExportFiles ResultExportFiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultExportFiles"
    ADD CONSTRAINT "ResultExportFiles_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2135 (class 2606 OID 16490)
-- Name: ResultType ResultType_Name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultType"
    ADD CONSTRAINT "ResultType_Name_key" UNIQUE ("Name");


--
-- TOC entry 2137 (class 2606 OID 16456)
-- Name: ResultType ResultType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultType"
    ADD CONSTRAINT "ResultType_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2133 (class 2606 OID 16433)
-- Name: Results Results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "Results_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2151 (class 2606 OID 16883)
-- Name: UserForProcessing UserForProcessing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserForProcessing"
    ADD CONSTRAINT "UserForProcessing_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2141 (class 2606 OID 16554)
-- Name: UserLicense UserLicense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserLicense"
    ADD CONSTRAINT "UserLicense_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2131 (class 2606 OID 16415)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("Id");


--
-- TOC entry 2166 (class 2606 OID 16730)
-- Name: Activities Activities_RootComponent_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_RootComponent_Id_fkey" FOREIGN KEY ("RootComponent_Id") REFERENCES "Components"("Id");


--
-- TOC entry 2165 (class 2606 OID 16656)
-- Name: Activities Activities_User_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Activities"
    ADD CONSTRAINT "Activities_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id");


--
-- TOC entry 2172 (class 2606 OID 16779)
-- Name: Blog Blog_Component_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Blog"
    ADD CONSTRAINT "Blog_Component_Id_fkey" FOREIGN KEY ("Component_Id") REFERENCES "Components"("Id");


--
-- TOC entry 2170 (class 2606 OID 16761)
-- Name: Blog Blog_CreatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Blog"
    ADD CONSTRAINT "Blog_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "Users"("Id");


--
-- TOC entry 2171 (class 2606 OID 16766)
-- Name: Blog Blog_ModifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Blog"
    ADD CONSTRAINT "Blog_ModifiedBy_fkey" FOREIGN KEY ("ModifiedBy") REFERENCES "Users"("Id");


--
-- TOC entry 2161 (class 2606 OID 16474)
-- Name: Results FK_ResultType_Results; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "FK_ResultType_Results" FOREIGN KEY ("Type_Id") REFERENCES "ResultType"("Id");


--
-- TOC entry 2160 (class 2606 OID 16434)
-- Name: Results FK_Result_User; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "FK_Result_User" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON UPDATE RESTRICT;


--
-- TOC entry 2169 (class 2606 OID 16709)
-- Name: Knowledges Knowledges_Component_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Knowledges"
    ADD CONSTRAINT "Knowledges_Component_Id_fkey" FOREIGN KEY ("Component_Id") REFERENCES "Components"("Id");


--
-- TOC entry 2167 (class 2606 OID 16688)
-- Name: Knowledges Knowledges_CreatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Knowledges"
    ADD CONSTRAINT "Knowledges_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "Users"("Id");


--
-- TOC entry 2168 (class 2606 OID 16693)
-- Name: Knowledges Knowledges_ModifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Knowledges"
    ADD CONSTRAINT "Knowledges_ModifiedBy_fkey" FOREIGN KEY ("ModifiedBy") REFERENCES "Users"("Id");


--
-- TOC entry 2175 (class 2606 OID 28517)
-- Name: Requests Requests_Result_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Requests"
    ADD CONSTRAINT "Requests_Result_Id_fkey" FOREIGN KEY ("Result_Id") REFERENCES "Results"("Id");


--
-- TOC entry 2176 (class 2606 OID 28522)
-- Name: Requests Requests_User_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Requests"
    ADD CONSTRAINT "Requests_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id");


--
-- TOC entry 2177 (class 2606 OID 28539)
-- Name: ResultExportFiles ResultExportFiles_Result_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "ResultExportFiles"
    ADD CONSTRAINT "ResultExportFiles_Result_Id_fkey" FOREIGN KEY ("Result_Id") REFERENCES "Results"("Id");


--
-- TOC entry 2162 (class 2606 OID 16720)
-- Name: Results Results_Component_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Results"
    ADD CONSTRAINT "Results_Component_Id_fkey" FOREIGN KEY ("Component_Id") REFERENCES "Components"("Id");


--
-- TOC entry 2174 (class 2606 OID 17746)
-- Name: Segments Segments_Result_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Segments"
    ADD CONSTRAINT "Segments_Result_Id_fkey" FOREIGN KEY ("Result_Id") REFERENCES "Results"("Id");


--
-- TOC entry 2173 (class 2606 OID 16868)
-- Name: UserForProcessing UserForProcessing_Result_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserForProcessing"
    ADD CONSTRAINT "UserForProcessing_Result_Id_fkey" FOREIGN KEY ("Result_Id") REFERENCES "Results"("Id");


--
-- TOC entry 2164 (class 2606 OID 16628)
-- Name: UserLicense UserLicence_Rate_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserLicense"
    ADD CONSTRAINT "UserLicence_Rate_Id_fkey" FOREIGN KEY ("Rate_Id") REFERENCES "Rates"("Id");


--
-- TOC entry 2163 (class 2606 OID 16555)
-- Name: UserLicense UserLicense_User_Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UserLicense"
    ADD CONSTRAINT "UserLicense_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id");


-- Completed on 2017-03-06 21:35:48

--
-- PostgreSQL database dump complete
--

