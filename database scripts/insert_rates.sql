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

ALTER TABLE public."Rates"
    ADD COLUMN "TotalRequestLimit" bigint;

ALTER TABLE public."Rates"
    ADD COLUMN "ExportLimit" bigint DEFAULT 0;  

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

