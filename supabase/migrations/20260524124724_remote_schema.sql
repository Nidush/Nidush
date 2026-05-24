create extension if not exists "wrappers" with schema "extensions";

drop extension if exists "pg_net";

create schema if not exists "mydb";

create extension if not exists "pg_net" with schema "public";

create sequence "mydb"."active_session_idactive_session_seq";

create sequence "mydb"."activity_idactivity_seq";

create sequence "mydb"."category_idcategory_seq";

create sequence "mydb"."device_iddevice_seq";

create sequence "mydb"."device_type_iddevice_type_seq";

create sequence "mydb"."home_idhome_seq";

create sequence "mydb"."rooms_idrooms_seq";

create sequence "mydb"."routine_idroutine_seq";

create sequence "mydb"."scenario_idscenario_seq";

create sequence "mydb"."shortcut_idshortcut_seq";

create sequence "mydb"."user_iduser_seq";

create sequence "mydb"."user_preferences_iduser_preferences_seq";

create sequence "mydb"."wearable_idwearable_seq";

create sequence "public"."active_session_idactive_session_seq";

create sequence "public"."activity_idactivity_seq";

create sequence "public"."category_idcategory_seq";

create sequence "public"."device_iddevice_seq";

create sequence "public"."device_type_iddevice_type_seq";

create sequence "public"."home_idhome_seq";

create sequence "public"."rooms_idrooms_seq";

create sequence "public"."routine_idroutine_seq";

create sequence "public"."scenario_idscenario_seq";

create sequence "public"."shortcut_idshortcut_seq";

create sequence "public"."user_iduser_seq";

create sequence "public"."user_preferences_iduser_preferences_seq";

create sequence "public"."wearable_idwearable_seq";

drop policy "p_homes_insert" on "public"."homes";

drop policy "p_homes_select" on "public"."homes";

revoke delete on table "public"."categories" from "anon";

revoke insert on table "public"."categories" from "anon";

revoke references on table "public"."categories" from "anon";

revoke select on table "public"."categories" from "anon";

revoke trigger on table "public"."categories" from "anon";

revoke truncate on table "public"."categories" from "anon";

revoke update on table "public"."categories" from "anon";

revoke delete on table "public"."categories" from "authenticated";

revoke insert on table "public"."categories" from "authenticated";

revoke references on table "public"."categories" from "authenticated";

revoke select on table "public"."categories" from "authenticated";

revoke trigger on table "public"."categories" from "authenticated";

revoke truncate on table "public"."categories" from "authenticated";

revoke update on table "public"."categories" from "authenticated";

revoke delete on table "public"."categories" from "service_role";

revoke insert on table "public"."categories" from "service_role";

revoke references on table "public"."categories" from "service_role";

revoke select on table "public"."categories" from "service_role";

revoke trigger on table "public"."categories" from "service_role";

revoke truncate on table "public"."categories" from "service_role";

revoke update on table "public"."categories" from "service_role";

alter table "public"."activities" drop constraint "activities_content_id_fkey";

alter table "public"."activities" drop constraint "activities_home_id_fkey";

alter table "public"."activities" drop constraint "activities_scenario_id_fkey";

alter table "public"."devices" drop constraint "devices_room_id_fkey";

alter table "public"."devices" drop constraint "devices_user_id_fkey";

alter table "public"."homes" drop constraint "homes_join_code_key";

alter table "public"."rooms" drop constraint "rooms_home_id_fkey";

alter table "public"."routines" drop constraint "routines_home_id_fkey";

alter table "public"."routines" drop constraint "routines_scenario_id_fkey";

alter table "public"."scenarios" drop constraint "scenarios_room_id_fkey";

alter table "public"."shortcuts" drop constraint "shortcuts_activity_idactivity_fkey";

alter table "public"."shortcuts" drop constraint "shortcuts_scenario_idscenario_fkey";

alter table "public"."shortcuts" drop constraint "shortcuts_user_id_fkey";

alter table "public"."users" drop constraint "users_auth_uid_key";

alter table "public"."activities" drop constraint "activities_pkey";

alter table "public"."categories" drop constraint "categories_pkey";

alter table "public"."contents" drop constraint "contents_pkey";

alter table "public"."devices" drop constraint "devices_pkey";

alter table "public"."homes" drop constraint "homes_pkey";

alter table "public"."routines" drop constraint "routines_pkey";

alter table "public"."scenarios" drop constraint "scenarios_pkey";

alter table "public"."shortcuts" drop constraint "shortcuts_pkey";

alter table "public"."users" drop constraint "users_pkey";

drop index if exists "public"."activities_pkey";

drop index if exists "public"."categories_pkey";

drop index if exists "public"."contents_pkey";

drop index if exists "public"."devices_pkey";

drop index if exists "public"."homes_join_code_key";

drop index if exists "public"."homes_pkey";

drop index if exists "public"."routines_pkey";

drop index if exists "public"."scenarios_pkey";

drop index if exists "public"."shortcuts_pkey";

drop index if exists "public"."users_auth_uid_key";

drop index if exists "public"."users_pkey";

