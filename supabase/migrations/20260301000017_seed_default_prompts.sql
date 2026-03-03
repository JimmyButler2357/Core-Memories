-- Migration 017: seed_default_prompts
-- Insert the initial prompt bank — conversation starters shown on the recording
-- screen and in notifications. {child_name} gets replaced at runtime.

INSERT INTO prompts (text, min_age_months, max_age_months) VALUES
  -- Universal (all ages)
  ('What made {child_name} laugh today?', NULL, NULL),
  ('What is something {child_name} said that surprised you?', NULL, NULL),
  ('What was the best part of your day with {child_name}?', NULL, NULL),
  ('Describe {child_name}''s mood today in one sentence.', NULL, NULL),
  ('What is {child_name} really into right now?', NULL, NULL),
  ('What is something you never want to forget about today?', NULL, NULL),
  ('What did {child_name} eat today that was funny or unexpected?', NULL, NULL),
  ('Did {child_name} do something kind today?', NULL, NULL),
  ('What was bedtime like tonight?', NULL, NULL),
  ('What question did {child_name} ask today?', NULL, NULL),
  ('How did {child_name} show love today?', NULL, NULL),
  ('What is {child_name}''s favorite thing this week?', NULL, NULL),
  ('Describe a small moment you want to remember.', NULL, NULL),
  ('What made you proud of {child_name} today?', NULL, NULL),
  ('What was {child_name} playing today?', NULL, NULL),

  -- Baby (0-12 months)
  ('What new sound is {child_name} making?', 0, 12),
  ('How did {child_name} react to something new today?', 0, 12),
  ('What milestone is {child_name} working toward?', 0, 18),

  -- Toddler (12-36 months)
  ('What new word did {child_name} try to say?', 12, 36),
  ('What did {child_name} try to do independently today?', 12, 48),
  ('What is {child_name}''s favorite word right now?', 12, 36),

  -- Preschool (36-60 months)
  ('What story did {child_name} tell you today?', 36, 72),
  ('What did {child_name} pretend to be today?', 24, 60),
  ('What is {child_name} learning at school?', 36, NULL),
  ('What did {child_name} draw or create today?', 24, NULL);
