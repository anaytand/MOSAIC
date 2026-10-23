import type { Interest, UserPreferences, IntroConceptId } from '../types.ts'
import { extendedChapters } from './extendedContent.ts'
import type { LearningTheme, ThemeId, ThemeChapter } from './types.ts'
const introductoryThemes: Record<ThemeId, Omit<LearningTheme, 'chapters'> & { chapters: Record<IntroConceptId, ThemeChapter> }> = {
  basketball: {
    id: 'basketball', name: 'Basketball Coding Academy', projectName: 'Mosaic Falcons season hub', illustration: 'basketball',
    description: 'Join the Mosaic Falcons. Build their scoreboard, make game decisions, and turn a season of points into player statistics.',
    palette: { accent: '#a45320', soft: '#fff0df', ink: '#66340f', darkAccent: '#f4bc82', darkSoft: '#392d27', darkInk: '#ffe1bf' },
    introduction: ['Mosaic Falcons', 'Welcome to the court!'],
    fields: [
      { key: 'team_name', label: 'Home team', value: 'Mosaic Falcons' }, { key: 'opponent_name', label: 'Away team', value: 'Harbor Hawks' },
      { key: 'team_score', label: 'Home points', value: 24 }, { key: 'opponent_score', label: 'Away points', value: 18 },
      { key: 'player_name', label: 'Player', value: 'Jordan' }, { key: 'player_points', label: 'Player points', value: 12 },
    ],
    decision: { ready: 'Mosaic Falcons lead', wait: 'Keep playing', extraReady: 'Jordan reached the scoring goal', extraWait: 'Jordan can keep practicing' },
    series: { key: 'game_scores', values: [24, 18, 30], totalKey: 'season_points', totalLabel: 'Season points', countKey: 'wins', countLabel: 'Wins', threshold: 18, countTask: 'Each opponent scored 18. Count the games where the Falcons scored more than 18.' },
    calculator: { name: 'average_points', label: 'Jordan average points', inputKey: 'player_scores', values: [12, 18, 24] },
    chapters: {
      'hello-python': { title: 'Introduce Your Team', narrative: 'You are the new coder for the Mosaic Falcons. Start the season hub by introducing your team to its fans.', milestone: 'Team introduced', completion: 'The Falcons have their first Python introduction.' },
      variables: { title: 'Build a Scoreboard', narrative: 'The Falcons face the Harbor Hawks. Store the teams, their points, and Jordan’s player stats so your season hub can display a live result from your code.', milestone: 'Scoreboard built', completion: 'Your scoreboard is ready for the Falcons and Hawks.' },
      conditions: { title: 'Make Referee Decisions', narrative: 'Use the scoreboard from mission 2 to decide whether the Falcons lead. Explore how the decision changes when the scores change.', milestone: 'Game decisions checked', completion: 'Your game logic responds to different scores.' },
      loops: { title: 'Track a Basketball Season', narrative: 'The Falcons scored 24, 18, and 30 in three games. Each opponent scored 18. Process the team’s season, then explore its total and wins.', milestone: 'Season tracked', completion: 'The season hub can now process several games.' },
      functions: { title: 'Build a Player Stats Calculator', narrative: 'Alongside the team season, Jordan recorded 12, 18, and 24 points. Build a reusable player-average calculator that works for Jordan and for other players too.', milestone: 'Player calculator ready', completion: 'Your Falcons project now includes a reusable player calculator.' },
    },
  },
  space: {
    id: 'space', name: 'Space Exploration Mission', projectName: 'Aurora mission control', illustration: 'space',
    description: 'Prepare the Aurora spacecraft, inspect its resources, and turn mission readings into a reusable analysis tool.',
    palette: { accent: '#6453a5', soft: '#efebfc', ink: '#3d2c70', darkAccent: '#c4b4f2', darkSoft: '#2d2843', darkInk: '#eee4ff' },
    introduction: ['Aurora mission', 'Mission control is online!'],
    fields: [{ key: 'spacecraft', label: 'Spacecraft', value: 'Aurora' }, { key: 'launch_site', label: 'Launch site', value: 'Meridian Base' }, { key: 'fuel_units', label: 'Fuel units', value: 24 }, { key: 'reserve_units', label: 'Reserve units', value: 18 }, { key: 'pilot_name', label: 'Pilot', value: 'Alex' }, { key: 'samples_loaded', label: 'Samples loaded', value: 12 }],
    decision: { ready: 'Aurora cleared for launch', wait: 'Refuel before launch', extraReady: 'Sample goal reached', extraWait: 'Load more samples' },
    series: { key: 'signal_readings', values: [72, 66, 60], totalKey: 'signal_total', totalLabel: 'Signal total', countKey: 'strong_signals', countLabel: 'Strong signals', threshold: 65, countTask: 'Count signal readings greater than 65.' },
    calculator: { name: 'average_signal', label: 'Aurora average signal' },
    chapters: {
      'hello-python': { title: 'Launch Your Mission', narrative: 'Mission control needs a welcome screen for Aurora. Introduce the spacecraft before building its control software.', milestone: 'Mission introduced', completion: 'Aurora mission control has its first Python message.' },
      variables: { title: 'Build Mission Control', narrative: 'Keep Aurora’s launch site, fuel, pilot, and samples together in named variables. These resources will guide your next mission decision.', milestone: 'Resources stored', completion: 'Your mission resources are ready to inspect.' },
      conditions: { title: 'Check Launch Conditions', narrative: 'Compare Aurora’s fuel with its reserve requirement. Your code should make a different launch decision when the fuel changes.', milestone: 'Launch logic checked', completion: 'Mission control can respond to changing fuel levels.' },
      loops: { title: 'Process Mission Readings', narrative: 'Aurora sends three signal readings. Process the transmissions in order, then explore their total and strong-signal count.', milestone: 'Signals processed', completion: 'Your mission software can process a stream of readings.' },
      functions: { title: 'Create a Mission Calculator', narrative: 'Build a reusable average-signal calculator from Aurora’s readings. Future spacecraft should be able to use the same function.', milestone: 'Mission calculator ready', completion: 'Your mission now has a reusable analysis tool.' },
    },
  },
  ocean: {
    id: 'ocean', name: 'Ocean Research Expedition', projectName: 'Tidal Scout research dashboard', illustration: 'ocean',
    description: 'Join the Tidal Scout expedition. Record discoveries, choose research equipment, and analyze underwater observations.',
    palette: { accent: '#176c8a', soft: '#e5f4fa', ink: '#124660', darkAccent: '#8ed3ee', darkSoft: '#1b3442', darkInk: '#d1f1ff' },
    introduction: ['Tidal Scout expedition', 'Ready to explore the reef!'],
    fields: [{ key: 'research_vessel', label: 'Research vessel', value: 'Tidal Scout' }, { key: 'research_station', label: 'Station', value: 'Coral Station' }, { key: 'depth_m', label: 'Depth (m)', value: 24 }, { key: 'standard_limit_m', label: 'Standard equipment limit (m)', value: 18 }, { key: 'scientist_name', label: 'Scientist', value: 'Sam' }, { key: 'sightings', label: 'Sea-creature sightings', value: 12 }],
    decision: { ready: 'Deploy deep-water sensors', wait: 'Use standard sensors', extraReady: 'Survey goal reached', extraWait: 'Continue the survey' },
    series: { key: 'observation_depths', values: [12, 18, 24], totalKey: 'depth_total', totalLabel: 'Depth total', countKey: 'deep_observations', countLabel: 'Deep observations', threshold: 18, countTask: 'Count observations made deeper than 18 metres.' },
    calculator: { name: 'average_depth', label: 'Tidal Scout average depth' },
    chapters: {
      'hello-python': { title: 'Introduce Your Expedition', narrative: 'Welcome the crew aboard Tidal Scout with a Python introduction. This becomes the first screen of your expedition dashboard.', milestone: 'Crew welcomed', completion: 'Tidal Scout is ready to introduce its expedition.' },
      variables: { title: 'Record Your Discoveries', narrative: 'Store Tidal Scout’s station, depth, scientist, and sea-creature sightings. Your research dashboard will use these values to choose equipment next.', milestone: 'Research data stored', completion: 'Your expedition data is now stored in variables.' },
      conditions: { title: 'Check Underwater Conditions', narrative: 'Compare the research depth with the standard equipment limit. Different depths should lead to different equipment decisions.', milestone: 'Equipment logic checked', completion: 'Your dashboard selects equipment for changing depths.' },
      loops: { title: 'Track Ocean Observations', narrative: 'Tidal Scout observed the reef at three depths. Process each observation and explore how many need deep-water equipment.', milestone: 'Observations tracked', completion: 'Your expedition can process a list of observations.' },
      functions: { title: 'Build an Exploration Analyzer', narrative: 'Use the depth observations in a reusable average-depth function. Later expeditions can pass in their own lists.', milestone: 'Depth analyzer ready', completion: 'Your expedition has a reusable research analyzer.' },
    },
  },
  trains: {
    id: 'trains', name: 'Railway Coding Workshop', projectName: 'Mosaic Express operations board', illustration: 'trains',
    description: 'Run the Mosaic Express. Organize station data, make capacity decisions, and build a timetable analysis tool.',
    palette: { accent: '#875321', soft: '#f9eddb', ink: '#674219', darkAccent: '#edc38a', darkSoft: '#382e22', darkInk: '#ffe5bd' },
    introduction: ['Mosaic Express', 'Welcome aboard!'],
    fields: [{ key: 'railway_service', label: 'Service', value: 'Mosaic Express' }, { key: 'station', label: 'Destination', value: 'Cedar Junction' }, { key: 'passenger_count', label: 'Passengers', value: 24 }, { key: 'carriage_capacity', label: 'Current capacity', value: 18 }, { key: 'dispatcher_name', label: 'Dispatcher', value: 'Quinn' }, { key: 'stops_scheduled', label: 'Scheduled stops', value: 12 }],
    decision: { ready: 'Add another carriage', wait: 'Current carriages are enough', extraReady: 'Prepare the long route', extraWait: 'Prepare the short route' },
    series: { key: 'station_delays', values: [2, 4, 6], totalKey: 'total_delay', totalLabel: 'Total delay', countKey: 'delayed_stops', countLabel: 'Stops delayed over 3 minutes', threshold: 3, countTask: 'Count stops with a delay greater than 3 minutes.' },
    calculator: { name: 'average_delay', label: 'Mosaic Express average delay' },
    chapters: {
      'hello-python': { title: 'Introduce Your Railway Service', narrative: 'Create the first passenger announcement for the Mosaic Express operations board.', milestone: 'Service announced', completion: 'Your railway service has its first Python announcement.' },
      variables: { title: 'Build the Station Board', narrative: 'Store the destination, passengers, carriage capacity, and dispatcher’s stop count. The operations board will use them in its next decision.', milestone: 'Station data stored', completion: 'Your station board has the information it needs.' },
      conditions: { title: 'Plan the Next Departure', narrative: 'Compare the passenger count with carriage capacity. Decide whether the Mosaic Express needs an extra carriage.', milestone: 'Departure logic checked', completion: 'Your departure plan adjusts to different passenger counts.' },
      loops: { title: 'Process the Train Stops', narrative: 'Three stops reported delays of 2, 4, and 6 minutes. Process their reports and explore which exceed the delay threshold.', milestone: 'Stops processed', completion: 'Your operations board can process several station reports.' },
      functions: { title: 'Create a Timetable Calculator', narrative: 'Build an average-delay calculator for the Mosaic Express. It should also work when another service supplies a different list.', milestone: 'Timetable calculator ready', completion: 'Your railway project includes a reusable timetable analyzer.' },
    },
  },
  animals: {
    id: 'animals', name: 'Wildlife Research Lab', projectName: 'Cedar Watch field notebook', illustration: 'animals',
    description: 'Join Cedar Watch to record wildlife, classify field observations, and build a reusable research calculator.',
    palette: { accent: '#3f723d', soft: '#edf4e4', ink: '#2b502a', darkAccent: '#b5d9a0', darkSoft: '#26372b', darkInk: '#e0f1ce' },
    introduction: ['Cedar Watch', 'The wildlife survey starts here!'],
    fields: [{ key: 'research_project', label: 'Research project', value: 'Cedar Watch' }, { key: 'survey_zone', label: 'Survey zone', value: 'Pine Valley' }, { key: 'bird_count', label: 'Bird observations', value: 24 }, { key: 'observation_goal', label: 'Observation goal', value: 18 }, { key: 'researcher_name', label: 'Researcher', value: 'Riley' }, { key: 'camera_sightings', label: 'Camera sightings', value: 12 }],
    decision: { ready: 'Observation goal exceeded', wait: 'Keep observing', extraReady: 'Camera survey goal reached', extraWait: 'Check the cameras again' },
    series: { key: 'daily_sightings', values: [3, 6, 9], totalKey: 'total_sightings', totalLabel: 'Total sightings', countKey: 'busy_days', countLabel: 'Days with over 5 sightings', threshold: 5, countTask: 'Count days with more than 5 wildlife sightings.' },
    calculator: { name: 'average_sightings', label: 'Cedar Watch average sightings' },
    chapters: {
      'hello-python': { title: 'Introduce Your Research Project', narrative: 'Open the Cedar Watch field notebook with a welcome message for your wildlife research team.', milestone: 'Project introduced', completion: 'Cedar Watch has its first digital field note.' },
      variables: { title: 'Store Wildlife Information', narrative: 'Keep Pine Valley’s bird count, observation goal, researcher, and camera sightings in variables for the field notebook.', milestone: 'Wildlife data stored', completion: 'Your wildlife observations are stored and displayed.' },
      conditions: { title: 'Classify Your Observations', narrative: 'Use the bird count and observation goal to classify the current survey. The result should change when the count changes.', milestone: 'Survey logic checked', completion: 'Your notebook can classify different survey results.' },
      loops: { title: 'Process Wildlife Data', narrative: 'Cedar Watch recorded 3, 6, and 9 sightings over three days. Process each day’s data and explore the busy-day count.', milestone: 'Survey days processed', completion: 'Your field notebook can process several days of sightings.' },
      functions: { title: 'Build a Wildlife Stats Function', narrative: 'Turn the survey data into an average-sightings calculator that works for Cedar Watch and other research teams.', milestone: 'Wildlife calculator ready', completion: 'Your wildlife project has a reusable statistics function.' },
    },
  },
  music: {
    id: 'music', name: 'Music Coding Studio', projectName: 'Mosaic Sessions playlist desk', illustration: 'music',
    description: 'Plan a Mosaic Sessions set. Store artist details, evaluate the running time, and analyze a playlist with Python.',
    palette: { accent: '#6a4aa8', soft: '#f1ebfa', ink: '#3d2760', darkAccent: '#cdb8f3', darkSoft: '#2f283f', darkInk: '#efe6ff' },
    introduction: ['Mosaic Sessions', 'Welcome to the studio!'],
    fields: [{ key: 'music_project', label: 'Music project', value: 'Mosaic Sessions' }, { key: 'venue', label: 'Venue', value: 'Studio Eight' }, { key: 'set_minutes', label: 'Set length (minutes)', value: 24 }, { key: 'intermission_after', label: 'Intermission threshold (minutes)', value: 18 }, { key: 'artist_name', label: 'Artist', value: 'Casey' }, { key: 'tracks_ready', label: 'Tracks ready', value: 12 }],
    decision: { ready: 'Plan an intermission', wait: 'Keep the set playing', extraReady: 'Track goal reached', extraWait: 'Prepare more tracks' },
    series: { key: 'track_minutes', values: [2, 4, 6], totalKey: 'playlist_minutes', totalLabel: 'Playlist minutes', countKey: 'long_tracks', countLabel: 'Tracks longer than 3 minutes', threshold: 3, countTask: 'Count tracks longer than 3 minutes.' },
    calculator: { name: 'average_track_length', label: 'Mosaic Sessions average track length' },
    chapters: {
      'hello-python': { title: 'Introduce Your Music Project', narrative: 'Create a welcome message for Mosaic Sessions before building the playlist desk.', milestone: 'Studio introduced', completion: 'Mosaic Sessions has its first Python introduction.' },
      variables: { title: 'Build the Artist Desk', narrative: 'Store Casey’s venue, set length, intermission threshold, and prepared tracks. Your playlist desk will use these details to plan the set.', milestone: 'Artist details stored', completion: 'Your artist and set information are ready to use.' },
      conditions: { title: 'Plan the Set', narrative: 'Compare the set length with the intermission threshold. Use code to decide whether an intermission is needed.', milestone: 'Set logic checked', completion: 'Your set planner responds to different running times.' },
      loops: { title: 'Process a Playlist', narrative: 'Try a sample playlist with tracks lasting 2, 4, and 6 minutes. Process every track and explore its total running time.', milestone: 'Playlist processed', completion: 'Your playlist desk can process several tracks.' },
      functions: { title: 'Create a Music Calculator', narrative: 'Calculate the average track length with a reusable function. New playlists should work without rewriting it.', milestone: 'Music calculator ready', completion: 'Your studio project includes a reusable playlist calculator.' },
    },
  },
}
export const themeCatalog = Object.fromEntries(Object.entries(introductoryThemes).map(([id, theme]) => [id, { ...theme, chapters: { ...theme.chapters, ...extendedChapters(theme.id) } }])) as Record<ThemeId, LearningTheme>
export function getThemeForInterest(interest: Interest | null, customTopic = ''): LearningTheme | null {
  const selected = interest === 'sports' || interest === 'basketball' || (interest === 'custom' && customTopic.trim().toLowerCase() === 'basketball') ? 'basketball' : interest ?? 'ocean'
  return themeCatalog[selected as ThemeId] ?? null
}
export function getLearningTheme(preferences: Pick<UserPreferences, 'interest' | 'customTopic'>): LearningTheme | null { return getThemeForInterest(preferences.interest, preferences.customTopic) }