drop table "public"."categories";


  create table "mydb"."active_session" (
    "idactive_session" integer not null default nextval('mydb.active_session_idactive_session_seq'::regclass),
    "rooms_idrooms" integer not null,
    "activity_idactivity" integer,
    "scenario_idscenario" integer,
    "user_iduser" integer not null,
    "start_time" timestamp without time zone not null
      );



  create table "mydb"."activity" (
    "idactivity" integer not null default nextval('mydb.activity_idactivity_seq'::regclass),
    "name" character varying(45) not null,
    "description" character varying(1000) not null,
    "category_idcategory" integer not null,
    "user_iduser" integer,
    "scenario_idscenario" integer not null,
    "content_idcontent" uuid not null,
    "focus_mode_enabled" boolean not null default false
      );



  create table "mydb"."category" (
    "idcategory" integer not null default nextval('mydb.category_idcategory_seq'::regclass),
    "name" character varying(45) not null
      );



  create table "mydb"."content" (
    "idcontent" uuid not null
      );



  create table "mydb"."device" (
    "iddevice" integer not null default nextval('mydb.device_iddevice_seq'::regclass),
    "name" character varying(45) not null,
    "external_id" character varying(45) not null,
    "rooms_idrooms" integer not null,
    "device_type_iddevice_type" integer not null
      );



  create table "mydb"."device_type" (
    "iddevice_type" integer not null default nextval('mydb.device_type_iddevice_type_seq'::regclass),
    "name" character varying(45) not null,
    "icon_type" character varying(45) not null
      );



  create table "mydb"."home" (
    "idhome" integer not null default nextval('mydb.home_idhome_seq'::regclass),
    "name" character varying(45) not null
      );



  create table "mydb"."rooms" (
    "idrooms" integer not null default nextval('mydb.rooms_idrooms_seq'::regclass),
    "name" character varying(45) not null,
    "home_idhome" integer not null,
    "user_iduser" integer not null,
    "private" boolean not null
      );



  create table "mydb"."routine" (
    "idroutine" integer not null default nextval('mydb.routine_idroutine_seq'::regclass),
    "name" character varying(45) not null,
    "execution_time" time without time zone not null,
    "days_of_week" character varying(45),
    "is_active" boolean not null,
    "scenario_idscenario" integer not null,
    "user_iduser" integer not null
      );



  create table "mydb"."scenario" (
    "idscenario" integer not null default nextval('mydb.scenario_idscenario_seq'::regclass),
    "name" character varying(400) not null,
    "rooms_idrooms" integer not null,
    "user_iduser" integer,
    "playlist_id" character varying(400)
      );



  create table "mydb"."scenario_has_device" (
    "scenario_idscenario" integer not null,
    "device_iddevice" integer not null
      );



  create table "mydb"."shortcut" (
    "idshortcut" integer not null default nextval('mydb.shortcut_idshortcut_seq'::regclass),
    "displayorder" integer not null,
    "user_iduser" integer not null,
    "activity_idactivity" integer,
    "scenario_idscenario" integer
      );



  create table "mydb"."user" (
    "iduser" integer not null default nextval('mydb.user_iduser_seq'::regclass),
    "first_name" character varying(45) not null,
    "last_name" character varying(45) not null,
    "email" character varying(45) not null,
    "home_idhome" integer not null,
    "password" character varying(255) not null
      );



  create table "mydb"."user_preferences" (
    "iduser_preferences" integer not null default nextval('mydb.user_preferences_iduser_preferences_seq'::regclass),
    "user_iduser" integer not null,
    "category_idcategory" integer not null
      );



  create table "mydb"."wearable" (
    "idwearable" integer not null default nextval('mydb.wearable_idwearable_seq'::regclass),
    "model" character varying(45) not null,
    "user_iduser" integer not null
      );



  create table "public"."active_session" (
    "idactive_session" integer not null default nextval('public.active_session_idactive_session_seq'::regclass),
    "rooms_idrooms" integer not null,
    "activity_idactivity" integer,
    "scenario_idscenario" integer,
    "user_iduser" integer not null,
    "start_time" timestamp without time zone not null
      );


alter table "public"."active_session" enable row level security;


  create table "public"."category" (
    "idcategory" integer not null default nextval('public.category_idcategory_seq'::regclass),
    "name" character varying(45) not null
      );


alter table "public"."category" enable row level security;


  create table "public"."device_type" (
    "iddevice_type" integer not null default nextval('public.device_type_iddevice_type_seq'::regclass),
    "name" character varying(45) not null,
    "icon_type" character varying(45) not null
      );


alter table "public"."device_type" enable row level security;


  create table "public"."scenario_has_device" (
    "scenario_idscenario" integer not null,
    "device_iddevice" integer not null
      );


