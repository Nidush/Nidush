-- Move app-provided activities and scenarios out of bundled constants.
-- User-created activities remain in public.activities.

CREATE TABLE IF NOT EXISTS public.activity_templates (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  room text,
  image text,
  category text,
  type text,
  content_id text,
  scenario_id text,
  shortcuts boolean NOT NULL DEFAULT false,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scenario_templates (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  room text,
  image text,
  category text,
  playlist text,
  playlist_id text,
  focus_mode boolean NOT NULL DEFAULT false,
  shortcuts boolean NOT NULL DEFAULT false,
  devices jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_updated_at ON public.activity_templates;
CREATE TRIGGER tr_updated_at
BEFORE UPDATE ON public.activity_templates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at ON public.scenario_templates;
CREATE TRIGGER tr_updated_at
BEFORE UPDATE ON public.scenario_templates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_activity_templates_select" ON public.activity_templates;
CREATE POLICY "p_activity_templates_select"
ON public.activity_templates
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "p_scenario_templates_select" ON public.scenario_templates;
CREATE POLICY "p_scenario_templates_select"
ON public.scenario_templates
FOR SELECT
TO authenticated
USING (true);

WITH seed AS (
  SELECT *
  FROM jsonb_to_recordset($activities$[
  {
    "id": "1",
    "title": "Italian Night",
    "description": "A cozy cooking session with italian vibes.",
    "room": "Kitchen",
    "image": "cooking_activities/my_creations_cooking/italian_night.png",
    "category": "My creations",
    "type": "cooking",
    "content_id": "c1",
    "scenario_id": "s4",
    "shortcuts": false,
    "keywords": [
      "evening",
      "dinner",
      "romantic",
      "italian",
      "pasta",
      "wine",
      "cozy",
      "relaxed"
    ],
    "sort_order": 1
  },
  {
    "id": "2",
    "title": "Sunrise Flow",
    "description": "Start your day with energy.",
    "room": "Living Room",
    "image": "activities_for_you/sunrise_flow.png",
    "category": "My creations",
    "type": "meditation",
    "content_id": "c9",
    "scenario_id": "s1",
    "shortcuts": false,
    "keywords": [
      "morning",
      "energy",
      "meditation",
      "sunrise",
      "flow",
      "stressed",
      "stress"
    ],
    "sort_order": 2
  },
  {
    "id": "3",
    "title": "Gratitude Flow",
    "description": "With a gentle voice guiding you, focus for 8 minutes on 3 to 5 things you are grateful for that morning.",
    "room": "Bedroom",
    "image": "meditation_activities/my_creations/gratitude_flow.png",
    "category": "My creations",
    "type": "meditation",
    "content_id": "c2",
    "scenario_id": "s5",
    "shortcuts": false,
    "keywords": [
      "morning",
      "gratitude",
      "zen",
      "start",
      "meditation",
      "flow",
      "relaxed"
    ],
    "sort_order": 3
  },
  {
    "id": "4",
    "title": "Brownies",
    "description": "Easy homemade brownies that are fudgy and delicious.",
    "room": "Kitchen",
    "image": "cooking_activities/recommended/brownies.png",
    "category": null,
    "type": "cooking",
    "content_id": "c3",
    "scenario_id": "s3",
    "shortcuts": false,
    "keywords": [
      "chocolate",
      "dessert",
      "snack",
      "baking",
      "afternoon",
      "evening",
      "focus",
      "relaxed"
    ],
    "sort_order": 4
  },
  {
    "id": "5",
    "title": "Morning Zen",
    "description": "Quick meditation session.",
    "room": "Living Room",
    "image": "meditation_content/video_sessions/morning_zen.png",
    "category": null,
    "type": "meditation",
    "content_id": "c2",
    "scenario_id": "s5",
    "shortcuts": false,
    "keywords": [
      "morning",
      "zen",
      "meditation",
      "start",
      "energy",
      "quick",
      "relaxed",
      "stressed"
    ],
    "sort_order": 5
  },
  {
    "id": "6",
    "title": "Eggs Benedict",
    "description": "Master the art of the perfect brunch. Crispy muffins, tender poached eggs, and rich Hollandaise sauce.",
    "room": "Kitchen",
    "image": "cooking_activities/recommended/eggs_benedict.png",
    "category": null,
    "type": "cooking",
    "content_id": "c10",
    "scenario_id": "s4",
    "shortcuts": false,
    "keywords": [
      "morning",
      "breakfast",
      "brunch",
      "weekend",
      "fast",
      "simple",
      "easy",
      "relaxed"
    ],
    "sort_order": 6
  },
  {
    "id": "7",
    "title": "Vodka Pasta",
    "description": "A rich and creamy tomato sauce infused with a splash of vodka. This trendy dish is perfect for a cozy dinner or impressing guests.",
    "room": "Kitchen",
    "image": "cooking_activities/simple_recipes/vodka_pasta.png",
    "category": "Simple recipes",
    "type": "cooking",
    "content_id": "c14",
    "scenario_id": null,
    "shortcuts": false,
    "keywords": [
      "evening",
      "dinner",
      "pasta",
      "comfort",
      "party",
      "cooking",
      "relaxed"
    ],
    "sort_order": 7
  },
  {
    "id": "8",
    "title": "Evening Read",
    "description": "Unwind after a long day with an engaging audiobook summary. The perfect way to calm your mind and disconnect from screens before sleep.",
    "room": "Bedroom",
    "image": "activities_for_you/evening_read.png",
    "category": null,
    "type": "audiobooks",
    "content_id": "c8",
    "scenario_id": "s2",
    "shortcuts": false,
    "keywords": [
      "evening",
      "night",
      "reading",
      "relax",
      "sleep",
      "calm",
      "focus",
      "productivity",
      "reading"
    ],
    "sort_order": 8
  },
  {
    "id": "9",
    "title": "Chocolate Cake",
    "description": "Indulge your sweet tooth with this rich, moist, and decadent chocolate cake. The ultimate treat for a cheat day or a special celebration.",
    "room": "Kitchen",
    "image": "cooking_activities/simple_recipes/chocolate_cake.png",
    "category": "Simple recipes",
    "type": "cooking",
    "content_id": "c13",
    "scenario_id": null,
    "shortcuts": false,
    "keywords": [
      "dessert",
      "chocolate",
      "baking",
      "sweet",
      "evening",
      "afternoon",
      "relaxed",
      "cooking",
      "soft"
    ],
    "sort_order": 9
  },
  {
    "id": "10",
    "title": "Pasta Primo",
    "description": "A simple yet delicious pasta dish that comes together in under 20 minutes. Perfect for a quick lunch or a hassle-free weeknight dinner.",
    "room": "Kitchen",
    "image": "cooking_activities/simple_recipes/pasta.png",
    "category": "Simple recipes",
    "type": "cooking",
    "content_id": "c12",
    "scenario_id": null,
    "shortcuts": false,
    "keywords": [
      "lunch",
      "dinner",
      "quick",
      "easy",
      "pasta",
      "afternoon",
      "evening",
      "cooking",
      "simple",
      "relaxed",
      "focus"
    ],
    "sort_order": 10
  },
  {
    "id": "11",
    "title": "Stretching",
    "description": "Release tension and improve flexibility with this gentle full-body routine. Perfect for waking up your muscles in the morning or winding down before sleep.",
    "room": "Bedroom",
    "image": "activities_for_you/stretching.png",
    "category": "My creations",
    "type": "workout",
    "content_id": "c11",
    "scenario_id": "s6",
    "shortcuts": false,
    "keywords": [
      "morning",
      "evening",
      "stretch",
      "relax",
      "recovery",
      "flexibility",
      "sleep",
      "stress",
      "stressed",
      "anxious",
      "anxiety"
    ],
    "sort_order": 11
  },
  {
    "id": "15",
    "title": "Visualization for Success",
    "description": "Boost your confidence and clarity by mentally rehearsing your goals. A powerful technique used by athletes and leaders to prime the brain for achievement.",
    "room": "Bedroom",
    "image": "meditation_activities/recommended/visualization_for_success.png",
    "category": "Meditation",
    "type": "meditation",
    "content_id": "c15",
    "scenario_id": "s2",
    "shortcuts": false,
    "keywords": [
      "focus",
      "work",
      "success",
      "confidence",
      "morning",
      "goals",
      "mindset",
      "productivity",
      "anxious",
      "stress",
      "recovery"
    ],
    "sort_order": 12
  },
  {
    "id": "16",
    "title": "Cooking Time",
    "description": "Transform your kitchen into a culinary studio. Engage your senses, focus on the flavors, and create something delicious from scratch.",
    "room": "Kitchen",
    "image": "shortcuts/cooking_time.png",
    "category": "My creations",
    "type": "cooking",
    "content_id": "c16",
    "scenario_id": "s12",
    "shortcuts": true,
    "keywords": [
      "cooking",
      "kitchen",
      "food",
      "relax",
      "creative",
      "dinner",
      "evening",
      "fun",
      "focus",
      "stressed"
    ],
    "sort_order": 13
  },
  {
    "id": "17",
    "title": "Meditation Time",
    "description": "Dedicate time to stillness. Disconnect from external noise and reconnect with your inner peace through guided breathwork and a calming atmosphere.",
    "room": "Bedroom",
    "image": "shortcuts/meditation_time.png",
    "category": "Meditation",
    "type": "meditation",
    "content_id": "c17",
    "scenario_id": "s13",
    "shortcuts": true,
    "keywords": [
      "meditation",
      "zen",
      "calm",
      "relax",
      "breathing",
      "anxious",
      "stressed",
      "morning",
      "evening",
      "recovery"
    ],
    "sort_order": 14
  }
]$activities$::jsonb) AS x(
    id text,
    title text,
    description text,
    room text,
    image text,
    category text,
    type text,
    content_id text,
    scenario_id text,
    shortcuts boolean,
    keywords jsonb,
    sort_order integer
  )
)
INSERT INTO public.activity_templates (
  id,
  title,
  description,
  room,
  image,
  category,
  type,
  content_id,
  scenario_id,
  shortcuts,
  keywords,
  sort_order
)
SELECT
  seed.id,
  seed.title,
  seed.description,
  seed.room,
  seed.image,
  seed.category,
  seed.type,
  seed.content_id,
  seed.scenario_id,
  seed.shortcuts,
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(seed.keywords)), '{}'),
  seed.sort_order
