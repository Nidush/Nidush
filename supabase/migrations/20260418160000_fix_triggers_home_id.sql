-- Migration: Dynamic Fix for references to old column names in Trigger functions.
-- Because tables were normalized, old trigger functions (like 'assign_activity_home') 
-- are crashing when referencing NEW.home_idhome, etc.

DO $$
DECLARE
    func_rec RECORD;
    new_body TEXT;
BEGIN
    FOR func_rec IN 
        SELECT p.oid, p.proname, p.prosrc 
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prorettype = (SELECT oid FROM pg_type WHERE typname = 'trigger')
    LOOP
        new_body := func_rec.prosrc;
        
        -- Normalization Replacements
        new_body := REPLACE(new_body, 'home_idhome', 'home_id');
        new_body := REPLACE(new_body, 'rooms_idrooms', 'room_id');
        new_body := REPLACE(new_body, 'idrooms', 'id');
        new_body := REPLACE(new_body, 'idhome', 'id');
        new_body := REPLACE(new_body, 'iduser', 'id');
        new_body := REPLACE(new_body, 'idcontent', 'id');
        new_body := REPLACE(new_body, 'idscenario', 'id');
        new_body := REPLACE(new_body, 'scenarioid', 'scenario_id');
        new_body := REPLACE(new_body, 'contentid', 'content_id');

        -- Only update function if we actually changed something
        IF new_body <> func_rec.prosrc THEN
            EXECUTE 'CREATE OR REPLACE FUNCTION public.' || func_rec.proname || '() RETURNS TRIGGER LANGUAGE plpgsql AS $func$' || new_body || '$func$;';
        END IF;
    END LOOP;
END $$;
