-- =============================================
-- BEING SEVAK CHARITABLE TRUST
-- YouTube Video Pre-Upload Checklist Schema
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: checklists
-- Stores each video checklist submission
-- =============================================
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Video Details
  video_title TEXT NOT NULL DEFAULT '',
  video_topic TEXT NOT NULL DEFAULT '',
  video_editor TEXT NOT NULL DEFAULT '',
  prepared_by TEXT NOT NULL DEFAULT '',
  video_date DATE DEFAULT CURRENT_DATE,
  video_duration TEXT NOT NULL DEFAULT '',
  video_type TEXT NOT NULL DEFAULT 'long_video',

  -- Section booleans stored as JSONB
  video_quality JSONB NOT NULL DEFAULT '{
    "strong_hook": false,
    "story_clear": false,
    "footage_removed": false,
    "audio_clear": false,
    "music_balanced": false,
    "subtitles_checked": false,
    "facts_correct": false,
    "hd_quality": false,
    "mobile_checked": false,
    "strong_cta": false
  }',

  ngo_branding JSONB NOT NULL DEFAULT '{
    "logo_included": false,
    "logo_clear": false,
    "logo_no_cover": false,
    "name_correct": false,
    "branding_consistent": false,
    "project_correct": false,
    "contact_correct": false
  }',

  beneficiary_content JSONB NOT NULL DEFAULT '{
    "consent_confirmed": false,
    "privacy_checked": false,
    "no_misleading": false,
    "no_insensitive": false,
    "work_accurate": false,
    "data_verified": false
  }',

  title_check JSONB NOT NULL DEFAULT '{
    "attractive": false,
    "clear_explanation": false,
    "keyword_included": false,
    "not_clickbait": false,
    "spelling_checked": false,
    "suitable_audience": false,
    "final_title": ""
  }',

  description_check JSONB NOT NULL DEFAULT '{
    "written": false,
    "first_lines_clear": false,
    "story_explained": false,
    "ngo_mentioned": false,
    "keywords_included": false,
    "donation_info": false,
    "links_checked": false,
    "spelling_checked": false,
    "final_description": ""
  }',

  hashtags_check JSONB NOT NULL DEFAULT '{
    "relevant_added": false,
    "ngo_included": false,
    "no_misleading": false,
    "spelling_checked": false,
    "final_hashtags": ""
  }',

  thumbnail JSONB NOT NULL DEFAULT '{
    "high_quality": false,
    "emotional_visual": false,
    "words_readable": false,
    "matches_video": false,
    "no_clickbait": false
  }',

  end_screen JSONB NOT NULL DEFAULT '{
    "thank_you": false,
    "donation_appeal": false,
    "qr_tested": false,
    "contact_checked": false,
    "subscribe_added": false,
    "playlist_added": false,
    "visible_long_enough": false
  }',

  youtube_settings JSONB NOT NULL DEFAULT '{
    "category_selected": false,
    "language_selected": false,
    "playlist_added": false,
    "end_screen_added": false,
    "cards_added": false,
    "audience_checked": false,
    "visibility_checked": false,
    "date_confirmed": false
  }',

  final_quality JSONB NOT NULL DEFAULT '{
    "video_watched": false,
    "mobile_checked": false,
    "audio_headphones": false,
    "thumbnail_checked": false,
    "title_checked": false,
    "description_checked": false,
    "hashtags_checked": false,
    "donation_tested": false,
    "contact_checked": false,
    "copyright_checked": false,
    "spelling_checked": false
  }',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'changes_required', 'not_approved'))
);

-- =============================================
-- TABLE 2: approvers
-- Stores approval signatures for each checklist
-- =============================================
CREATE TABLE approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('video_editor', 'social_media', 'final_approver')),
  name TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT '',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES for fast queries
-- =============================================
CREATE INDEX idx_checklists_status ON checklists(status);
CREATE INDEX idx_checklists_created_at ON checklists(created_at DESC);
CREATE INDEX idx_approvers_checklist_id ON approvers(checklist_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on both tables
-- =============================================
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations with the anon key
-- You can restrict these later based on auth
CREATE POLICY "Allow all operations on checklists"
  ON checklists FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on approvers"
  ON approvers FOR ALL
  USING (true)
  WITH CHECK (true);
