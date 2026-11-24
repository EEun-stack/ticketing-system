--
-- PostgreSQL database dump
--

\restrict jtNefyHuiWLbfdLUxZheuakbchEGWbdfguNGDq0vfKGqSl4qWaZjY7AdQhA6g9L

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'DECLINED',
    'CANCELLED'
);


--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'NEW',
    'PENDING',
    'FOR_APPROVAL',
    'IN_PROGRESS',
    'RESOLVED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPERADMIN',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "actorId" text,
    "actorName" text,
    "actorEmail" text,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    details jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: board_room_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_room_bookings (
    id text NOT NULL,
    name text NOT NULL,
    department text NOT NULL,
    date date NOT NULL,
    "startTime" text NOT NULL,
    attendees integer NOT NULL,
    purpose text NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "reviewedById" text,
    "reviewedByName" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endTime" text
);


--
-- Name: form_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_settings (
    id integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "requestTypes" text[] NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    units text[] DEFAULT ARRAY['Main Office'::text] NOT NULL,
    "requestTypeOptions" jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: support_request_control_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.support_request_control_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: support_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_requests (
    id text NOT NULL,
    "employeeName" text NOT NULL,
    department text NOT NULL,
    contact text,
    "requestType" text NOT NULL,
    subject text,
    description text,
    status public."RequestStatus" DEFAULT 'NEW'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "requestSubType" text,
    "statusUpdatedByName" text,
    "statusUpdatedAt" timestamp(3) without time zone,
    "claimedById" text,
    "claimedByName" text,
    feedback text,
    "feedbackSubmittedAt" timestamp(3) without time zone,
    "controlId" text NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."UserRole" DEFAULT 'ADMIN'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text,
    expertise text[] DEFAULT ARRAY[]::text[],
    "lastLoginAt" timestamp(3) without time zone
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b4418a0e-ea54-426d-bf7b-0366086a8aca	7031e11fd13d46edf7f893f2d9ba7da7d9dcc4db5a9488ebf55addb7b3af902f	2026-09-10 08:31:52.676436+08	20260910100000_add_request_control_id	\N	\N	2026-09-10 08:31:52.619856+08	1
671de5f5-8816-4dd8-a724-fbde0a457c6b	e5a25488770d6fb4e046f8b412369a86a6417c9c86fa293cd33964aa8ad803f9	2026-09-04 09:36:22.18835+08	20260825145052_init	\N	\N	2026-09-04 09:36:22.181397+08	1
8e74ac44-9a05-4886-89fe-0442d24c0678	c2f8067bbbb1f97890df815d7f189d28de69a2c1a2358ba6245f446f02e5ca4a	2026-09-04 09:36:22.197073+08	20260826120000_support_requests_and_settings	\N	\N	2026-09-04 09:36:22.188816+08	1
a41c8c52-672a-434c-8188-d797fd8cde5a	d69c858058226552951ca8f1f0904ac54551d3f44246dee0b6712e6654b84b7b	2026-09-04 09:36:22.199342+08	20260827100000_add_units_to_form_settings	\N	\N	2026-09-04 09:36:22.197467+08	1
2672e12d-8503-4116-9218-cbb63d122c5b	72ce978150b51d1bb8c4e59359e21aa23416d6413da63cb03f6ca532ed64304b	2026-09-10 09:09:38.350857+08	20260910110000_make_control_id_sequence_global	\N	\N	2026-09-10 09:09:38.345009+08	1
91c9212a-1403-46d1-9de9-a91cf271ca80	2149a50bdcef9769e5fc146dc91e90007fef1d5c9bb938c1aa95e0bc9665ee52	2026-09-04 09:36:22.201338+08	20260827103000_make_optional_request_fields_nullable	\N	\N	2026-09-04 09:36:22.199814+08	1
49baee80-90ec-4610-a6c2-12d0c3406f2f	c28ab58331c7ed3b48839205b1d84f243c84aaa8f6654a0e7e4a4caf34302acf	2026-09-04 09:36:22.204341+08	20260827110000_add_request_type_options_remove_priority	\N	\N	2026-09-04 09:36:22.201681+08	1
963f4455-ab8c-4105-81b7-f364752b14e2	c1e1e65832a1535fac58d38f288d49315489db62555e953a58b3ce2e1c76c3bd	2026-09-04 09:36:22.215504+08	20260827120000_update_request_statuses	\N	\N	2026-09-04 09:36:22.204676+08	1
a54a3550-a97d-449d-bc56-5c8a2920c12e	f0c19cd5196b7f5bae8bf18b76544265d2f2d5affc7932036ab9f41e928a0618	2026-09-10 09:12:04.744672+08	20260910120000_add_atomic_control_id_sequence	\N	\N	2026-09-10 09:12:04.729311+08	1
6635ef14-9b86-441b-850b-e123b8e78042	68b7a91439630738f162216dbe42cd4089d569a8efa078c90c9e68d2e664e775	2026-09-04 09:36:22.220326+08	20260827123000_add_users_and_request_editor	\N	\N	2026-09-04 09:36:22.216021+08	1
8e5b2814-a959-446a-a669-33a492b014de	b4fffbad102c63c9fe841ca93f4885e1dc4218fc00777ac7e1efbf7365531521	2026-09-04 09:36:22.226752+08	20260828130000_add_activity_logs	\N	\N	2026-09-04 09:36:22.220698+08	1
a9b73d6f-012c-46d5-b6f4-63d1fc6dd0a0	08f5654dd0e5b04e3db7fdb998990fdfa1ed694fecaefed7af1f8e30ef326acc	2026-09-04 09:36:22.228722+08	20260902000000_add_admin_user_expertise_and_last_login	\N	\N	2026-09-04 09:36:22.227231+08	1
0eaa6d0d-5331-4bad-93aa-0f9e797ac005	c3dbad06ec40d450722502c189892e2a4960059c713c40a88cc154d356688d02	2026-09-14 11:16:26.166212+08	20260914140000_add_board_room_bookings	\N	\N	2026-09-14 11:16:26.099145+08	1
5eae0999-cd75-4a33-b826-0b5bcd37ebce	1a1d6591887ef8ffe380e56916670ff1ff73169f940182b7e4bc0f7000a4af7f	2026-09-04 09:36:22.234385+08	20260902100000_fix_user_expertise_as_array	\N	\N	2026-09-04 09:36:22.229086+08	1
00443f44-e17c-494a-bd64-290ddd315820	0d7eee7251dd9d4946708af626f413d864967dfcfc52f72bafafbe121b00558d	2026-09-08 10:29:15.643879+08	20260908120000_add_request_claims	\N	\N	2026-09-08 10:29:15.606757+08	1
0646ca6b-128e-4ed9-9bce-2073e4a1ffbc	846fc3c8a05f56eaba345d91182d307aa2ac76a5c2adc45694f682917f1ea1de	2026-09-09 14:38:31.059738+08	20260909100000_add_request_feedback	\N	\N	2026-09-09 14:38:31.041221+08	1
bf64ea9c-32fd-4686-a112-97afecffef0c	387660bef1fffbc43d6bfa3583bcc112085e49d7ff7c0a409520f99b1b171fa4	2026-09-18 13:49:53.882194+08	20260918100000_add_board_room_end_time	\N	\N	2026-09-18 13:49:53.866086+08	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, "actorId", "actorName", "actorEmail", action, "entityType", "entityId", details, "ipAddress", "createdAt") FROM stdin;
22a80b1e-4c9c-4255-b0bd-3ae969faf711	4e93def6-b936-4b3a-9278-c966c0c55272	superadmin@fti.gov.ph	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 01:37:50.117
5f1daf4f-c5a9-44bc-a0a1-4aa6186cce74	4e93def6-b936-4b3a-9278-c966c0c55272	superadmin@fti.gov.ph	superadmin@fti.gov.ph	ACCOUNT_UPDATED	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"name": "SuperAdmin", "email": "superadmin@fti.gov.ph", "expertise": [], "passwordChanged": false}	127.0.0.1	2026-09-04 01:39:23.243
083cc805-cb93-4264-b932-a9a14c2bcd18	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 01:39:27.481
fd97c4f2-cd81-46df-b55f-c71f25adec79	661c5cb9-df0d-489a-ba61-51ee57980e47	admin@fti.gov.ph	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-04 01:39:49.403
28ec668b-569d-45d1-beeb-ebfa0948716c	661c5cb9-df0d-489a-ba61-51ee57980e47	admin@fti.gov.ph	admin@fti.gov.ph	ACCOUNT_UPDATED	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"name": "Admin", "email": "admin@fti.gov.ph", "expertise": [], "passwordChanged": false}	127.0.0.1	2026-09-04 01:40:04.019
a1a2bed9-4f1b-4a3e-b97f-bc10fa70cdec	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 01:40:19.551
892e0295-3fdc-4df5-8e85-73f9988229dc	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 01:42:58.971
40fef4e4-ba44-4dd8-866f-bff60fcb0ff6	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 02:17:38.728
fefe4d30-fd99-45b6-891b-e3c442e1f514	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 02:55:02.285
a6e16852-1e44-4a37-98a2-001071274e04	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 03:02:32.311
31328b72-7ef6-40c8-a113-267f715e7fa6	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Network", "Account / Access", "Printer", "Other"]}	192.1.0.12	2026-09-04 03:04:51.9
6272a4d9-cfca-41f8-a10a-56e1f33c0919	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 03:07:49.63
d8139e18-876d-495c-89b8-62eb100d7eff	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware"]}	192.1.0.12	2026-09-04 03:09:28.726
f768cd48-5d2d-4446-891f-d911306d8e4a	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software"]}	192.1.0.12	2026-09-04 03:10:23.541
d938cbbe-63a0-4762-9309-c3c9c0fe5037	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network"]}	192.1.0.12	2026-09-04 03:15:26.349
5c0b7505-dd04-436a-a863-b42aed2cd19f	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login"]}	192.1.0.12	2026-09-04 03:16:20.66
140c7734-eac1-4dca-8731-2325c849f4c8	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder"]}	192.1.0.12	2026-09-04 03:18:23.157
90916b56-c51a-437a-8935-c70c3b58a9a1	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner"]}	192.1.0.12	2026-09-04 03:19:59.643
044ab220-7eff-462e-9b0a-1a1ef7c592d5	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner", "Email", "System / Operating System"]}	192.1.0.12	2026-09-04 03:21:38.359
c28f801a-0482-41cf-8224-4d197f8578e0	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner", "Email", "System / Operating System", "Security"]}	192.1.0.12	2026-09-04 03:22:22.813
cd409d31-251a-4d82-ba89-26442dac55b5	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner", "Email", "System / Operating System", "Security", "File / Data", "Mobile / Other Devices", "IT Request"]}	192.1.0.12	2026-09-04 03:24:48.864
3fa4fcd2-7120-470e-aceb-2e6217ee5cdd	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 07:35:27.204
f04ab918-a8db-4118-b1f8-39ccd72fe69b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner", "Email", "System / Operating System", "Security", "File / Data", "Mobile / Other Devices", "IT Request", "Others"]}	192.1.0.12	2026-09-04 03:25:00.21
040ca29c-2977-4309-a233-1ae2738e03a3	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 03:25:37.77
707541c2-bcb5-4275-981e-663e827dfed5	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	SETTINGS_UPDATED	FormSettings	1	{"title": "IT Support Request", "units": ["OTP", "OEVP", "OVPBS", "OVPO", "OVPCA", "PPSU", "SSU", "ISRMU", "IAU", "COA", "EEMU", "LOGU", "SPRU", "PMT", "LSD", "LEU", "HRDMU", "PMT-NFH"], "requestTypes": ["Hardware", "Software", "Internet / Network", "Account / Login", "Shared Drive / Folder", "Printer / Scanner", "Email", "System / Operating System", "Security", "File / Data", "Mobile / Other Devices", "IT Request", "Other"]}	192.1.0.12	2026-09-04 03:25:47.608
17668b5d-5f12-4aad-ae82-c9fe632c99c0	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 03:28:24.897
5ad82ddf-532b-404a-a8d2-c4a42479cff5	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 03:32:37.024
c5146e00-1bae-4e3b-a2cf-8cc117082a9c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-04 03:40:08.991
ff6adc61-5051-4fd1-8e12-92de32442e44	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:23:10.542
ba010aab-d925-40e1-9ff3-4a5b3e6a6586	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:36:10.476
a13730f1-cb1e-48ca-8bf1-976129395833	\N	\N	\N	REQUEST_CREATED	SupportRequest	a8644dc0-09f9-4618-983e-63b0daba6ec5	{"department": "OTP", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-04 06:37:49.241
22ffbba8-9885-415a-887b-d415dc3343d2	\N	\N	\N	REQUEST_CREATED	SupportRequest	dc55bd57-8f57-40c0-920d-7dc758b157d4	{"department": "OVPO", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.32	2026-09-04 06:38:23.508
01bc192b-4642-4968-bff9-bd9074c63d3a	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:38:40.629
49d9c825-b49b-4781-8a0d-0457f73d7de0	\N	\N	\N	REQUEST_CREATED	SupportRequest	de86dd44-9b44-457b-bb1b-bf918f3fd57b	{"department": "ISRMU", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.32	2026-09-04 06:43:20.866
d072c91f-9f76-4e0d-9757-59c0fa196fef	\N	\N	\N	REQUEST_CREATED	SupportRequest	8429f3b4-71c1-45dd-9152-aea6192a6ac7	{"department": "ISRMU", "requestType": "Software", "employeeName": "JUSTINE JEREMY CODERA"}	192.1.0.32	2026-09-04 06:45:10.864
218dd69c-94b4-483a-a4f0-f12e934b3ef5	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:45:26.231
30ffd875-0743-40e6-b2a1-e7bcf356fa44	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	8429f3b4-71c1-45dd-9152-aea6192a6ac7	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Software", "requesterName": "JUSTINE JEREMY CODERA"}	192.1.0.12	2026-09-04 06:45:40.366
0b961319-431a-432d-a1d5-776fc908f9d7	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	8429f3b4-71c1-45dd-9152-aea6192a6ac7	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Software", "requesterName": "JUSTINE JEREMY CODERA"}	192.1.0.12	2026-09-04 06:45:41.929
a10d9446-dc90-4867-a0d2-a7ac72b8099b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	ADMIN_USER_UPDATED	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"name": "Admin", "email": "admin@fti.gov.ph", "expertise": ["Email", "Account / Login", "File / Data", "Other", "Mobile / Other Devices", "System / Operating System", "Shared Drive / Folder", "Software", "Internet / Network", "Printer / Scanner", "Security", "Hardware", "IT Request"], "passwordChanged": false}	192.1.0.12	2026-09-04 06:46:26.574
a4a99702-63d3-4a6a-9744-c76836775721	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	de86dd44-9b44-457b-bb1b-bf918f3fd57b	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-04 06:46:40.816
3ea66e1e-21fa-4e14-941f-3d6fe4bbea59	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	de86dd44-9b44-457b-bb1b-bf918f3fd57b	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-04 06:46:42.434
dfaeeacd-f98e-4a84-9921-18d595c0bc97	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:47:06.146
67819609-db5d-4260-9c31-92dee54107be	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-04 06:49:17.322
d1a70391-2b9b-4234-957f-057096eca6c5	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-04 06:51:03.556
7b7f15dc-c945-491a-b2c8-82a36279f65b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 06:52:11.422
35de680d-d336-4aaa-8833-51f9207d01a0	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 07:16:17.724
7bb3f8a4-4e95-4d22-9c58-29fe3ab91cd0	\N	\N	\N	REQUEST_CREATED	SupportRequest	9073bdb7-e670-49a7-a1f8-b90c2578eb0c	{"department": "OTP", "requestType": "Other", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-04 07:28:26.219
3b549bf8-e4b9-4683-8394-7f8848e4f12d	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 07:28:32.967
9255dddb-06e8-4fc9-857f-27eb00386893	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	9073bdb7-e670-49a7-a1f8-b90c2578eb0c	{"to": "PENDING", "from": "NEW", "requestType": "Other", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-04 07:33:35.727
7c9d3661-930f-4777-943d-d092bacd2666	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-04 07:36:47.1
835778b2-8c72-4961-b971-d2c91f06ba23	\N	\N	\N	REQUEST_CREATED	SupportRequest	d9f5221c-2e88-4fda-bd17-f7fbba618191	{"department": "ISRMU", "requestType": "Software", "employeeName": "Edglor"}	192.1.0.32	2026-09-07 01:02:09.539
69d0f501-e901-488d-9161-b5b683435ef7	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 01:02:15.123
686f0e54-65e1-4d99-a492-77608f9a0d0b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 01:03:21.225
74cc65b9-9fa3-4dfa-92d4-64cf552b9955	\N	\N	\N	USER_LOGIN_FAILED	User	\N	{"email": "superadmin@fti.gov.ph"}	192.1.0.32	2026-09-07 01:04:48.647
8b3e45a1-a033-488a-892f-9d9796b77693	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.32	2026-09-07 01:05:02.11
cba41308-d25c-4bb1-b559-670470d437ed	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	d9f5221c-2e88-4fda-bd17-f7fbba618191	{"to": "PENDING", "from": "NEW", "requestType": "Software", "requesterName": "Edglor"}	192.1.0.32	2026-09-07 01:05:19.42
379e6f5e-2d15-40d6-87de-898f1c8ca283	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	ADMIN_USER_CREATED	User	d3e6f297-6559-42bd-86ad-afc0032f8d6f	{"name": "Justine Codera", "email": "jccodera@fti.gov.ph"}	192.1.0.32	2026-09-07 01:06:31.894
acf379ca-4326-4db5-bcf6-3b3ccf105246	d3e6f297-6559-42bd-86ad-afc0032f8d6f	Justine Codera	jccodera@fti.gov.ph	USER_LOGIN	User	d3e6f297-6559-42bd-86ad-afc0032f8d6f	{"role": "ADMIN"}	192.1.1.90	2026-09-07 01:06:52.393
10b63ef7-88b1-4e26-88a7-d95d12fc3d3e	d3e6f297-6559-42bd-86ad-afc0032f8d6f	Justine Codera	jccodera@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	9073bdb7-e670-49a7-a1f8-b90c2578eb0c	{"to": "IN_PROGRESS", "from": "PENDING", "requestType": "Other", "requesterName": "Mark Ian Delgado"}	192.1.1.90	2026-09-07 01:07:33.432
08fce6eb-35fd-4943-ac6a-106db8d136c1	d3e6f297-6559-42bd-86ad-afc0032f8d6f	Justine Codera	jccodera@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	9073bdb7-e670-49a7-a1f8-b90c2578eb0c	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Other", "requesterName": "Mark Ian Delgado"}	192.1.1.90	2026-09-07 01:07:39.283
9bd6a644-831f-4d92-8ed2-a78c22b26a66	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-07 01:28:36.965
75e90ec3-b459-45ad-8a36-657dfb892476	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 01:38:40.915
758bd6a9-87bf-4ffd-b677-70bca67c5356	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 01:39:18.674
bd166718-1a9f-4bbc-9db5-88a2b0235c2b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 04:58:03.075
7f3f2e0c-e149-4403-824e-d07bc88da6d6	\N	\N	\N	REQUEST_CREATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"department": "ISRMU", "requestType": "Printer / Scanner", "employeeName": "Raf"}	192.1.0.20	2026-09-07 05:55:08.751
5a16a139-454e-462e-bc8d-05feccadfe86	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "PENDING", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.32	2026-09-07 06:00:13.968
20a537cf-0dec-478f-a448-d535a05c9e03	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "NEW", "from": "PENDING", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.32	2026-09-07 06:01:07.857
7bf1b9d4-4d84-4a91-b499-c627fcbc0a78	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "PENDING", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.32	2026-09-07 06:01:19.077
ac20063f-d4b1-4f49-a831-cff2bdf05c25	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "RESOLVED", "from": "PENDING", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.32	2026-09-07 06:01:41.056
b6996bf5-72c0-40a8-913e-7627ea184ea6	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "RESOLVED", "from": "RESOLVED", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:01:53.163
13ee588a-7b45-4dfd-9d81-5451aa78921a	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-07 06:04:41.175
5ce5d6a9-630a-4be7-8a6d-3983efaae999	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "IN_PROGRESS", "from": "RESOLVED", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:04:54.536
28dd7c1e-a55c-4dd5-ae9d-a0e588382b6e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:04:58.664
097bd896-5472-48ab-a754-2c0cdfd73c6c	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "IN_PROGRESS", "from": "RESOLVED", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:05:09.989
f39ee173-e43c-4c29-be01-3007ce0038c1	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:05:12.124
7908766a-0741-4365-ab5f-bb47097fc9c8	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "IN_PROGRESS", "from": "RESOLVED", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:05:22.713
f5a7eabc-ac1b-4f4a-b14b-921bcca8fc2e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Printer / Scanner", "requesterName": "Raf"}	192.1.0.12	2026-09-07 06:05:25.324
5ca20cab-a670-47a9-8401-cca3b118b884	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-07 23:33:51.371
ba859f8f-2a3c-4b9f-ab6f-866e2d8876d4	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 01:03:23.826
d4bcb684-0a2e-49cd-9c68-ce6c17d09c57	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	dc55bd57-8f57-40c0-920d-7dc758b157d4	{"to": "RESOLVED", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:02:50.164
f7c08ef2-77da-46be-87d6-49c6d8702de7	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	a8644dc0-09f9-4618-983e-63b0daba6ec5	{"to": "RESOLVED", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:02:52.458
d899e90e-6a35-4eaf-a9fa-09523d1c157c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 02:22:52.149
0108db1b-69f1-4dac-8c7e-de74e3e9c687	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 02:23:05.277
1ce76270-019e-48b6-a75c-01ac25c6ba16	\N	\N	\N	REQUEST_CREATED	SupportRequest	4eef3b34-983d-407b-a896-326e351824da	{"department": "ISRMU", "requestType": "Printer / Scanner", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:23:29.357
886feb65-df30-40bd-9a8e-93a3f9ec63be	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 02:23:36.671
43ca2b5e-5436-47d6-b73c-de74bc6d73c9	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	4eef3b34-983d-407b-a896-326e351824da	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:30:05.588
3548ae0e-79ef-4268-9f25-9538115005e8	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	a8644dc0-09f9-4618-983e-63b0daba6ec5	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:15.101
aadd8928-cfc7-43e8-a4ea-6ce45b31f9d9	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	dc55bd57-8f57-40c0-920d-7dc758b157d4	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:18.592
8e04244a-eb03-4180-8538-2137be99b317	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	de86dd44-9b44-457b-bb1b-bf918f3fd57b	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:20.51
088fb78b-aaa2-4218-865c-ce48206c3525	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	8429f3b4-71c1-45dd-9152-aea6192a6ac7	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:22.457
fd13e285-e439-4076-9272-b52411cbc01f	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	9073bdb7-e670-49a7-a1f8-b90c2578eb0c	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:24.044
012405a1-88cc-4258-9583-4f35ff7cae25	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	d9f5221c-2e88-4fda-bd17-f7fbba618191	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:25.663
542d8ce6-e911-42ce-89aa-1d7db336ae47	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	2544f916-4746-4b8b-ae66-4364268aae73	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:33:30.588
1c90d163-c753-4b76-8ca1-3158edc370b3	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	4eef3b34-983d-407b-a896-326e351824da	{"to": "RESOLVED", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:33:36.002
50234022-8286-44df-ba16-f24a0e13123e	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 02:36:11.703
4d40eb3c-10be-4b9c-adc4-7026bb3619a7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 02:40:28.02
7ca721ba-5510-4074-bc68-24af61c810e4	\N	\N	\N	REQUEST_CREATED	SupportRequest	3f1cec56-11b2-4b9d-afb1-4fecc5f747e7	{"department": "ISRMU", "requestType": "Software", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:42:17.379
d9b97ea2-85fa-4e10-b595-55599491e581	\N	\N	\N	REQUEST_CREATED	SupportRequest	8c71dd2b-dc0c-4524-8e94-61b221bc753e	{"department": "ISRMU", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:47:34.493
2a4532dc-59fc-4092-a309-8afec0304ca8	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 02:47:43.725
a5f726bc-fac1-4041-94f4-ee189fa288d7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	3f1cec56-11b2-4b9d-afb1-4fecc5f747e7	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:47:51.911
144f2243-c9b6-403e-b2bb-f956a1081e97	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	3f1cec56-11b2-4b9d-afb1-4fecc5f747e7	{"to": "RESOLVED", "from": "NEW", "requestType": "Software", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:47:53.577
82a30f25-ed41-4198-8478-8bae00f8907e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	8c71dd2b-dc0c-4524-8e94-61b221bc753e	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:47:56.695
c707af51-04ee-47fb-b021-884b1b653aae	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	8c71dd2b-dc0c-4524-8e94-61b221bc753e	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:48:34.905
fee7f752-49d7-4785-850f-ea413447db56	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	8c71dd2b-dc0c-4524-8e94-61b221bc753e	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:48:40.722
2bd3dbd7-69fb-4953-b2a7-90552aecfe5d	\N	\N	\N	REQUEST_CREATED	SupportRequest	5627ebf1-81a1-46a3-b4bd-32422cb8fde3	{"department": "ISRMU", "requestType": "Internet / Network", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:50:34.325
5464d9a1-86bd-455e-b625-52591feae997	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 02:50:41.944
4d61e02d-ef6d-41ed-a69b-4ce8efe86589	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	5627ebf1-81a1-46a3-b4bd-32422cb8fde3	{"claimedBy": "Admin"}	192.1.0.12	2026-09-08 02:50:48.928
57888830-840d-477c-9d27-3aac0ddd79ac	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	5627ebf1-81a1-46a3-b4bd-32422cb8fde3	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Internet / Network", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:50:53.978
7b4c4c24-a21c-4022-aebb-761707ebcfb8	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-09 06:37:01.094
b18717c0-b5f1-42ed-a976-6d87af76977c	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	5627ebf1-81a1-46a3-b4bd-32422cb8fde3	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Internet / Network", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-08 02:51:02.131
586da881-9d5b-4cff-b140-5d5fa0e2a87d	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 02:52:39.816
f71c88c8-bf76-4a6c-9d3f-99bccb8532ef	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 02:56:07.94
07961edd-bcbe-40b8-8ddc-5a2390b2116d	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 03:52:37.736
e861dfd4-5863-4ecc-a489-5a77105aadb1	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 03:58:09.692
0a2dde6c-11fe-414c-8b1f-6b1cf898a3b3	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 03:58:23.149
e14e8799-706d-47f2-852f-c62b5a020e02	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 06:31:11.061
57714673-f2ae-4c8d-a53e-a807d80cd1a3	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-08 07:35:45.967
54837815-e8d7-4471-b1b2-ea7f3e7e097a	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 07:38:28.664
8d5f0cf9-8850-444f-920d-1fa51714e854	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 07:49:38.859
d16f5de3-3f0b-4a1a-84a0-e59de3826f15	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-08 08:36:45.506
6bda14b2-d0de-45bf-8733-dc6c6a1e6d54	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-09 00:11:25.432
818265ce-0cef-4086-a7f8-76b198b9bf0f	\N	\N	\N	REQUEST_CREATED	SupportRequest	037ee104-7337-46d6-a6aa-2a929f850ff2	{"department": "ISRMU", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 00:14:22.183
d1a4e38e-4ade-4a23-930c-f2ffc0c3d73e	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-09 04:58:16.582
ca3cc995-13bf-488c-8340-fc0b3224f724	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-09 04:58:45.355
25d4188a-5b89-4afc-8695-d40f5114f850	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	037ee104-7337-46d6-a6aa-2a929f850ff2	{"claimedBy": "Admin"}	192.1.0.12	2026-09-09 04:58:47.466
00a822c8-056b-4f88-b15e-ab76fbe1927e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	037ee104-7337-46d6-a6aa-2a929f850ff2	{"to": "RESOLVED", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 04:58:50.14
03a1a709-6856-4322-9a86-413a7c14d8be	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-09 04:58:55.387
a81cf44d-6e40-4d24-a61e-413aa7ee27e7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-09 06:32:10.246
99bfc189-2587-43af-99b0-d30a396e61fb	\N	\N	\N	REQUEST_CREATED	SupportRequest	67710051-ea4d-4733-865a-a17b358658ce	{"department": "ISRMU", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:32:24.468
abac0201-9ef6-4216-91f7-5c036a0cf16b	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-09 06:32:53.809
927655cb-b5f8-43a0-b964-3095bef57e09	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-09 06:32:57.813
608c486e-4d73-4337-a013-3e36df7ab3dd	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	67710051-ea4d-4733-865a-a17b358658ce	{"claimedBy": "Admin"}	192.1.0.12	2026-09-09 06:33:03.326
5559e2c4-0116-446b-bc0a-01dd9496ffaf	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	67710051-ea4d-4733-865a-a17b358658ce	{"to": "PENDING", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:33:04.922
3fb07e48-c68c-4765-9e97-854e114756d9	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	67710051-ea4d-4733-865a-a17b358658ce	{"to": "IN_PROGRESS", "from": "PENDING", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:33:06.638
bf2f545f-6960-45e5-8aab-57d0064a4e3d	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	67710051-ea4d-4733-865a-a17b358658ce	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:33:07.974
c874c81f-21ed-4cd6-8ebe-fb861d45f3ba	\N	\N	\N	REQUEST_CREATED	SupportRequest	5dfdeed4-fe55-424f-b7bc-8507be89b2e6	{"department": "ISRMU", "requestType": "Printer / Scanner", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:34:48.711
46d65f16-ec99-40a5-98ee-5b6fbf39f591	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-09 06:35:09.565
a355a1b4-cc8a-4307-a527-f1f7c3fa3338	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	5dfdeed4-fe55-424f-b7bc-8507be89b2e6	{"claimedBy": "Admin"}	192.1.0.12	2026-09-09 06:35:15.934
12fa645b-315d-4527-b7bd-96014d6d7469	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	5dfdeed4-fe55-424f-b7bc-8507be89b2e6	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:35:19.783
0305f517-0c9e-4212-9864-83c832087535	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	5dfdeed4-fe55-424f-b7bc-8507be89b2e6	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:36:43.848
69aa44bd-face-4e4e-8d78-4da4c2f1965a	\N	\N	\N	REQUEST_CREATED	SupportRequest	f61910c2-13da-4c14-a3b8-050bd1a8cc51	{"department": "ISRMU", "requestType": "Printer / Scanner", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:37:16.628
ca7cda8c-5694-44ff-bcdc-74fac97a801b	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	f61910c2-13da-4c14-a3b8-050bd1a8cc51	{"claimedBy": "Admin"}	192.1.0.12	2026-09-09 06:37:49.874
969b6cf5-ed28-4c22-8175-157d5f9e6b6e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	f61910c2-13da-4c14-a3b8-050bd1a8cc51	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:40:01.13
d2e891d0-fa12-469c-b6cb-212f535db9b2	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	f61910c2-13da-4c14-a3b8-050bd1a8cc51	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-09 06:40:08.656
93d2a690-71bb-4332-8363-f2604fc4018f	\N	\N	\N	REQUEST_FEEDBACK_SUBMITTED	SupportRequest	f61910c2-13da-4c14-a3b8-050bd1a8cc51	{"feedbackLength": 20}	192.1.0.12	2026-09-09 06:40:33.482
8fe2c9b7-0834-4fa6-ba82-d26a0f3c085e	\N	\N	\N	REQUEST_CREATED	SupportRequest	46812c90-24bd-42ec-a425-f93a7a92ecc3	{"department": "ISRMU", "requestType": "Other", "employeeName": "bhebhekhousz"}	192.1.1.251	2026-09-09 07:27:36.273
f14b515e-cd84-4845-8671-6925f30cf355	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	46812c90-24bd-42ec-a425-f93a7a92ecc3	{"claimedBy": "Admin"}	192.1.0.12	2026-09-09 08:34:02.418
8c13644a-2db9-49e9-9f1a-5893d2a5ff72	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 00:22:23.852
1cc3388a-eca0-44da-a626-985a6559426b	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 00:26:49.774
1cc91503-6b02-436e-ae48-3dab72f90aeb	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 00:27:28.74
b225d396-afaf-4c5f-9a24-76a670cf14e1	abc	Test	a@b.com	REQUEST_CREATED	SupportRequest	e8034feb-a4dc-4d0c-af7a-baf78bfc7005	{"controlId": "REQ-20260910-0001", "department": "Main Office", "requestType": "Hardware", "employeeName": "Test User"}	127.0.0.1	2026-09-10 00:40:42.35
ec23d9fd-a979-4b0a-9fe6-d7277a0bcfc7	\N	\N	\N	REQUEST_CREATED	SupportRequest	cc288d92-e152-4dc6-a6e1-7ef144dad1ac	{"controlId": "REQ-20260910-0002", "department": "ISRMU", "requestType": "Software", "employeeName": "Mark Ian Delgado"}	127.0.0.1	2026-09-10 00:43:02.444
c54983e9-f8f9-4ae3-aa5a-e9d9446fc0b2	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 00:43:35.131
79a3e711-593a-43e0-b272-547545f8762f	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 00:44:14.443
e9021881-8fac-4ba2-8848-638c3a137cdc	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	46812c90-24bd-42ec-a425-f93a7a92ecc3	{"to": "RESOLVED", "from": "NEW", "requestType": "Other", "requesterName": "bhebhekhousz"}	127.0.0.1	2026-09-10 00:44:19.522
8a620d79-9ee5-40ca-aebf-b4a8ac6b0cbc	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	e8034feb-a4dc-4d0c-af7a-baf78bfc7005	{"claimedBy": "Admin"}	127.0.0.1	2026-09-10 00:44:34.825
93a32d16-1c3c-49b3-8352-9a6da68840a2	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	e8034feb-a4dc-4d0c-af7a-baf78bfc7005	{"to": "RESOLVED", "from": "NEW", "requestType": "Hardware", "requesterName": "Test User"}	127.0.0.1	2026-09-10 00:44:36.481
57219390-4f4e-47f3-9bc6-35a39b5dd398	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	cc288d92-e152-4dc6-a6e1-7ef144dad1ac	{"claimedBy": "Admin"}	127.0.0.1	2026-09-10 00:44:39.791
77b056a7-98b0-4e86-88c1-9b620152b2ef	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	cc288d92-e152-4dc6-a6e1-7ef144dad1ac	{"to": "RESOLVED", "from": "NEW", "requestType": "Software", "requesterName": "Mark Ian Delgado"}	127.0.0.1	2026-09-10 00:44:41.225
03cac3db-1378-4843-a95b-2430ae0aef8f	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 00:45:08.209
812215cc-c8ea-4637-b3fd-71d6f6294f2a	\N	\N	\N	REQUEST_CREATED	SupportRequest	cfebad01-f7c1-49a6-8c57-c8e79c4dcafd	{"controlId": "REQ-20260910-0003", "department": "ISRMU", "requestType": "Software", "employeeName": "Mark Ian Delgado"}	127.0.0.1	2026-09-10 00:59:33.001
48062dbc-3996-4a5f-a533-68928063b35e	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 01:00:20.137
e74ffad3-699a-4269-9c2d-ea9edf203674	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	cfebad01-f7c1-49a6-8c57-c8e79c4dcafd	{"claimedBy": "SuperAdmin"}	127.0.0.1	2026-09-10 01:00:36.113
6ae5a4dc-9198-46b3-960d-a798bb9af9d4	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	cfebad01-f7c1-49a6-8c57-c8e79c4dcafd	{"to": "RESOLVED", "from": "NEW", "requestType": "Software", "requesterName": "Mark Ian Delgado"}	127.0.0.1	2026-09-10 01:00:37.521
cb034262-160c-4126-823a-007b8550f581	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 01:00:50.843
1865a6eb-abe6-4257-b2e0-500724b2f2cc	\N	\N	\N	REQUEST_FEEDBACK_SUBMITTED	SupportRequest	cfebad01-f7c1-49a6-8c57-c8e79c4dcafd	{"feedbackLength": 28}	127.0.0.1	2026-09-10 01:19:48.3
ce799e45-b94c-4022-8c76-3840f29543a4	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 01:43:35.182
d79d16f2-b19f-4f6d-b6df-ad7e7b23d580	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 01:48:14.388
6d31ba1a-12b4-4e21-a5d4-20e9a5dd8dcd	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 01:58:43.761
38370d99-71c6-4126-b600-07c6f9c86393	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 01:59:48.73
363e83a3-782d-4248-bbc6-eab8b4b7cb1c	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 02:09:34.044
16908264-f5ed-44dd-b0a2-7f4d49cedbe9	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 02:13:33.777
6eb270e3-b883-4810-a5c5-afa80efafdc3	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 02:13:45.05
9cc032ed-654c-4b8b-90f9-9cbaef693f85	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	ADMIN_USER_CREATED	User	96adba7a-e7f2-46d4-b236-26e4f57e953e	{"name": "Mark Ian Delgado", "email": "mpdelgado@fti.gov.ph"}	127.0.0.1	2026-09-10 02:15:11.781
24c70b00-8287-4e74-873b-9054b59edb32	96adba7a-e7f2-46d4-b236-26e4f57e953e	Mark Ian Delgado	mpdelgado@fti.gov.ph	USER_LOGIN	User	96adba7a-e7f2-46d4-b236-26e4f57e953e	{"role": "ADMIN"}	127.0.0.1	2026-09-10 02:15:17.378
83eb5a14-20bd-48cb-9c4c-8935d5e418c0	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-10 02:28:30.393
1d3b443a-dd76-4735-b0d7-f60918c9a9bf	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 02:28:59.55
85ae063c-7a6b-40d6-a564-30fa6a4134e6	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 02:34:47.419
7f029945-faca-4868-8f78-aac8e8c3a48d	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-10 02:43:30.592
52b35275-d45d-4394-b385-bbcc608e2934	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 02:56:00.712
9d70364c-5aca-4106-8879-fda7a2c13fba	\N	\N	\N	REQUEST_FEEDBACK_SUBMITTED	SupportRequest	5dfdeed4-fe55-424f-b7bc-8507be89b2e6	{"feedbackLength": 25}	192.1.0.12	2026-09-11 03:04:04.109
91e3a08f-dea4-4070-91e4-d77e928a1bed	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 03:04:54.204
6fc59951-51ca-48e6-b95d-2941ccd3c107	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-11 03:05:09.999
c50bdcd5-0083-49bd-89dd-7f66be65bda9	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 03:07:09.389
a64dd954-061e-4da8-a0e0-17522d82fdb7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-11 03:08:24.236
2d85bfeb-da8b-4adb-9bdf-6792c9c23056	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 03:19:50.946
b0267d72-1688-4c65-8993-2a7aa78a5a71	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 03:30:59.086
863fb01a-4c4a-4ce0-9eb3-6f912aa5fe37	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-11 03:54:00.007
8b3706da-1b79-4384-9bc3-105d5148a697	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-11 03:54:33.902
6ae2161f-7164-494c-8b23-fcc2b255a8da	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-11 05:50:52.039
9dd6d656-16cd-4db8-a2ff-6ba0eccc0057	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-14 00:25:13.686
7c6241db-c662-4b5c-be42-b0d424fd055c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-14 00:37:34.187
4e0f8c8a-5877-4406-8bb1-6c444f143ce1	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-14 03:17:21.453
8195a24a-783c-4b52-85eb-7edae1e43087	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	ecfcf998-4e58-4e54-a14b-f36b973f1bb2	{"date": "2026-09-15", "startTime": "10:00", "department": "ISRMU"}	127.0.0.1	2026-09-14 04:00:00.391
7edf3c2f-2976-442e-bb9d-8b1274bbd5f2	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-14 04:00:19.839
5ab91aaa-ba3a-4396-b3e6-1adb49e84fd7	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	ecfcf998-4e58-4e54-a14b-f36b973f1bb2	{"status": "APPROVED"}	127.0.0.1	2026-09-14 04:00:30.835
38e28867-1560-43cb-be23-e33019871dc4	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-14 04:03:03.461
505fb70f-0e4e-42a8-b21d-463e16847ae3	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-14 04:03:56.992
69469bae-c9da-4383-93fd-8d7c9eb89628	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-14 05:31:46.348
7f3eb265-25a5-42bc-b6d7-9b2bdcb079ed	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	127.0.0.1	2026-09-14 06:26:37.202
6e088bf8-0519-476e-af92-f6e39599740f	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-14 06:27:54.937
e09ec7fc-0f45-4acb-925e-11d18574206c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-14 06:30:37.916
875111ed-bd86-43ce-aadf-66096fe0e4bd	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-14 06:31:34.434
30d1dc4f-b545-42d6-8071-a0166a5659b4	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 02:15:01.015
1d28ae7c-674c-44b7-80c7-b5023b2022f6	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 03:54:43.727
1e8e2e3a-689b-4575-a65f-1c5a38c13093	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 03:57:14.417
d081ea48-fca0-4843-8a67-903a655df28e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-15 03:57:21.533
c224204a-228c-4cc6-b41c-6e840bc77baf	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	e2c8b593-0644-49fc-961f-9f90b4082bb0	{"date": "2026-09-23", "startTime": "10:20", "department": "OVPBS"}	192.1.0.12	2026-09-15 04:02:13.725
c7eccc18-05d2-43be-b7ae-76d3f3f9b3ff	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	e2c8b593-0644-49fc-961f-9f90b4082bb0	{"status": "APPROVED"}	192.1.0.12	2026-09-15 04:02:36.535
004f739d-26db-4526-8fa1-3bacca72e4f9	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	0f239121-80ad-49cf-886a-408cfff7e1c9	{"date": "2026-09-16", "startTime": "10:00", "department": "OVPO"}	192.1.0.12	2026-09-15 05:01:29.583
7d8ce084-05f6-42be-be67-f7dcc1e7dea7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	0f239121-80ad-49cf-886a-408cfff7e1c9	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:01:53.19
face2c58-9565-4760-ad9f-b327d96a0516	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_DELETED	BoardRoomBooking	ecfcf998-4e58-4e54-a14b-f36b973f1bb2	{"date": "2026-09-15T00:00:00.000Z", "name": "Mark Ian Delgado", "startTime": "10:00"}	192.1.0.12	2026-09-15 05:07:05.758
e41768ea-018e-4ba7-b92a-3380ba536bf7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_DELETED	BoardRoomBooking	0f239121-80ad-49cf-886a-408cfff7e1c9	{"date": "2026-09-16T00:00:00.000Z", "name": "User", "startTime": "10:00"}	192.1.0.12	2026-09-15 05:07:07.719
f014bd8b-acaf-475d-bc9a-7712ae5fd044	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_DELETED	BoardRoomBooking	e2c8b593-0644-49fc-961f-9f90b4082bb0	{"date": "2026-09-23T00:00:00.000Z", "name": "Ian Delgado", "startTime": "10:20"}	192.1.0.12	2026-09-15 05:07:11.937
185a878a-7aa7-43d3-913e-098ea4a5022f	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 05:07:38.909
6200919f-62b0-4062-9d35-0daf63efc548	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 05:07:48.265
0413484b-b562-4076-b401-ba44bf0e3f75	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	80a2c7f7-2b22-4262-abd4-b981e31ebfbb	{"date": "2026-09-16", "startTime": "10:10", "department": "OVPO"}	192.1.0.12	2026-09-15 05:08:13.292
fce3ea1d-6660-486c-8060-7307dba44a77	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	80a2c7f7-2b22-4262-abd4-b981e31ebfbb	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:10:42.366
3f80c327-aa44-4523-9b6c-0bf03bc21de0	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	ac09464e-e2a8-49f0-940d-b6d1a8937680	{"date": "2026-09-15", "startTime": "10:10", "department": "OVPO"}	192.1.0.12	2026-09-15 05:13:06.986
82a215d8-6cc0-4a9e-8d7a-80844ae0231c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	ac09464e-e2a8-49f0-940d-b6d1a8937680	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:15:53.408
87b314a6-8f6d-4559-9e04-e3a301956073	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_DELETED	BoardRoomBooking	ac09464e-e2a8-49f0-940d-b6d1a8937680	{"date": "2026-09-15T00:00:00.000Z", "name": "gasdfgfsga", "startTime": "10:10"}	192.1.0.12	2026-09-15 05:17:22.813
8649d02b-47c7-4438-9419-db410db82a0d	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_DELETED	BoardRoomBooking	80a2c7f7-2b22-4262-abd4-b981e31ebfbb	{"date": "2026-09-16T00:00:00.000Z", "name": "User", "startTime": "10:10"}	192.1.0.12	2026-09-15 05:17:25.08
b73aeb61-23e4-4dc8-8244-a08c035f95a5	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-15 05:24:48.03
a9e3de1a-d897-4329-ae68-3b0994e6c97c	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	5a5ad00d-6cc0-4299-98c4-82e70dcd0fdc	{"date": "2026-09-17", "startTime": "10:10", "department": "OVPO"}	192.1.0.12	2026-09-15 05:25:18.203
5252c15d-6c26-448d-a265-87e3be6d3e15	\N	\N	\N	REQUEST_CREATED	SupportRequest	70db64e6-2281-4ef8-b2bf-c47567465546	{"controlId": "REQ-20260915-0020", "department": "OTP", "requestType": "Printer / Scanner", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-15 05:27:02.869
b3cf9d58-bf22-4686-b1f6-a9d3dfc5dba5	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	5a5ad00d-6cc0-4299-98c4-82e70dcd0fdc	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:27:35.228
9c4c08b1-cb55-4380-9654-dde3478b629b	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	70db64e6-2281-4ef8-b2bf-c47567465546	{"claimedBy": "Admin"}	192.1.0.12	2026-09-15 05:27:44.373
2d28a2df-603f-48ac-b8c9-f14c35057979	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	70db64e6-2281-4ef8-b2bf-c47567465546	{"to": "RESOLVED", "from": "NEW", "requestType": "Printer / Scanner", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-15 05:27:46.784
e024c70b-ead2-4513-9e6c-76912d73c433	\N	\N	\N	REQUEST_FEEDBACK_SUBMITTED	SupportRequest	70db64e6-2281-4ef8-b2bf-c47567465546	{"feedbackLength": 13}	192.1.0.12	2026-09-15 05:28:31.427
882ca0b6-8bff-4dd7-bc0c-a860bc00cf92	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	36fa5ee8-6d8a-4689-8dfc-f596203b5255	{"date": "2026-09-17", "startTime": "10:00", "department": "OTP"}	192.1.0.12	2026-09-15 05:30:36.862
599b13d1-a761-4677-8e44-dee1c9cd4f66	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	36fa5ee8-6d8a-4689-8dfc-f596203b5255	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:30:51.123
977118b0-8e97-404d-9ef6-79fe13dee0fd	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	ac77ec20-f2af-49c7-b5d3-b4ffe4a17914	{"date": "2026-09-18", "startTime": "09:00", "department": "OVPBS"}	192.1.0.12	2026-09-15 05:31:48.271
7be3b137-fb2a-46c8-848a-318884141321	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	ac77ec20-f2af-49c7-b5d3-b4ffe4a17914	{"status": "APPROVED"}	192.1.0.12	2026-09-15 05:32:08.597
7078851a-bf1c-46f8-bd48-6c46ebb245d3	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 05:52:42.958
0b699609-c7fc-4c9c-a921-3902dad7b339	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-15 06:02:22.74
22b2a479-7b82-4df2-9e51-c658bf15d0dd	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 06:04:34.715
4d800d25-d920-49bb-9591-2beb4b52368d	96adba7a-e7f2-46d4-b236-26e4f57e953e	Mark Ian Delgado	mpdelgado@fti.gov.ph	USER_LOGIN	User	96adba7a-e7f2-46d4-b236-26e4f57e953e	{"role": "ADMIN"}	192.1.0.12	2026-09-15 06:04:58.172
4e8fcebb-e0d8-4982-a0a4-11b830f35389	\N	\N	\N	REQUEST_CREATED	SupportRequest	ae353516-383a-472b-8719-ddc5fe1997ef	{"controlId": "REQ-20260915-0021", "department": "OVPBS", "requestType": "Hardware", "employeeName": "Mark Ian Delgado"}	192.1.0.12	2026-09-15 06:17:31.527
c5114b06-ebd0-4929-b112-0377604bcd03	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-15 06:17:38.585
55c33b2a-9e0b-44f5-969c-3beee0c71439	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_CLAIMED	SupportRequest	ae353516-383a-472b-8719-ddc5fe1997ef	{"claimedBy": "Admin"}	192.1.0.12	2026-09-15 06:17:45.404
1e6f7acd-c5c4-46af-b031-41c676cd2769	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	ae353516-383a-472b-8719-ddc5fe1997ef	{"to": "IN_PROGRESS", "from": "NEW", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-15 06:17:47.031
41a7a9c0-5041-4318-9205-f68bbb5b757e	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	REQUEST_STATUS_UPDATED	SupportRequest	ae353516-383a-472b-8719-ddc5fe1997ef	{"to": "RESOLVED", "from": "IN_PROGRESS", "requestType": "Hardware", "requesterName": "Mark Ian Delgado"}	192.1.0.12	2026-09-15 06:17:56.966
770a05f0-f362-437e-939f-2bd316506b07	\N	\N	\N	REQUEST_FEEDBACK_SUBMITTED	SupportRequest	ae353516-383a-472b-8719-ddc5fe1997ef	{"feedbackLength": 8}	192.1.0.12	2026-09-15 06:18:30.117
40d69e0e-804e-49a0-a071-c44fdceb9651	\N	\N	\N	BOARD_ROOM_BOOKING_CREATED	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"date": "2026-09-22", "startTime": "10:00", "department": "OEVP"}	192.1.0.12	2026-09-15 06:20:11.842
d94f943a-090d-4507-93f0-7f89639b57cf	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"status": "APPROVED"}	192.1.0.12	2026-09-15 06:20:24.78
927f97a7-6db9-4ffc-b425-ff65247b4ae8	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 08:17:37.566
a874920a-affc-4fe0-860d-22220bb02b71	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-15 08:17:49.233
2f25a715-7983-4450-a870-76919ec73e6c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-15 08:18:05.977
e4526eb5-0bdf-4cad-8863-f6a93d5aad0f	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-17 03:56:41.097
a6a58496-3184-4c87-807f-e87c062159f7	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-18 00:56:48.457
0d85cdff-926f-4846-98f1-e2d27dd778f1	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-18 06:16:44.61
0ec0fd79-ef75-4803-ac1f-17f4e3ff2b1c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-18 06:56:20.349
83264999-9719-4334-a7be-7b9695bab589	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-18 06:56:28.565
c5e1a290-d407-4795-8e72-deb206496d9c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-22 06:11:19.756
258c6894-5777-4bbe-937b-84319603f60e	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-22 06:12:00.275
71c312b0-1e5d-43e6-8d6b-c66ad405d795	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-23 05:29:10.433
b797fe39-6188-467d-9687-98cc067873f2	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	admin@fti.gov.ph	USER_LOGIN	User	661c5cb9-df0d-489a-ba61-51ee57980e47	{"role": "ADMIN"}	192.1.0.12	2026-09-23 05:33:46.434
940b1a93-c4a8-4b2e-b886-6f71f24481bb	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-23 05:43:20.718
50ea373c-de7c-4dd9-a812-12cbbb5205ea	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_PENDING	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"status": "PENDING"}	192.1.0.12	2026-09-23 06:50:53.479
734c12d1-f3c6-49f8-a4b5-7262543c7896	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"status": "APPROVED"}	192.1.0.12	2026-09-23 06:50:54.469
c05ebd5a-1da0-4f4b-972f-36296d905bd4	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_PENDING	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"status": "PENDING"}	192.1.0.12	2026-09-23 06:50:55.281
caed3776-d083-43cf-9357-4f43503939f7	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	BOARD_ROOM_BOOKING_APPROVED	BoardRoomBooking	6f313bb4-287e-42cd-8ec5-1fbdd1d11751	{"status": "APPROVED"}	192.1.0.12	2026-09-23 06:50:56.913
68484697-0e9c-4486-aab2-d96955ea7afc	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	192.1.0.12	2026-09-28 23:55:48.455
1417f6dd-57c6-4319-9d2f-b92e4920bb8c	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-29 02:08:28
1281e63a-81f8-4adc-85c4-1f9191abefba	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	superadmin@fti.gov.ph	USER_LOGIN	User	4e93def6-b936-4b3a-9278-c966c0c55272	{"role": "SUPERADMIN"}	127.0.0.1	2026-09-29 02:39:58.01
\.


--
-- Data for Name: board_room_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.board_room_bookings (id, name, department, date, "startTime", attendees, purpose, status, "reviewedById", "reviewedByName", "reviewedAt", "createdAt", "updatedAt", "endTime") FROM stdin;
5a5ad00d-6cc0-4299-98c4-82e70dcd0fdc	User	OVPO	2026-09-17	10:10	6	sdgadfgadfghdfashsdg	APPROVED	\N	Admin	2026-09-15 05:27:35.224	2026-09-15 05:25:18.197	2026-09-15 05:27:35.225	\N
36fa5ee8-6d8a-4689-8dfc-f596203b5255	User122	OTP	2026-09-17	10:00	6	gadfhfadghfgsh	APPROVED	\N	Admin	2026-09-15 05:30:51.12	2026-09-15 05:30:36.857	2026-09-15 05:30:51.121	\N
ac77ec20-f2af-49c7-b5d3-b4ffe4a17914	User45234	OVPBS	2026-09-18	09:00	6	sgsdhsgfhsfh	APPROVED	\N	Admin	2026-09-15 05:32:08.594	2026-09-15 05:31:48.267	2026-09-15 05:32:08.594	\N
6f313bb4-287e-42cd-8ec5-1fbdd1d11751	User122	OEVP	2026-09-22	10:00	5	afsdgadfgadfg	APPROVED	\N	SuperAdmin	2026-09-23 06:50:56.91	2026-09-15 06:20:11.836	2026-09-23 06:50:56.911	\N
\.


--
-- Data for Name: form_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.form_settings (id, title, description, "requestTypes", "updatedAt", units, "requestTypeOptions") FROM stdin;
1	IT Support Request	Tell us what you need help with and our IT team will get back to you.	{Hardware,Software,"Internet / Network","Account / Login","Shared Drive / Folder","Printer / Scanner",Email,"System / Operating System",Security,"File / Data","Mobile / Other Devices","IT Request",Other}	2026-09-04 03:25:47.602	{OTP,OEVP,OVPBS,OVPO,OVPCA,PPSU,SSU,ISRMU,IAU,COA,EEMU,LOGU,SPRU,PMT,LSD,LEU,HRDMU,PMT-NFH}	{"Email": ["Cannot send email", "Cannot receive email", "Email login problem", "Outlook problem"], "Other": [], "Hardware": ["Computer/Laptop not turning on", "Slow computer", "Keyboard not working", "Mouse not working", "Monitor/display problem", "No sound", "Camera not working", "USB port problem", "Overheating, Battery/charger problem", "Hardware replacement"], "Security": ["Suspected malware/virus", "Suspicious activity", "Security software issue", "Unauthorized access"], "Software": ["Application not opening", "Application crashing", "Software installation", "Software update, Software error", "License/activation problem", "System/OS error", "Missing application", "Configuration/setup"], "IT Request": ["New computer/laptop", "New software installation", "New account", "New access/permission", "Printer installation", "Network connection", "Software license request", "Equipment request"], "File / Data": ["Cannot open file", "File deletion/recovery", "File corruption", "Data backup request", "Data recovery", "File transfer problem"], "Account / Login": ["Cannot log in", "Forgot password", "Password reset", "Account locked", "Account disabled", "New account request", "Account access problem", "Username problem", "Multi-factor authentication problem"], "Printer / Scanner": ["Printer not printing", "Printer offline", "Paper jam", "Poor print quality", "Cannot find printer", "Cannot connect to printer", "Printer driver problem", "Scanner not working", "Toner/ink replacement"], "Internet / Network": ["No internet connection", "Slow internet", "Cannot connect to Wi-Fi", "LAN connection problem", "Network disconnection", "Cannot access internal website", "Cannot access shared network", "DNS problem", "VPN connection problem"], "Shared Drive / Folder": ["Folder access", "Shared drive access", "Shared Drive / Disconnected"], "Mobile / Other Devices": ["Mobile phone problem", "Tablet problem", "Mobile email", "Mobile application"], "System / Operating System": ["Windows error", "Windows update problem", "Blue screen", "System freezing", "System restart/shutdown problem", "Login/profile problem", "Driver problem", "System configuration"]}
\.


--
-- Data for Name: support_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_requests (id, "employeeName", department, contact, "requestType", subject, description, status, "createdAt", "updatedAt", "resolvedAt", "requestSubType", "statusUpdatedByName", "statusUpdatedAt", "claimedById", "claimedByName", feedback, "feedbackSubmittedAt", "controlId") FROM stdin;
a8644dc0-09f9-4618-983e-63b0daba6ec5	Mark Ian Delgado	OTP	\N	Hardware	\N	\N	RESOLVED	2026-09-04 06:37:49.199	2026-09-08 02:33:15.096	2026-09-08 02:02:52.451	Computer/Laptop not turning on	SuperAdmin	2026-09-08 02:02:52.451	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260904-0001
dc55bd57-8f57-40c0-920d-7dc758b157d4	Mark Ian Delgado	OVPO	\N	Hardware	\N	\N	RESOLVED	2026-09-04 06:38:23.462	2026-09-08 02:33:18.585	2026-09-08 02:02:50.155	Computer/Laptop not turning on	SuperAdmin	2026-09-08 02:02:50.155	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260904-0002
70db64e6-2281-4ef8-b2bf-c47567465546	Mark Ian Delgado	OTP	\N	Printer / Scanner	\N	\N	RESOLVED	2026-09-15 05:27:02.862	2026-09-15 05:28:31.421	2026-09-15 05:27:46.78	Toner/ink replacement	Admin	2026-09-15 05:27:46.78	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	Fast Reliable	2026-09-15 05:28:31.42	REQ-20260915-0020
de86dd44-9b44-457b-bb1b-bf918f3fd57b	Mark Ian Delgado	ISRMU	\N	Hardware	\N	\N	RESOLVED	2026-09-04 06:43:20.856	2026-09-08 02:33:20.503	2026-09-04 06:46:42.428	Computer/Laptop not turning on	SuperAdmin	2026-09-04 06:46:42.428	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260904-0003
8429f3b4-71c1-45dd-9152-aea6192a6ac7	JUSTINE JEREMY CODERA	ISRMU	\N	Software	\N	\N	RESOLVED	2026-09-04 06:45:10.824	2026-09-08 02:33:22.45	2026-09-04 06:45:41.925	Software update, Software error	SuperAdmin	2026-09-04 06:45:41.925	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260904-0004
9073bdb7-e670-49a7-a1f8-b90c2578eb0c	Mark Ian Delgado	OTP	\N	Other	\N	\N	RESOLVED	2026-09-04 07:28:26.179	2026-09-08 02:33:24.037	2026-09-07 01:07:39.278	Requesting for Email Account	Justine Codera	2026-09-07 01:07:39.278	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260904-0005
d9f5221c-2e88-4fda-bd17-f7fbba618191	Edglor	ISRMU	\N	Software	\N	\N	PENDING	2026-09-07 01:02:09.506	2026-09-08 02:33:25.655	\N	License/activation problem	SuperAdmin	2026-09-07 01:05:19.413	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260907-0006
2544f916-4746-4b8b-ae66-4364268aae73	Raf	ISRMU	\N	Printer / Scanner	\N	\N	RESOLVED	2026-09-07 05:55:08.706	2026-09-08 02:33:30.582	2026-09-07 06:05:25.318	Cannot connect to printer	Admin	2026-09-07 06:05:25.318	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260907-0007
4eef3b34-983d-407b-a896-326e351824da	Mark Ian Delgado	ISRMU	\N	Printer / Scanner	\N	\N	RESOLVED	2026-09-08 02:23:29.319	2026-09-08 02:33:35.995	2026-09-08 02:33:35.994	Printer not printing	Admin	2026-09-08 02:33:35.994	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260908-0008
3f1cec56-11b2-4b9d-afb1-4fecc5f747e7	Mark Ian Delgado	ISRMU	\N	Software	\N	\N	RESOLVED	2026-09-08 02:42:17.232	2026-09-08 02:47:53.571	2026-09-08 02:47:53.569	Application not opening	Admin	2026-09-08 02:47:53.569	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260908-0009
8c71dd2b-dc0c-4524-8e94-61b221bc753e	Mark Ian Delgado	ISRMU	\N	Hardware	\N	\N	RESOLVED	2026-09-08 02:47:34.48	2026-09-08 02:48:40.715	2026-09-08 02:48:40.714	Computer/Laptop not turning on	Admin	2026-09-08 02:48:40.714	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260908-0010
5627ebf1-81a1-46a3-b4bd-32422cb8fde3	Mark Ian Delgado	ISRMU	\N	Internet / Network	\N	\N	RESOLVED	2026-09-08 02:50:34.289	2026-09-08 02:51:02.128	2026-09-08 02:51:02.127	No internet connection	Admin	2026-09-08 02:51:02.126	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260908-0011
037ee104-7337-46d6-a6aa-2a929f850ff2	Mark Ian Delgado	ISRMU	\N	Hardware	\N	\N	RESOLVED	2026-09-09 00:14:22.144	2026-09-09 04:58:50.133	2026-09-09 04:58:50.131	Slow computer	Admin	2026-09-09 04:58:50.131	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260909-0012
67710051-ea4d-4733-865a-a17b358658ce	Mark Ian Delgado	ISRMU	\N	Hardware	\N	\N	RESOLVED	2026-09-09 06:32:24.461	2026-09-09 06:33:07.971	2026-09-09 06:33:07.97	Computer/Laptop not turning on	Admin	2026-09-09 06:33:07.97	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260909-0013
f61910c2-13da-4c14-a3b8-050bd1a8cc51	Mark Ian Delgado	ISRMU	\N	Printer / Scanner	\N	\N	RESOLVED	2026-09-09 06:37:16.619	2026-09-09 06:40:33.478	2026-09-09 06:40:08.648	Printer not printing	Admin	2026-09-09 06:40:08.648	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	It was fast and good	2026-09-09 06:40:33.477	REQ-20260909-0015
46812c90-24bd-42ec-a425-f93a7a92ecc3	bhebhekhousz	ISRMU	\N	Other	\N	\N	RESOLVED	2026-09-09 07:27:36.262	2026-09-10 00:44:19.513	2026-09-10 00:44:19.511	oh nor	Admin	2026-09-10 00:44:19.511	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260909-0016
e8034feb-a4dc-4d0c-af7a-baf78bfc7005	Test User	Main Office	\N	Hardware	Testing	Check control ID	RESOLVED	2026-09-10 00:40:42.34	2026-09-10 00:44:36.473	2026-09-10 00:44:36.473	Desktop	Admin	2026-09-10 00:44:36.473	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260910-0017
cc288d92-e152-4dc6-a6e1-7ef144dad1ac	Mark Ian Delgado	ISRMU	\N	Software	\N	\N	RESOLVED	2026-09-10 00:43:02.439	2026-09-10 00:44:41.216	2026-09-10 00:44:41.216	Application not opening	Admin	2026-09-10 00:44:41.216	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	\N	\N	REQ-20260910-0018
cfebad01-f7c1-49a6-8c57-c8e79c4dcafd	Mark Ian Delgado	ISRMU	\N	Software	\N	\N	RESOLVED	2026-09-10 00:59:32.988	2026-09-10 01:19:48.289	2026-09-10 01:00:37.514	Application crashing	SuperAdmin	2026-09-10 01:00:37.514	4e93def6-b936-4b3a-9278-c966c0c55272	SuperAdmin	IT was fast and great thanks	2026-09-10 01:19:48.285	REQ-20260910-0019
5dfdeed4-fe55-424f-b7bc-8507be89b2e6	Mark Ian Delgado	ISRMU	\N	Printer / Scanner	\N	\N	RESOLVED	2026-09-09 06:34:48.704	2026-09-11 03:04:03.32	2026-09-09 06:36:43.84	Printer not printing	Admin	2026-09-09 06:36:43.84	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	It was Fast and reliable.	2026-09-11 03:04:03.319	REQ-20260909-0014
ae353516-383a-472b-8719-ddc5fe1997ef	Mark Ian Delgado	OVPBS	\N	Hardware	\N	\N	RESOLVED	2026-09-15 06:17:31.519	2026-09-15 06:18:30.111	2026-09-15 06:17:56.961	Computer/Laptop not turning on	Admin	2026-09-15 06:17:56.961	661c5cb9-df0d-489a-ba61-51ee57980e47	Admin	reliable	2026-09-15 06:18:30.11	REQ-20260915-0021
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", role, "createdAt", "updatedAt", name, expertise, "lastLoginAt") FROM stdin;
d3e6f297-6559-42bd-86ad-afc0032f8d6f	jccodera@fti.gov.ph	$2b$12$zmDyiVq8xp/gmmTeFv2Ar.f.E3XtqJsCYEthPaahV82uEhA/9XtaK	ADMIN	2026-09-07 01:06:31.887	2026-09-07 01:06:52.386	Justine Codera	{Hardware,"Account / Login",Email,"File / Data",Other,Software,"Shared Drive / Folder","System / Operating System","Mobile / Other Devices","IT Request",Security,"Printer / Scanner","Internet / Network"}	2026-09-07 01:06:52.386
4e93def6-b936-4b3a-9278-c966c0c55272	superadmin@fti.gov.ph	$2b$12$wceoGh67u58F0z7WqP/jb.L.GvcJDi1uZXw9Yuyal3WjCxdWKsaKW	SUPERADMIN	2026-09-04 01:36:26.587	2026-09-29 02:39:57.997	SuperAdmin	{}	2026-09-29 02:39:57.99
96adba7a-e7f2-46d4-b236-26e4f57e953e	mpdelgado@fti.gov.ph	$2b$12$0AFRe8yh8Wlcp29dpg6ANutJJqxCfudG4o/WqVvqIi.04ZYYLVfjm	ADMIN	2026-09-10 02:15:11.772	2026-09-15 06:04:58.171	Mark Ian Delgado	{Email,"Account / Login","File / Data",Other,Software,"Shared Drive / Folder","System / Operating System","Mobile / Other Devices","Internet / Network","Printer / Scanner",Security,"IT Request"}	2026-09-15 06:04:58.17
661c5cb9-df0d-489a-ba61-51ee57980e47	admin@fti.gov.ph	$2b$12$PZMtfOVvf4qaA16pnnRzguzXSCBJGn/W7xU8/J2nHoZ3M/ve70ahW	ADMIN	2026-09-04 01:36:26.85	2026-09-23 05:33:46.433	Admin	{Email,"Account / Login","File / Data",Other,"Mobile / Other Devices","System / Operating System","Shared Drive / Folder",Software,"Internet / Network","Printer / Scanner",Security,Hardware,"IT Request"}	2026-09-23 05:33:46.432
\.


--
-- Name: support_request_control_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.support_request_control_id_seq', 21, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: board_room_bookings board_room_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_room_bookings
    ADD CONSTRAINT board_room_bookings_pkey PRIMARY KEY (id);


--
-- Name: form_settings form_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_settings
    ADD CONSTRAINT form_settings_pkey PRIMARY KEY (id);


--
-- Name: support_requests support_requests_controlId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT "support_requests_controlId_key" UNIQUE ("controlId");


--
-- Name: support_requests support_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_requests
    ADD CONSTRAINT support_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_action_idx ON public.activity_logs USING btree (action);


--
-- Name: activity_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "activity_logs_createdAt_idx" ON public.activity_logs USING btree ("createdAt");


--
-- Name: board_room_bookings_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX board_room_bookings_date_idx ON public.board_room_bookings USING btree (date);


--
-- Name: board_room_bookings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX board_room_bookings_status_idx ON public.board_room_bookings USING btree (status);


--
-- Name: support_requests_claimedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "support_requests_claimedById_idx" ON public.support_requests USING btree ("claimedById");


--
-- Name: support_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "support_requests_createdAt_idx" ON public.support_requests USING btree ("createdAt");


--
-- Name: support_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_requests_status_idx ON public.support_requests USING btree (status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- PostgreSQL database dump complete
--

\unrestrict jtNefyHuiWLbfdLUxZheuakbchEGWbdfguNGDq0vfKGqSl4qWaZjY7AdQhA6g9L