alter table "public"."scenario_has_device" enable row level security;


  create table "public"."user_preferences" (
    "iduser_preferences" integer not null default nextval('public.user_preferences_iduser_preferences_seq'::regclass),
    "category_idcategory" integer not null,
    "user_id" uuid
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."wearables" (
    "id" integer not null default nextval('public.wearable_idwearable_seq'::regclass),
    "model" character varying(45) not null,
    "user_id" uuid
      );


alter table "public"."wearables" enable row level security;

alter table "public"."activities" add column "category_idcategory" integer;

alter table "public"."activities" add column "focus_mode_enable" boolean default false;

alter table "public"."activities" add column "room" character varying;

alter table "public"."activities" alter column "content_id" set not null;

alter table "public"."activities" alter column "content_id" set data type character varying using "content_id"::character varying;

alter table "public"."activities" alter column "description" set not null;

alter table "public"."activities" alter column "description" set data type character varying(1000) using "description"::character varying(1000);

alter table "public"."activities" alter column "focus_mode_enabled" set not null;

alter table "public"."activities" alter column "id" set default nextval('public.activity_idactivity_seq'::regclass);

alter table "public"."activities" alter column "scenario_id" set data type character varying using "scenario_id"::character varying;

alter table "public"."activities" alter column "title" set data type character varying(45) using "title"::character varying(45);

alter table "public"."contents" drop column "created_at";

alter table "public"."devices" add column "device_type_iddevice_type" integer;

alter table "public"."devices" alter column "id" set default nextval('public.device_iddevice_seq'::regclass);

alter table "public"."devices" alter column "source" set default 'network'::text;

alter table "public"."homes" alter column "id" set default nextval('public.home_idhome_seq'::regclass);

alter table "public"."homes" alter column "name" set data type character varying(45) using "name"::character varying(45);

alter table "public"."rooms" add column "private" boolean;

alter table "public"."rooms" add column "user_iduser" integer;

alter table "public"."rooms" alter column "home_id" set not null;

alter table "public"."rooms" alter column "id" set default nextval('public.rooms_idrooms_seq'::regclass);

alter table "public"."rooms" alter column "name" set data type character varying(45) using "name"::character varying(45);

alter table "public"."routines" drop column "created_at";

alter table "public"."routines" drop column "scenario_id";

alter table "public"."routines" add column "scenario_idscenario" integer not null;

alter table "public"."routines" alter column "days_of_week" set data type character varying(45) using "days_of_week"::character varying(45);

alter table "public"."routines" alter column "execution_time" set not null;

alter table "public"."routines" alter column "id" set default nextval('public.routine_idroutine_seq'::regclass);

alter table "public"."routines" alter column "is_active" drop default;

alter table "public"."routines" alter column "is_active" set not null;

alter table "public"."routines" alter column "name" set data type character varying(45) using "name"::character varying(45);

alter table "public"."scenarios" drop column "created_at";

alter table "public"."scenarios" drop column "updated_at";

alter table "public"."scenarios" add column "user_iduser" integer;

alter table "public"."scenarios" alter column "id" set default nextval('public.scenario_idscenario_seq'::regclass);

alter table "public"."scenarios" alter column "name" set data type character varying(400) using "name"::character varying(400);

alter table "public"."scenarios" alter column "playlist_id" set data type character varying(400) using "playlist_id"::character varying(400);

alter table "public"."scenarios" alter column "room_id" set not null;

alter table "public"."shortcuts" alter column "displayorder" drop default;

alter table "public"."shortcuts" alter column "id" set default nextval('public.shortcut_idshortcut_seq'::regclass);

alter table "public"."shortcuts" alter column "id" drop identity;

alter table "public"."users" alter column "email" set not null;

alter table "public"."users" alter column "email" set data type character varying(45) using "email"::character varying(45);

alter table "public"."users" alter column "first_name" set not null;

alter table "public"."users" alter column "first_name" set data type character varying(45) using "first_name"::character varying(45);

alter table "public"."users" alter column "id" set default nextval('public.user_iduser_seq'::regclass);

alter table "public"."users" alter column "last_name" set not null;

alter table "public"."users" alter column "last_name" set data type character varying(45) using "last_name"::character varying(45);

alter sequence "mydb"."active_session_idactive_session_seq" owned by "mydb"."active_session"."idactive_session";

alter sequence "mydb"."activity_idactivity_seq" owned by "mydb"."activity"."idactivity";

alter sequence "mydb"."category_idcategory_seq" owned by "mydb"."category"."idcategory";

alter sequence "mydb"."device_iddevice_seq" owned by "mydb"."device"."iddevice";

alter sequence "mydb"."device_type_iddevice_type_seq" owned by "mydb"."device_type"."iddevice_type";

alter sequence "mydb"."home_idhome_seq" owned by "mydb"."home"."idhome";

alter sequence "mydb"."rooms_idrooms_seq" owned by "mydb"."rooms"."idrooms";

alter sequence "mydb"."routine_idroutine_seq" owned by "mydb"."routine"."idroutine";

alter sequence "mydb"."scenario_idscenario_seq" owned by "mydb"."scenario"."idscenario";

alter sequence "mydb"."shortcut_idshortcut_seq" owned by "mydb"."shortcut"."idshortcut";

alter sequence "mydb"."user_iduser_seq" owned by "mydb"."user"."iduser";

alter sequence "mydb"."user_preferences_iduser_preferences_seq" owned by "mydb"."user_preferences"."iduser_preferences";

alter sequence "mydb"."wearable_idwearable_seq" owned by "mydb"."wearable"."idwearable";

alter sequence "public"."active_session_idactive_session_seq" owned by "public"."active_session"."idactive_session";

alter sequence "public"."activity_idactivity_seq" owned by "public"."activities"."id";

alter sequence "public"."category_idcategory_seq" owned by "public"."category"."idcategory";

alter sequence "public"."device_iddevice_seq" owned by "public"."devices"."id";

alter sequence "public"."device_type_iddevice_type_seq" owned by "public"."device_type"."iddevice_type";

alter sequence "public"."home_idhome_seq" owned by "public"."homes"."id";

alter sequence "public"."rooms_idrooms_seq" owned by "public"."rooms"."id";

alter sequence "public"."routine_idroutine_seq" owned by "public"."routines"."id";

alter sequence "public"."scenario_idscenario_seq" owned by "public"."scenarios"."id";

alter sequence "public"."shortcut_idshortcut_seq" owned by "public"."shortcuts"."id";

alter sequence "public"."user_iduser_seq" owned by "public"."users"."id";

alter sequence "public"."user_preferences_iduser_preferences_seq" owned by "public"."user_preferences"."iduser_preferences";

alter sequence "public"."wearable_idwearable_seq" owned by "public"."wearables"."id";

drop sequence if exists "public"."activities_id_seq";

drop sequence if exists "public"."categories_id_seq";

drop sequence if exists "public"."devices_id_seq";

drop sequence if exists "public"."homes_id_seq";

drop sequence if exists "public"."rooms_id_seq";

drop sequence if exists "public"."routines_id_seq";

drop sequence if exists "public"."scenarios_id_seq";

drop sequence if exists "public"."users_id_seq";

CREATE UNIQUE INDEX active_session_pkey ON mydb.active_session USING btree (idactive_session);

CREATE UNIQUE INDEX active_session_rooms_idrooms_key ON mydb.active_session USING btree (rooms_idrooms);

CREATE UNIQUE INDEX activity_pkey ON mydb.activity USING btree (idactivity);

CREATE UNIQUE INDEX category_pkey ON mydb.category USING btree (idcategory);

CREATE UNIQUE INDEX device_pkey ON mydb.device USING btree (iddevice);

CREATE UNIQUE INDEX device_type_pkey ON mydb.device_type USING btree (iddevice_type);

CREATE UNIQUE INDEX home_pkey ON mydb.home USING btree (idhome);

CREATE UNIQUE INDEX idcontent_pkey ON mydb.content USING btree (idcontent);

CREATE UNIQUE INDEX pk_shortcut ON mydb.shortcut USING btree (idshortcut);

CREATE UNIQUE INDEX rooms_pkey ON mydb.rooms USING btree (idrooms);

CREATE UNIQUE INDEX routine_pkey ON mydb.routine USING btree (idroutine);

CREATE UNIQUE INDEX scenario_has_device_pkey ON mydb.scenario_has_device USING btree (scenario_idscenario, device_iddevice);

CREATE UNIQUE INDEX scenario_pkey ON mydb.scenario USING btree (idscenario);

CREATE UNIQUE INDEX unique_user_activity ON mydb.shortcut USING btree (user_iduser, activity_idactivity);

CREATE UNIQUE INDEX unique_user_scenario ON mydb.shortcut USING btree (user_iduser, scenario_idscenario);

CREATE UNIQUE INDEX user_pkey ON mydb."user" USING btree (iduser);

CREATE UNIQUE INDEX user_preferences_pkey ON mydb.user_preferences USING btree (iduser_preferences, user_iduser, category_idcategory);

CREATE UNIQUE INDEX wearable_pkey ON mydb.wearable USING btree (idwearable);

CREATE UNIQUE INDEX active_session_pkey ON public.active_session USING btree (idactive_session);

CREATE UNIQUE INDEX active_session_rooms_idrooms_key ON public.active_session USING btree (rooms_idrooms);

CREATE INDEX active_session_rooms_idrooms_key_idx ON public.active_session USING btree (rooms_idrooms);

CREATE UNIQUE INDEX activity_pkey ON public.activities USING btree (id);

CREATE UNIQUE INDEX category_pkey ON public.category USING btree (idcategory);

CREATE UNIQUE INDEX content_pkey ON public.contents USING btree (id);

CREATE UNIQUE INDEX device_pkey ON public.devices USING btree (id);

CREATE UNIQUE INDEX device_type_pkey ON public.device_type USING btree (iddevice_type);

CREATE INDEX fk_active_session_activity1_idx ON public.active_session USING btree (activity_idactivity);

CREATE INDEX fk_active_session_scenario1_idx ON public.active_session USING btree (scenario_idscenario);

CREATE INDEX fk_active_session_user1_idx ON public.active_session USING btree (user_iduser);

CREATE INDEX fk_activity_category1_idx ON public.activities USING btree (category_idcategory);

CREATE INDEX fk_activity_scenario1_idx ON public.activities USING btree (scenario_id);

CREATE INDEX fk_device_device_type1_idx ON public.devices USING btree (device_type_iddevice_type);

CREATE INDEX fk_device_rooms1_idx ON public.devices USING btree (room_id);

CREATE INDEX fk_rooms_home1_idx ON public.rooms USING btree (home_id);

CREATE INDEX fk_rooms_user1_idx ON public.rooms USING btree (user_iduser);

CREATE INDEX fk_routine_scenario1_idx ON public.routines USING btree (scenario_idscenario);

CREATE INDEX fk_scenario_has_device_device1_idx ON public.scenario_has_device USING btree (device_iddevice);

CREATE INDEX fk_scenario_has_device_scenario1_idx ON public.scenario_has_device USING btree (scenario_idscenario);

CREATE INDEX fk_scenario_rooms1_idx ON public.scenarios USING btree (room_id);

CREATE INDEX fk_scenario_user1_idx ON public.scenarios USING btree (user_iduser);

CREATE INDEX fk_user_preferences_category1_idx ON public.user_preferences USING btree (category_idcategory);

CREATE UNIQUE INDEX home_join_code_key ON public.homes USING btree (join_code);

CREATE UNIQUE INDEX home_pkey ON public.homes USING btree (id);

CREATE INDEX idx_activities_home_id ON public.activities USING btree (home_id);

CREATE INDEX idx_routines_home_id ON public.routines USING btree (home_id);

CREATE INDEX idx_user_homes_home_id ON public.user_homes USING btree (home_id);

CREATE UNIQUE INDEX pk_shortcut ON public.shortcuts USING btree (id);

CREATE UNIQUE INDEX routine_pkey ON public.routines USING btree (id);

CREATE UNIQUE INDEX scenario_has_device_pkey ON public.scenario_has_device USING btree (scenario_idscenario, device_iddevice);

CREATE UNIQUE INDEX scenario_pkey ON public.scenarios USING btree (id);

CREATE UNIQUE INDEX user_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX users_auth_uid_unique ON public.users USING btree (auth_uid);

CREATE UNIQUE INDEX wearable_pkey ON public.wearables USING btree (id);

alter table "mydb"."active_session" add constraint "active_session_pkey" PRIMARY KEY using index "active_session_pkey";

alter table "mydb"."activity" add constraint "activity_pkey" PRIMARY KEY using index "activity_pkey";

alter table "mydb"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "mydb"."content" add constraint "idcontent_pkey" PRIMARY KEY using index "idcontent_pkey";

alter table "mydb"."device" add constraint "device_pkey" PRIMARY KEY using index "device_pkey";

alter table "mydb"."device_type" add constraint "device_type_pkey" PRIMARY KEY using index "device_type_pkey";

alter table "mydb"."home" add constraint "home_pkey" PRIMARY KEY using index "home_pkey";

alter table "mydb"."rooms" add constraint "rooms_pkey" PRIMARY KEY using index "rooms_pkey";

alter table "mydb"."routine" add constraint "routine_pkey" PRIMARY KEY using index "routine_pkey";

alter table "mydb"."scenario" add constraint "scenario_pkey" PRIMARY KEY using index "scenario_pkey";

alter table "mydb"."scenario_has_device" add constraint "scenario_has_device_pkey" PRIMARY KEY using index "scenario_has_device_pkey";

alter table "mydb"."shortcut" add constraint "pk_shortcut" PRIMARY KEY using index "pk_shortcut";

alter table "mydb"."user" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "mydb"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "mydb"."wearable" add constraint "wearable_pkey" PRIMARY KEY using index "wearable_pkey";

alter table "public"."active_session" add constraint "active_session_pkey" PRIMARY KEY using index "active_session_pkey";

alter table "public"."activities" add constraint "activity_pkey" PRIMARY KEY using index "activity_pkey";

alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."contents" add constraint "content_pkey" PRIMARY KEY using index "content_pkey";

alter table "public"."device_type" add constraint "device_type_pkey" PRIMARY KEY using index "device_type_pkey";

alter table "public"."devices" add constraint "device_pkey" PRIMARY KEY using index "device_pkey";

alter table "public"."homes" add constraint "home_pkey" PRIMARY KEY using index "home_pkey";

alter table "public"."routines" add constraint "routine_pkey" PRIMARY KEY using index "routine_pkey";

alter table "public"."scenario_has_device" add constraint "scenario_has_device_pkey" PRIMARY KEY using index "scenario_has_device_pkey";

alter table "public"."scenarios" add constraint "scenario_pkey" PRIMARY KEY using index "scenario_pkey";

alter table "public"."shortcuts" add constraint "pk_shortcut" PRIMARY KEY using index "pk_shortcut";

alter table "public"."users" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "public"."wearables" add constraint "wearable_pkey" PRIMARY KEY using index "wearable_pkey";

alter table "mydb"."active_session" add constraint "active_session_rooms_idrooms_key" UNIQUE using index "active_session_rooms_idrooms_key";

alter table "mydb"."active_session" add constraint "fk_active_session_activity1" FOREIGN KEY (activity_idactivity) REFERENCES mydb.activity(idactivity) not valid;

alter table "mydb"."active_session" validate constraint "fk_active_session_activity1";

alter table "mydb"."active_session" add constraint "fk_active_session_rooms1" FOREIGN KEY (rooms_idrooms) REFERENCES mydb.rooms(idrooms) not valid;

alter table "mydb"."active_session" validate constraint "fk_active_session_rooms1";

alter table "mydb"."active_session" add constraint "fk_active_session_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES mydb.scenario(idscenario) not valid;

alter table "mydb"."active_session" validate constraint "fk_active_session_scenario1";

alter table "mydb"."active_session" add constraint "fk_active_session_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."active_session" validate constraint "fk_active_session_user1";

alter table "mydb"."activity" add constraint "fk_activity_category1" FOREIGN KEY (category_idcategory) REFERENCES mydb.category(idcategory) not valid;

alter table "mydb"."activity" validate constraint "fk_activity_category1";

alter table "mydb"."activity" add constraint "fk_activity_content" FOREIGN KEY (content_idcontent) REFERENCES mydb.content(idcontent) not valid;

alter table "mydb"."activity" validate constraint "fk_activity_content";

alter table "mydb"."activity" add constraint "fk_activity_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES mydb.scenario(idscenario) not valid;

alter table "mydb"."activity" validate constraint "fk_activity_scenario1";

alter table "mydb"."activity" add constraint "fk_activity_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."activity" validate constraint "fk_activity_user1";

alter table "mydb"."device" add constraint "fk_device_device_type1" FOREIGN KEY (device_type_iddevice_type) REFERENCES mydb.device_type(iddevice_type) not valid;

alter table "mydb"."device" validate constraint "fk_device_device_type1";

alter table "mydb"."device" add constraint "fk_device_rooms1" FOREIGN KEY (rooms_idrooms) REFERENCES mydb.rooms(idrooms) not valid;

alter table "mydb"."device" validate constraint "fk_device_rooms1";

alter table "mydb"."rooms" add constraint "fk_rooms_home1" FOREIGN KEY (home_idhome) REFERENCES mydb.home(idhome) not valid;

alter table "mydb"."rooms" validate constraint "fk_rooms_home1";

alter table "mydb"."rooms" add constraint "fk_rooms_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."rooms" validate constraint "fk_rooms_user1";

alter table "mydb"."routine" add constraint "fk_routine_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES mydb.scenario(idscenario) not valid;

alter table "mydb"."routine" validate constraint "fk_routine_scenario1";

alter table "mydb"."routine" add constraint "fk_routine_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."routine" validate constraint "fk_routine_user1";

alter table "mydb"."scenario" add constraint "fk_scenario_rooms1" FOREIGN KEY (rooms_idrooms) REFERENCES mydb.rooms(idrooms) not valid;

alter table "mydb"."scenario" validate constraint "fk_scenario_rooms1";

alter table "mydb"."scenario" add constraint "fk_scenario_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."scenario" validate constraint "fk_scenario_user1";

alter table "mydb"."scenario_has_device" add constraint "fk_scenario_has_device_device1" FOREIGN KEY (device_iddevice) REFERENCES mydb.device(iddevice) not valid;

alter table "mydb"."scenario_has_device" validate constraint "fk_scenario_has_device_device1";

alter table "mydb"."scenario_has_device" add constraint "fk_scenario_has_device_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES mydb.scenario(idscenario) not valid;

alter table "mydb"."scenario_has_device" validate constraint "fk_scenario_has_device_scenario1";

alter table "mydb"."shortcut" add constraint "fk_shortcut_activity" FOREIGN KEY (activity_idactivity) REFERENCES mydb.activity(idactivity) not valid;

alter table "mydb"."shortcut" validate constraint "fk_shortcut_activity";

alter table "mydb"."shortcut" add constraint "fk_shortcut_scenario" FOREIGN KEY (scenario_idscenario) REFERENCES mydb.scenario(idscenario) not valid;

alter table "mydb"."shortcut" validate constraint "fk_shortcut_scenario";

alter table "mydb"."shortcut" add constraint "fk_shortcut_user" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."shortcut" validate constraint "fk_shortcut_user";

alter table "mydb"."shortcut" add constraint "unique_user_activity" UNIQUE using index "unique_user_activity";

alter table "mydb"."shortcut" add constraint "unique_user_scenario" UNIQUE using index "unique_user_scenario";

alter table "mydb"."user" add constraint "fk_user_home" FOREIGN KEY (home_idhome) REFERENCES mydb.home(idhome) not valid;

alter table "mydb"."user" validate constraint "fk_user_home";

alter table "mydb"."user_preferences" add constraint "fk_user_preferences_category1" FOREIGN KEY (category_idcategory) REFERENCES mydb.category(idcategory) not valid;

alter table "mydb"."user_preferences" validate constraint "fk_user_preferences_category1";

alter table "mydb"."user_preferences" add constraint "fk_user_preferences_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."user_preferences" validate constraint "fk_user_preferences_user1";

alter table "mydb"."wearable" add constraint "fk_wearable_user1" FOREIGN KEY (user_iduser) REFERENCES mydb."user"(iduser) not valid;

alter table "mydb"."wearable" validate constraint "fk_wearable_user1";

alter table "public"."active_session" add constraint "active_session_rooms_idrooms_key" UNIQUE using index "active_session_rooms_idrooms_key";

alter table "public"."active_session" add constraint "fk_active_session_activity1" FOREIGN KEY (activity_idactivity) REFERENCES public.activities(id) not valid;

alter table "public"."active_session" validate constraint "fk_active_session_activity1";

alter table "public"."active_session" add constraint "fk_active_session_rooms1" FOREIGN KEY (rooms_idrooms) REFERENCES public.rooms(id) not valid;

alter table "public"."active_session" validate constraint "fk_active_session_rooms1";

alter table "public"."active_session" add constraint "fk_active_session_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES public.scenarios(id) not valid;

alter table "public"."active_session" validate constraint "fk_active_session_scenario1";

alter table "public"."active_session" add constraint "fk_active_session_user1" FOREIGN KEY (user_iduser) REFERENCES public.users(id) not valid;

alter table "public"."active_session" validate constraint "fk_active_session_user1";

alter table "public"."activities" add constraint "activity_home_idhome_fkey" FOREIGN KEY (home_id) REFERENCES public.homes(id) not valid;

alter table "public"."activities" validate constraint "activity_home_idhome_fkey";

alter table "public"."devices" add constraint "fk_device_device_type1" FOREIGN KEY (device_type_iddevice_type) REFERENCES public.device_type(iddevice_type) not valid;

alter table "public"."devices" validate constraint "fk_device_device_type1";

alter table "public"."devices" add constraint "fk_device_rooms1" FOREIGN KEY (room_id) REFERENCES public.rooms(id) not valid;

alter table "public"."devices" validate constraint "fk_device_rooms1";

alter table "public"."homes" add constraint "home_join_code_key" UNIQUE using index "home_join_code_key";

alter table "public"."rooms" add constraint "fk_rooms_home1" FOREIGN KEY (home_id) REFERENCES public.homes(id) not valid;

alter table "public"."rooms" validate constraint "fk_rooms_home1";

alter table "public"."rooms" add constraint "fk_rooms_user1" FOREIGN KEY (user_iduser) REFERENCES public.users(id) not valid;

alter table "public"."rooms" validate constraint "fk_rooms_user1";

alter table "public"."routines" add constraint "fk_routine_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES public.scenarios(id) not valid;

alter table "public"."routines" validate constraint "fk_routine_scenario1";

alter table "public"."routines" add constraint "routine_home_idhome_fkey" FOREIGN KEY (home_id) REFERENCES public.homes(id) not valid;

alter table "public"."routines" validate constraint "routine_home_idhome_fkey";

alter table "public"."scenario_has_device" add constraint "fk_scenario_has_device_device1" FOREIGN KEY (device_iddevice) REFERENCES public.devices(id) not valid;

alter table "public"."scenario_has_device" validate constraint "fk_scenario_has_device_device1";

alter table "public"."scenario_has_device" add constraint "fk_scenario_has_device_scenario1" FOREIGN KEY (scenario_idscenario) REFERENCES public.scenarios(id) not valid;

alter table "public"."scenario_has_device" validate constraint "fk_scenario_has_device_scenario1";

alter table "public"."scenarios" add constraint "fk_scenario_rooms1" FOREIGN KEY (room_id) REFERENCES public.rooms(id) not valid;

alter table "public"."scenarios" validate constraint "fk_scenario_rooms1";

alter table "public"."scenarios" add constraint "fk_scenario_user1" FOREIGN KEY (user_iduser) REFERENCES public.users(id) not valid;

alter table "public"."scenarios" validate constraint "fk_scenario_user1";

alter table "public"."shortcuts" add constraint "fk_shortcut_activity" FOREIGN KEY (activity_idactivity) REFERENCES public.activities(id) not valid;

alter table "public"."shortcuts" validate constraint "fk_shortcut_activity";

alter table "public"."shortcuts" add constraint "fk_shortcut_scenario" FOREIGN KEY (scenario_idscenario) REFERENCES public.scenarios(id) not valid;

alter table "public"."shortcuts" validate constraint "fk_shortcut_scenario";

alter table "public"."user_preferences" add constraint "fk_user_preferences_category1" FOREIGN KEY (category_idcategory) REFERENCES public.category(idcategory) not valid;

alter table "public"."user_preferences" validate constraint "fk_user_preferences_category1";

alter table "public"."users" add constraint "users_auth_uid_unique" UNIQUE using index "users_auth_uid_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fill_home_idhome_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.home_id IS NULL THEN
        NEW.home_id := public.get_auth_home_id();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fill_home_idhome_shared()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.home_id IS NULL THEN
        NEW.home_id := public.get_auth_home_id();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fill_metadata_shared()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.home_id IS NULL THEN NEW.home_id := public.get_auth_home_id(); END IF;
    IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_home_id()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT home_id FROM public.user_homes WHERE user_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_internal_id()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT iduser FROM public.users WHERE auth_uid::text = auth.uid()::text LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_auth_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE auth_uid::text = auth.uid()::text LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_local_user_id()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT iduser FROM public."user" WHERE (
    auth_uid IS NOT NULL AND auth_uid = auth.uid()::text
  )
  OR (
    (auth.jwt() ->> 'email') IS NOT NULL AND email = (auth.jwt() ->> 'email')
  )
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_homes()
 RETURNS TABLE(h_id integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT home_id FROM public.user_homes WHERE user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_of(h_id integer)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_homes 
    WHERE user_id = auth.uid() AND home_id = h_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_homes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Deletar casas que não têm nenhum usuário associado E não têm dependências
  DELETE FROM public.homes
  WHERE id NOT IN (
    SELECT DISTINCT home_id FROM public.user_homes
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.rooms WHERE home_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.activities WHERE home_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.routines WHERE home_id IS NOT NULL
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log do resultado
  RAISE NOTICE 'Deleted % orphan homes from public.homes', deleted_count;

  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Deletar usuário da tabela public.users
  DELETE FROM public.users WHERE auth_uid = OLD.id;

  -- Limpar casas órfãs (casas sem nenhum usuário associado E sem dependências)
  DELETE FROM public.homes
  WHERE id NOT IN (
    SELECT DISTINCT home_id FROM public.user_homes
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.rooms WHERE home_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.activities WHERE home_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT home_id FROM public.routines WHERE home_id IS NOT NULL
  );

  RETURN OLD;
END;
$function$
;

grant delete on table "public"."active_session" to "anon";

grant insert on table "public"."active_session" to "anon";

grant references on table "public"."active_session" to "anon";

grant select on table "public"."active_session" to "anon";

grant trigger on table "public"."active_session" to "anon";

grant truncate on table "public"."active_session" to "anon";

grant update on table "public"."active_session" to "anon";

grant delete on table "public"."active_session" to "authenticated";

grant insert on table "public"."active_session" to "authenticated";

grant references on table "public"."active_session" to "authenticated";

grant select on table "public"."active_session" to "authenticated";

grant trigger on table "public"."active_session" to "authenticated";

grant truncate on table "public"."active_session" to "authenticated";

grant update on table "public"."active_session" to "authenticated";

grant delete on table "public"."active_session" to "service_role";

grant insert on table "public"."active_session" to "service_role";

grant references on table "public"."active_session" to "service_role";

grant select on table "public"."active_session" to "service_role";

grant trigger on table "public"."active_session" to "service_role";

grant truncate on table "public"."active_session" to "service_role";

grant update on table "public"."active_session" to "service_role";

grant delete on table "public"."category" to "anon";

grant insert on table "public"."category" to "anon";

grant references on table "public"."category" to "anon";

grant select on table "public"."category" to "anon";

grant trigger on table "public"."category" to "anon";

grant truncate on table "public"."category" to "anon";

grant update on table "public"."category" to "anon";

grant delete on table "public"."category" to "authenticated";

grant insert on table "public"."category" to "authenticated";

grant references on table "public"."category" to "authenticated";

grant select on table "public"."category" to "authenticated";

grant trigger on table "public"."category" to "authenticated";

grant truncate on table "public"."category" to "authenticated";

grant update on table "public"."category" to "authenticated";

grant delete on table "public"."category" to "service_role";

grant insert on table "public"."category" to "service_role";

grant references on table "public"."category" to "service_role";

grant select on table "public"."category" to "service_role";

grant trigger on table "public"."category" to "service_role";

grant truncate on table "public"."category" to "service_role";

grant update on table "public"."category" to "service_role";

grant delete on table "public"."device_type" to "anon";

grant insert on table "public"."device_type" to "anon";

grant references on table "public"."device_type" to "anon";

grant select on table "public"."device_type" to "anon";

grant trigger on table "public"."device_type" to "anon";

grant truncate on table "public"."device_type" to "anon";

grant update on table "public"."device_type" to "anon";

grant delete on table "public"."device_type" to "authenticated";

grant insert on table "public"."device_type" to "authenticated";

grant references on table "public"."device_type" to "authenticated";

grant select on table "public"."device_type" to "authenticated";

grant trigger on table "public"."device_type" to "authenticated";

grant truncate on table "public"."device_type" to "authenticated";

grant update on table "public"."device_type" to "authenticated";

grant delete on table "public"."device_type" to "service_role";

grant insert on table "public"."device_type" to "service_role";

grant references on table "public"."device_type" to "service_role";

grant select on table "public"."device_type" to "service_role";

grant trigger on table "public"."device_type" to "service_role";

grant truncate on table "public"."device_type" to "service_role";

grant update on table "public"."device_type" to "service_role";

grant delete on table "public"."scenario_has_device" to "anon";

grant insert on table "public"."scenario_has_device" to "anon";

grant references on table "public"."scenario_has_device" to "anon";

grant select on table "public"."scenario_has_device" to "anon";

grant trigger on table "public"."scenario_has_device" to "anon";

grant truncate on table "public"."scenario_has_device" to "anon";

grant update on table "public"."scenario_has_device" to "anon";

grant delete on table "public"."scenario_has_device" to "authenticated";

grant insert on table "public"."scenario_has_device" to "authenticated";

grant references on table "public"."scenario_has_device" to "authenticated";

grant select on table "public"."scenario_has_device" to "authenticated";

grant trigger on table "public"."scenario_has_device" to "authenticated";

grant truncate on table "public"."scenario_has_device" to "authenticated";

grant update on table "public"."scenario_has_device" to "authenticated";

grant delete on table "public"."scenario_has_device" to "service_role";

grant insert on table "public"."scenario_has_device" to "service_role";

grant references on table "public"."scenario_has_device" to "service_role";

grant select on table "public"."scenario_has_device" to "service_role";

grant trigger on table "public"."scenario_has_device" to "service_role";

grant truncate on table "public"."scenario_has_device" to "service_role";

grant update on table "public"."scenario_has_device" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."wearables" to "anon";

grant insert on table "public"."wearables" to "anon";

grant references on table "public"."wearables" to "anon";

grant select on table "public"."wearables" to "anon";

grant trigger on table "public"."wearables" to "anon";

grant truncate on table "public"."wearables" to "anon";

grant update on table "public"."wearables" to "anon";

grant delete on table "public"."wearables" to "authenticated";

grant insert on table "public"."wearables" to "authenticated";

grant references on table "public"."wearables" to "authenticated";

grant select on table "public"."wearables" to "authenticated";

grant trigger on table "public"."wearables" to "authenticated";

grant truncate on table "public"."wearables" to "authenticated";

grant update on table "public"."wearables" to "authenticated";

grant delete on table "public"."wearables" to "service_role";

grant insert on table "public"."wearables" to "service_role";

grant references on table "public"."wearables" to "service_role";

grant select on table "public"."wearables" to "service_role";

grant trigger on table "public"."wearables" to "service_role";

grant truncate on table "public"."wearables" to "service_role";

grant update on table "public"."wearables" to "service_role";


  create policy "policy_activities_all"
  on "public"."activities"
  as permissive
  for all
  to authenticated
using (((user_id = auth.uid()) OR public.is_member_of(home_id)));



  create policy "policy_activities_select"
  on "public"."activities"
  as permissive
  for select
  to authenticated
using ((home_id IN ( SELECT get_my_homes.h_id
   FROM public.get_my_homes() get_my_homes(h_id))));



  create policy "homes_free_insert"
  on "public"."homes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "homes_free_select"
  on "public"."homes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "policy_routines_select"
  on "public"."routines"
  as permissive
  for select
  to authenticated
using (public.is_member_of(home_id));



  create policy "uh_free_insert"
  on "public"."user_homes"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "uh_free_select"
  on "public"."user_homes"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "policy_user_prefs_me"
  on "public"."user_preferences"
  as permissive
  for all
  to authenticated
using ((user_id = auth.uid()));



  create policy "users_free_select"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (true);



  create policy "users_free_update"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth_uid = auth.uid()))
with check ((auth_uid = auth.uid()));


CREATE TRIGGER tr_fill_activity_home BEFORE INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.fill_home_idhome_shared();

CREATE TRIGGER tr_fill_activity_meta BEFORE INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.fill_metadata_shared();

CREATE TRIGGER tr_fill_routine_home BEFORE INSERT ON public.routines FOR EACH ROW EXECUTE FUNCTION public.fill_home_idhome_shared();

CREATE TRIGGER tr_fill_routine_meta BEFORE INSERT ON public.routines FOR EACH ROW EXECUTE FUNCTION public.fill_metadata_shared();


  create policy "Allow Insert for Anon Users"
  on "storage"."objects"
  as permissive
  for insert
  to anon
with check ((bucket_id = 'activities'::text));



  create policy "Allow Insert for Authenticated Users"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'activities'::text));



  create policy "Public Read Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'activities'::text));



  create policy "Upload Avatar Images for Anon Users"
  on "storage"."objects"
  as permissive
  for insert
  to anon
with check ((bucket_id = 'avatars'::text));



  create policy "Upload Avatar Images for Auth Users"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "View Avatar Images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



