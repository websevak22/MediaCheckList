export const VIDEO_QUALITY_ITEMS = [
  { key: 'strong_hook', label: 'Strong hook in first 5–10 seconds' },
  { key: 'story_clear', label: 'Story is clear and engaging' },
  { key: 'footage_removed', label: 'Unnecessary footage removed' },
  { key: 'audio_clear', label: 'Audio / voice is clear' },
  { key: 'music_balanced', label: 'Background music is balanced' },
  { key: 'subtitles_checked', label: 'Subtitles / captions checked' },
  { key: 'facts_correct', label: 'Names, dates & facts are correct' },
  { key: 'hd_quality', label: 'HD / 1080p or better' },
  { key: 'mobile_checked', label: 'Video checked on mobile' },
  { key: 'strong_cta', label: 'Strong Call to Action' },
]

export const NGO_BRANDING_ITEMS = [
  { key: 'logo_included', label: 'Being Sevak logo included' },
  { key: 'logo_clear', label: 'Logo clear & correctly placed' },
  { key: 'logo_no_cover', label: 'Logo does not cover content' },
  { key: 'name_correct', label: 'NGO name is correctly written' },
  { key: 'branding_consistent', label: 'Branding is consistent' },
  { key: 'project_correct', label: 'Project / program name correct' },
  { key: 'contact_correct', label: 'Contact / social media details correct' },
]

export const BENEFICIARY_ITEMS = [
  { key: 'consent_confirmed', label: 'Beneficiary consent confirmed' },
  { key: 'privacy_checked', label: "Children's privacy / safety checked" },
  { key: 'no_misleading', label: 'No misleading information' },
  { key: 'no_insensitive', label: 'No disrespectful / insensitive footage' },
  { key: 'work_accurate', label: "NGO's work accurately represented" },
  { key: 'data_verified', label: 'Statistics / data verified' },
]

export const TITLE_CHECK_ITEMS = [
  { key: 'attractive', label: 'Title is attractive & creates curiosity' },
  { key: 'clear_explanation', label: 'Title clearly explains the video' },
  { key: 'keyword_included', label: 'Main keyword included naturally' },
  { key: 'not_clickbait', label: 'Not misleading / clickbait' },
  { key: 'spelling_checked', label: 'Spelling & grammar checked' },
  { key: 'suitable_audience', label: 'Suitable for YouTube audience' },
]

export const DESCRIPTION_ITEMS = [
  { key: 'written', label: 'Description is written' },
  { key: 'first_lines_clear', label: 'First 2–3 lines explain the video' },
  { key: 'story_explained', label: 'Project / beneficiary story explained' },
  { key: 'ngo_mentioned', label: 'NGO name mentioned correctly' },
  { key: 'keywords_included', label: 'Relevant keywords included' },
  { key: 'donation_info', label: 'Donation info added where applicable' },
  { key: 'links_checked', label: 'Website / social links checked' },
  { key: 'spelling_checked', label: 'Spelling & grammar checked' },
]

export const HASHTAG_ITEMS = [
  { key: 'relevant_added', label: 'Relevant hashtags added' },
  { key: 'ngo_included', label: 'NGO / org hashtag included' },
  { key: 'no_misleading', label: 'No unnecessary / misleading hashtags' },
  { key: 'spelling_checked', label: 'Spelling checked' },
]

export const THUMBNAIL_ITEMS = [
  { key: 'high_quality', label: 'High-quality image' },
  { key: 'emotional_visual', label: 'Strong emotional / impactful visual' },
  { key: 'words_readable', label: '2–5 words max, readable on mobile' },
  { key: 'matches_video', label: 'Matches the video content' },
  { key: 'no_clickbait', label: 'No misleading / clickbait image' },
]

