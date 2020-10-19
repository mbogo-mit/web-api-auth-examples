let ZOOM = 1.0;
const MARK_SPACING = 70;// the number of pixels between each mark of time
let MARK_STARTING_POSITION = 0;
const TIME_STEP = 500;
let CURRENT_SONG_TIME = 0;
let timeline_mark_triangle_change_x = 0;
let timeline_mark_triangle_left_start = 0;
let scrollbar_change_x = 0;
let scrollbar_left_start = 0;
let PLAYBACK_DURATION = 1;
let TIME_MARK_ABSOLUTE_OFFSET = 165.5;
let MINIMUM_EFFECT_CARD_DURATION = 100;
let RUN_TIMELINE_MARK_INTERVAL;
let DRAGGING_EFFECT_CARD_RID = null;
let RESIZING_EFFECT_CARD_ID = null;

let TIMELINE_MARK_PLAYING = false;
let DRAGGING_TIMELINE_MARK = false;
let TIMELINE_MARK_TIME_STEP = 1000;
const iro = window.iro;
let Editor = new EDITOR();
