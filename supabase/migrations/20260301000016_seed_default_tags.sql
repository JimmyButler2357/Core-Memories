-- Migration 016: seed_default_tags
-- Insert the 17 built-in system tags. These appear for every user —
-- like pre-installed apps on a phone.

INSERT INTO tags (name, slug, source) VALUES
  ('Humor',         'humor',        'system'),
  ('Milestone',     'milestone',    'system'),
  ('First',         'first',        'system'),
  ('Sports',        'sports',       'system'),
  ('School',        'school',       'system'),
  ('Health',        'health',       'system'),
  ('Birthday',      'birthday',     'system'),
  ('Holiday',       'holiday',      'system'),
  ('Family',        'family',       'system'),
  ('Friendship',    'friendship',   'system'),
  ('Creativity',    'creativity',   'system'),
  ('Nature',        'nature',       'system'),
  ('Food',          'food',         'system'),
  ('Bedtime',       'bedtime',      'system'),
  ('Travel',        'travel',       'system'),
  ('Sweet Moment',  'sweet-moment', 'system'),
  ('Other',         'other',        'system');