export const END_SCREEN_ITEMS = [
  { key: 'thank_you', label: '"Thank You for Watching" added' },
  { key: 'donation_appeal', label: 'Donation Appeal added' },
  { key: 'qr_tested', label: 'Donation QR Code / link added & tested' },
  { key: 'contact_checked', label: 'Donation contact details checked' },
  { key: 'subscribe_added', label: '"Subscribe" prompt added' },
  { key: 'playlist_added', label: 'Related video / playlist added' },
  { key: 'visible_long_enough', label: 'Visible long enough' },
]

export const YOUTUBE_SETTINGS_ITEMS = [
  { key: 'category_selected', label: 'Correct category selected' },
  { key: 'language_selected', label: 'Correct language selected' },
  { key: 'playlist_added', label: 'Playlist added' },
  { key: 'end_screen_added', label: 'End screen added' },
  { key: 'cards_added', label: 'Cards added where useful' },
  { key: 'audience_checked', label: 'Audience setting checked' },
  { key: 'visibility_checked', label: 'Visibility setting checked' },
  { key: 'date_confirmed', label: 'Upload date / time confirmed' },
]

export const FINAL_QUALITY_ITEMS = [
  { key: 'video_watched', label: 'Final video watched completely' },
  { key: 'mobile_checked', label: 'Video watched on mobile' },
  { key: 'audio_headphones', label: 'Audio checked with headphones' },
  { key: 'thumbnail_checked', label: 'Thumbnail checked' },
  { key: 'title_checked', label: 'Title checked' },
  { key: 'description_checked', label: 'Description checked' },
  { key: 'hashtags_checked', label: 'Hashtags checked' },
  { key: 'donation_tested', label: 'Donation link / QR code tested' },
  { key: 'contact_checked', label: 'Contact information checked' },
  { key: 'copyright_checked', label: 'Copyright / music checked' },
  { key: 'spelling_checked', label: 'All spellings checked' },
]

export function defaultChecks(items) {
  return Object.fromEntries(items.map((i) => [i.key, false]))
}

export function countSection(obj) {
  if (!obj) return 0
  return Object.entries(obj).filter(([k, v]) => !k.startsWith('final') && v === true).length
}

export const ALL_SECTIONS = [
  { key: 'video_quality', title: 'Video Quality', items: VIDEO_QUALITY_ITEMS },
  { key: 'ngo_branding', title: 'NGO Branding', items: NGO_BRANDING_ITEMS },
  { key: 'beneficiary_content', title: 'Beneficiary & Content', items: BENEFICIARY_ITEMS },
  { key: 'title_check', title: 'Title Check', mandatory: true, items: TITLE_CHECK_ITEMS },
  { key: 'description_check', title: 'Description Check', mandatory: true, items: DESCRIPTION_ITEMS },
  { key: 'hashtags_check', title: 'Hashtags', mandatory: true, items: HASHTAG_ITEMS },
  { key: 'thumbnail', title: 'Thumbnail', items: THUMBNAIL_ITEMS },
  { key: 'end_screen', title: 'End Screen', mandatory: true, items: END_SCREEN_ITEMS },
  { key: 'youtube_settings', title: 'YouTube Settings', items: YOUTUBE_SETTINGS_ITEMS },
  { key: 'final_quality', title: 'Final Quality Check', items: FINAL_QUALITY_ITEMS },
]

export function checklistProgress(checklist) {
  let done = 0
  let total = 0
  ALL_SECTIONS.forEach((s) => {
    total += s.items.length
    done += countSection(checklist?.[s.key])
  })
  return total ? done / total : 0
}

export const STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  changes_required: '#f97316',
  not_approved: '#ef4444',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  changes_required: 'Changes Required',
  not_approved: 'Not Approved',
}

export const TYPE_LABELS = {
  long_video: 'Long Video',
  short: 'Short',
  event: 'Event',
  story: 'Story',
  awareness: 'Awareness',
}

export const TYPE_COLORS = {
  long_video: '#3b82f6',
  short: '#a855f7',
  event: '#f59e0b',
  story: '#10b981',
  awareness: '#f97316',
}