FROM seed
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  room = EXCLUDED.room,
  image = EXCLUDED.image,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  content_id = EXCLUDED.content_id,
  scenario_id = EXCLUDED.scenario_id,
  shortcuts = EXCLUDED.shortcuts,
  keywords = EXCLUDED.keywords,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

WITH seed AS (
  SELECT *
  FROM jsonb_to_recordset($scenarios$[
  {
    "id": "s1",
    "title": "Desert Heat",
    "description": "Experience the soothing warmth of a desert sunset. Amber lights and a comfortable temperature create the perfect cozy atmosphere for relaxing or focused work.",
    "room": "Living Room",
    "image": "Scenarios/desert_heat.png",
    "category": "My creations",
    "playlist": "Lo-Fi Beats",
    "playlist_id": "37i9dQZF1DWWQRvui9Df7X",
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_living",
        "state": "on",
        "value": "#FF8C00",
        "brightness": "80%"
      },
      {
        "deviceId": "dev_speaker_living",
        "state": "on",
        "value": "Lo-Fi Beats"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 24
      }
    ],
    "keywords": [
      "evening",
      "afternoon",
      "warm",
      "cozy",
      "sunset",
      "focus",
      "lo-fi",
      "relaxed",
      "heat"
    ],
    "sort_order": 1
  },
  {
    "id": "s2",
    "title": "Deep Focus",
    "description": "Eliminate distractions with crisp, cool lighting and a silent environment. Ideal for deep work, studying, or reading without interruptions.",
    "room": "Bedroom",
    "image": "Scenarios/deep_focus.png",
    "category": "My creations",
    "playlist": "Focus Playlist",
    "playlist_id": "37i9dQZF1DWZEkaY9Z2dbR",
    "focus_mode": true,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#E0F7FA",
        "brightness": "100%"
      },
      {
        "deviceId": "dev_purifier_bed",
        "state": "on",
        "value": "Silent"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on",
        "value": "Focus Playlist"
      }
    ],
    "keywords": [
      "focus",
      "work",
      "study",
      "productivity",
      "afternoon",
      "reading",
      "office",
      "quiet",
      "focused"
    ],
    "sort_order": 2
  },
  {
    "id": "s3",
    "title": "Forest Bathing",
    "description": "Bring the outdoors in. Soft green lighting, the fresh scent of pine, and immersive nature sounds create a peaceful forest sanctuary to ground your energy.",
    "room": "Bedroom",
    "image": "Scenarios/forest_bathing.png",
    "category": null,
    "playlist": "Spotify Nature Sounds",
    "playlist_id": "37i9dQZF1DWZ0XmS6AnY9s",
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#90EE90",
        "brightness": "50%"
      },
      {
        "deviceId": "dev_diffuser_bed",
        "state": "on",
        "value": "Pine"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on"
      }
    ],
    "keywords": [
      "nature",
      "zen",
      "green",
      "relax",
      "calm",
      "morning",
      "afternoon",
      "relaxed"
    ],
    "sort_order": 3
  },
  {
    "id": "s4",
    "title": "Slow Cooking",
    "description": "Perfect lighting for culinary precision. Bright, clear white light ensures safety while chopping ingredients, accompanied by an upbeat playlist to keep the energy high.",
    "room": "Kitchen",
    "image": "Scenarios/slow_cooking.png",
    "category": null,
    "playlist": "Cooking Vibes",
    "playlist_id": null,
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_kitchen",
        "state": "on",
        "value": "#FFFFFF",
        "brightness": "100%"
      },
      {
        "deviceId": "dev_speaker_kitchen",
        "state": "on",
        "value": "Cooking Vibes"
      }
    ],
    "keywords": [
      "cooking",
      "dinner",
      "lunch",
      "food",
      "kitchen",
      "evening",
      "afternoon",
      "focused",
      "slow"
    ],
    "sort_order": 4
  },
  {
    "id": "s5",
    "title": "Moonlight Bay",
    "description": "Drift off to sleep with deep blue lighting and the rhythmic sound of ocean waves. Enriched with the calming scent of lavender to ensure a restful night.",
    "room": "Bedroom",
    "image": "Scenarios/moonlight_bay.png",
    "category": null,
    "playlist": "Calm Ocean Waves",
    "playlist_id": null,
    "focus_mode": true,
    "shortcuts": true,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#191970",
        "brightness": "30%"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on"
      },
      {
        "deviceId": "dev_diffuser_bed",
        "state": "on",
        "value": "Lavender"
      },
      {
        "deviceId": "dev_purifier_bed",
        "state": "on",
        "value": "Auto"
      }
    ],
    "keywords": [
      "night",
      "sleep",
      "relax",
      "ocean",
      "calm",
      "bed",
      "lavender",
      "sleepy",
      "stress",
      "anxiety"
    ],
    "sort_order": 5
  },
  {
    "id": "s6",
    "title": "Lavender Dream",
    "description": "A sanctuary of soft violet light and the soothing scent of lavender. Ideal for a calming start to the day or winding down before deep sleep.",
    "room": "Bedroom",
    "image": "Scenarios/lavender_dream.png",
    "category": null,
    "playlist": "Calm Piano & Ambient",
    "playlist_id": null,
    "focus_mode": true,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#B39DDB",
        "brightness": "40%"
      },
      {
        "deviceId": "dev_diffuser_bed",
        "state": "on",
        "value": "Lavender"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on",
        "value": "Calm Piano & Ambient"
      },
      {
        "deviceId": "dev_purifier_bed",
        "state": "on",
        "value": "Silent"
      }
    ],
    "keywords": [
      "evening",
      "night",
      "sleep",
      "relax",
      "calm",
      "meditation",
      "zen",
      "stress"
    ],
    "sort_order": 6
  },
  {
    "id": "s7",
    "title": "Dinner Date",
    "description": "Create an unforgettable evening with intimate, golden lighting and the sophisticated sounds of smooth jazz. The perfect backdrop for a romantic dinner.",
    "room": "Kitchen",
    "image": "Scenarios/dinner_date.png",
    "category": "My creations",
    "playlist": "Smooth Jazz Essentials",
    "playlist_id": "37i9dQZF1DX4wH9On9uOAs",
    "focus_mode": true,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_kitchen",
        "state": "on",
        "value": "#FFD700",
        "brightness": "50%"
      },
      {
        "deviceId": "dev_speaker_kitchen",
        "state": "on",
        "value": "Smooth Jazz Essentials"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 22
      }
    ],
    "keywords": [
      "evening",
      "dinner",
      "romantic",
      "date",
      "jazz",
      "night",
      "love",
      "relaxed",
      "simple"
    ],
    "sort_order": 7
  },
  {
    "id": "s8",
    "title": "Rose Garden",
    "description": "Transform your living room into a blooming sanctuary. Soft pink lighting paired with the scent of fresh roses creates a gentle, botanical escape.",
    "room": "Living Room",
    "image": "Scenarios/rose_garden.png",
    "category": "My creations",
    "playlist": "Secret Garden Ambience",
    "playlist_id": null,
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_living",
        "state": "on",
        "value": "#FFB6C1",
        "brightness": "65%"
      },
      {
        "deviceId": "dev_speaker_living",
        "state": "on",
        "value": "Secret Garden Ambience"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 23
      },
      {
        "deviceId": "dev_diffuser_living",
        "state": "on",
        "value": "Rose & Peony"
      }
    ],
    "keywords": [
      "nature",
      "relax",
      "afternoon",
      "morning",
      "floral",
      "calm",
      "spring",
      "anxiety"
    ],
    "sort_order": 8
  },
  {
    "id": "s9",
    "title": "Rainy Library",
    "description": "Escape into a good story. Warm amber lighting, the grounding scent of sandalwood, and steady rain sounds create the ultimate cozy reading nook.",
    "room": "Bedroom",
    "image": "Scenarios/rainy_library.png",
    "category": null,
    "playlist": "Heavy Rain & Lo-Fi",
    "playlist_id": null,
    "focus_mode": true,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#FFC107",
        "brightness": "55%"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on",
        "value": "Heavy Rain & Lo-Fi"
      },
      {
        "deviceId": "dev_diffuser_bed",
        "state": "on",
        "value": "Sandalwood"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 24
      }
    ],
    "keywords": [
      "reading",
      "cozy",
      "rain",
      "focus",
      "study",
      "evening",
      "afternoon",
      "book",
      "focused",
      "focus"
    ],
    "sort_order": 9
  },
  {
    "id": "s10",
    "title": "Cinema Night",
    "description": "Transform your living room into a private theater. Dimmed dark blue lighting and a cozy temperature create the ultimate movie-watching experience.",
    "room": "Living Room",
    "image": "Scenarios/cinema_night.png",
    "category": null,
    "playlist": "Epic Movie Scores",
    "playlist_id": null,
    "focus_mode": true,
    "shortcuts": true,
    "devices": [
      {
        "deviceId": "dev_light_living",
        "state": "on",
        "value": "#1A1A50",
        "brightness": "15%"
      },
      {
        "deviceId": "dev_speaker_living",
        "state": "on",
        "value": "Epic Movie Scores"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 23
      }
    ],
    "keywords": [
      "movie",
      "night",
      "evening",
      "entertainment",
      "relax",
      "cinema",
      "dark",
      "cozy",
      "fun"
    ],
    "sort_order": 10
  },
  {
    "id": "s11",
    "title": "Morning Brew",
    "description": "Start your day with the aroma of fresh coffee. Warm, gentle lighting and soft acoustic tunes create the perfect wake-up routine.",
    "room": "Kitchen",
    "image": "Scenarios/morning_brew.png",
    "category": null,
    "playlist": "Coffee Shop Acoustic",
    "playlist_id": "37i9dQZF1DX6ziVCXmYhuz",
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_kitchen",
        "state": "on",
        "value": "#FFE4B5",
        "brightness": "75%"
      },
      {
        "deviceId": "dev_speaker_kitchen",
        "state": "on",
        "value": "Coffee Shop Acoustic"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 21
      }
    ],
    "keywords": [
      "morning",
      "coffee",
      "breakfast",
      "kitchen",
      "start",
      "energy",
      "acoustic",
      "calm",
      "sunrise"
    ],
    "sort_order": 11
  },
  {
    "id": "s12",
    "title": "Chef's Kitchen",
    "description": "Bright, crisp lighting ensures safety and precision while chopping, accompanied by an upbeat playlist to keep the creative energy flowing.",
    "room": "Kitchen",
    "image": "Scenarios/slow_cooking.png",
    "category": "My creations",
    "playlist": "Upbeat Cooking Jazz",
    "playlist_id": null,
    "focus_mode": false,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_kitchen",
        "state": "on",
        "value": "#FFFFFF",
        "brightness": "100%"
      },
      {
        "deviceId": "dev_speaker_kitchen",
        "state": "on",
        "value": "Upbeat Cooking Jazz"
      },
      {
        "deviceId": "dev_thermostat_main",
        "state": "on",
        "value": 22
      }
    ],
    "keywords": [
      "cooking",
      "kitchen",
      "food",
      "dinner",
      "lunch",
      "energy",
      "fun",
      "creative",
      "active"
    ],
    "sort_order": 12
  },
  {
    "id": "s13",
    "title": "Inner Sanctuary",
    "description": "A sacred space for your mind. Deep indigo lighting and pure silence (or soft binaural beats) help you disconnect from the world and turn inward.",
    "room": "Bedroom",
    "image": "Scenarios/inner_sanctuary.png",
    "category": null,
    "playlist": "Theta Waves & Silence",
    "playlist_id": null,
    "focus_mode": true,
    "shortcuts": false,
    "devices": [
      {
        "deviceId": "dev_light_bed",
        "state": "on",
        "value": "#4B0082",
        "brightness": "20%"
      },
      {
        "deviceId": "dev_speaker_bed",
        "state": "on",
        "value": "Theta Waves & Silence"
      },
      {
        "deviceId": "dev_diffuser_bed",
        "state": "on",
        "value": "Jasmine & Sandalwood"
      },
      {
        "deviceId": "dev_purifier_bed",
        "state": "on",
        "value": "Silent"
      }
    ],
    "keywords": [
      "meditation",
      "zen",
      "calm",
      "quiet",
      "spiritual",
      "anxious",
      "stress",
      "recovery",
      "sleep"
    ],
    "sort_order": 13
  }
]$scenarios$::jsonb) AS x(
    id text,
    title text,
    description text,
    room text,
    image text,
    category text,
    playlist text,
    playlist_id text,
    focus_mode boolean,
    shortcuts boolean,
    devices jsonb,
    keywords jsonb,
    sort_order integer
  )
)
INSERT INTO public.scenario_templates (
  id,
  title,
  description,
  room,
  image,
  category,
  playlist,
  playlist_id,
  focus_mode,
  shortcuts,
  devices,
  keywords,
  sort_order
)
SELECT
  seed.id,
  seed.title,
  seed.description,
  seed.room,
  seed.image,
  seed.category,
  seed.playlist,
  seed.playlist_id,
  seed.focus_mode,
  seed.shortcuts,
  COALESCE(seed.devices, '[]'::jsonb),
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(seed.keywords)), '{}'),
  seed.sort_order
FROM seed
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  room = EXCLUDED.room,
  image = EXCLUDED.image,
  category = EXCLUDED.category,
  playlist = EXCLUDED.playlist,
  playlist_id = EXCLUDED.playlist_id,
  focus_mode = EXCLUDED.focus_mode,
  shortcuts = EXCLUDED.shortcuts,
  devices = EXCLUDED.devices,
  keywords = EXCLUDED.keywords,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

NOTIFY pgrst, 'reload schema';
