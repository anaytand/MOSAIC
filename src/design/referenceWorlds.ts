import type { CSSProperties } from 'react';

/** Every "world" a learner can switch the whole site into. */
export type ThemeKey = 'mosaic' | 'trains' | 'dinosaurs' | 'ocean' | 'space' | 'music' | 'heroes' | 'basketball' | 'animals';
export type InterestKey = Exclude<ThemeKey, 'mosaic'>;

/** CSS custom properties applied to the page root. Every themed color reads from these. */
export interface Palette {
  sky1: string; sky2: string; sky3: string;
  h1a: string; h1b: string; h2a: string; h2b: string; h3a: string; h3b: string;
  acc: string;   // main accent
  acct: string;  // accent dark enough for text on white
  acc2: string;  // secondary accent
  deep: string;  // deep brand color (ticker, buttons)
  dark: string;  // dark section background
  card: string;  // card background in dark sections
  line: string;  // borders in dark sections
  page: string;  // light page background
  wm: string;    // solid wordmark color
  wmo: string;   // outline wordmark color
  hdr: string;   // header / logo text color
}

export interface Theme {
  label: string;
  dot: string;
  world: string;
  wordmark: string;
  vars: Palette;
}

/** The themed coding lesson shown in the editor, save-point window and hero card. */
export interface Lesson {
  project: string;
  lower: string;
  comment: string;
  k1: string; v1: string;
  k2: string; v2: string;
  fn: string;
  msg: string;
}

export const THEME_ORDER: ThemeKey[] = ['mosaic', 'trains', 'dinosaurs', 'ocean', 'space', 'music', 'heroes'];
export const INTEREST_ORDER: InterestKey[] = ['trains', 'dinosaurs', 'ocean', 'space', 'music', 'heroes'];

export const THEMES: Record<ThemeKey, Theme> = {
  mosaic: {
    label: 'MOSAIC', dot: '#3B8FBF', world: 'Default world', wordmark: 'MOSAIC · MOSAIC · MOSAIC · ',
    vars: { sky1: '#C6DCEA', sky2: '#E2ECF1', sky3: '#EDF3F0', h1a: '#B7D3BE', h1b: '#8DB59A', h2a: '#9CC2A6', h2b: '#5F8F70', h3a: '#7FAE8C', h3b: '#4C7A5C', acc: '#3B8FBF', acct: '#2A6E96', acc2: '#EBA25E', deep: '#1E3A5F', dark: '#0E1518', card: '#151F23', line: '#2A3A40', page: '#F3F6F7', wm: 'rgba(30,58,95,0.9)', wmo: 'rgba(30,58,95,0.18)', hdr: '#0F1A1F' },
  },
  trains: {
    label: 'Trains', dot: '#8A5524', world: 'Trains world', wordmark: 'ALL ABOARD · ALL ABOARD · ',
    vars: { sky1: '#D6E3EC', sky2: '#E9EEF0', sky3: '#F1EFE8', h1a: '#B9C79A', h1b: '#93A673', h2a: '#9FB27E', h2b: '#76895A', h3a: '#85996A', h3b: '#5E7048', acc: '#8A5524', acct: '#8A5524', acc2: '#E8B44A', deep: '#2C3540', dark: '#15191E', card: '#1E242B', line: '#333C46', page: '#F4F2EE', wm: 'rgba(44,53,64,0.9)', wmo: 'rgba(44,53,64,0.18)', hdr: '#0F1A1F' },
  },
  dinosaurs: {
    label: 'Dinosaurs', dot: '#6C8A3E', world: 'Dinosaur world', wordmark: 'DINO WORLD · DINO WORLD · ',
    vars: { sky1: '#F0D4A4', sky2: '#F5E4C6', sky3: '#EFE9D6', h1a: '#A9B86A', h1b: '#7F9147', h2a: '#87A04F', h2b: '#5E7533', h3a: '#6C8A3E', h3b: '#4A6227', acc: '#6C8A3E', acct: '#55702D', acc2: '#D9772E', deep: '#3E4A22', dark: '#171C10', card: '#222A17', line: '#39432A', page: '#F6F3EA', wm: 'rgba(62,74,34,0.9)', wmo: 'rgba(62,74,34,0.2)', hdr: '#0F1A1F' },
  },
  ocean: {
    label: 'Ocean', dot: '#2F8DB3', world: 'Ocean world', wordmark: 'DEEP SEA · DEEP SEA · ',
    vars: { sky1: '#9ED3E6', sky2: '#C4E6F0', sky3: '#DDF1F4', h1a: '#5DB3D1', h1b: '#2F8DB3', h2a: '#3A9CC4', h2b: '#1F6E96', h3a: '#22709A', h3b: '#0F4B6E', acc: '#2F8DB3', acct: '#1F6E96', acc2: '#F28C6A', deep: '#0F4B6E', dark: '#071B26', card: '#0C2633', line: '#173A4B', page: '#EEF6F8', wm: 'rgba(15,75,110,0.9)', wmo: 'rgba(15,75,110,0.2)', hdr: '#0F1A1F' },
  },
  space: {
    label: 'Space', dot: '#5B5FC7', world: 'Space world', wordmark: 'ORBIT · ORBIT · ORBIT · ',
    vars: { sky1: '#141836', sky2: '#262B55', sky3: '#3B3F72', h1a: '#8C8FA8', h1b: '#6A6D88', h2a: '#75789A', h2b: '#55587A', h3a: '#5E6185', h3b: '#41446A', acc: '#7A7EE0', acct: '#4A4EB5', acc2: '#F2B84B', deep: '#23264D', dark: '#0B0D1E', card: '#14172E', line: '#262A4A', page: '#F1F1F8', wm: 'rgba(242,184,75,0.9)', wmo: 'rgba(255,255,255,0.22)', hdr: '#FFFFFF' },
  },
  music: {
    label: 'Music', dot: '#7A4FB0', world: 'Music world', wordmark: 'ON BEAT · ON BEAT · ',
    vars: { sky1: '#E5D4F0', sky2: '#F0E2EE', sky3: '#F6ECE8', h1a: '#C9A8DE', h1b: '#A07CC0', h2a: '#B08ACF', h2b: '#8460A8', h3a: '#9A72BE', h3b: '#6B4B90', acc: '#7A4FB0', acct: '#6A43A0', acc2: '#F08AA8', deep: '#3D2760', dark: '#150E20', card: '#20172E', line: '#352847', page: '#F6F2F7', wm: 'rgba(61,39,96,0.9)', wmo: 'rgba(61,39,96,0.18)', hdr: '#0F1A1F' },
  },
  heroes: {
    label: 'Superheroes', dot: '#2257C9', world: 'Superhero world', wordmark: 'POWER UP · POWER UP · ',
    vars: { sky1: '#FFD98A', sky2: '#FFE6B8', sky3: '#FFF1DE', h1a: '#7FA0E0', h1b: '#4E73C2', h2a: '#5B80CF', h2b: '#34569F', h3a: '#3E62B0', h3b: '#22407F', acc: '#2257C9', acct: '#1F4FB8', acc2: '#F5C518', deep: '#14234D', dark: '#0C1226', card: '#141C38', line: '#25305A', page: '#F4F6FC', wm: 'rgba(20,35,77,0.9)', wmo: 'rgba(20,35,77,0.2)', hdr: '#0F1A1F' },
  },
  basketball: {
    label: 'Basketball', dot: '#BA5828', world: 'Basketball world', wordmark: 'COURT SIDE · COURT SIDE · ',
    vars: { sky1: '#FFD98A', sky2: '#FFE6B8', sky3: '#FFF1DE', h1a: '#DEA364', h1b: '#C78243', h2a: '#CF914F', h2b: '#AF6C31', h3a: '#B67A3C', h3b: '#8A5224', acc: '#BA5828', acct: '#7A4A12', acc2: '#F5C518', deep: '#14234D', dark: '#0C1226', card: '#141C38', line: '#25305A', page: '#FBF6ED', wm: 'rgba(20,35,77,0.9)', wmo: 'rgba(20,35,77,0.2)', hdr: '#0F1A1F' },
  },
  animals: {
    label: 'Animals', dot: '#55702D', world: 'Wildlife world', wordmark: 'WILD LIFE · WILD LIFE · ',
    vars: { sky1: '#F0D4A4', sky2: '#F5E4C6', sky3: '#EFE9D6', h1a: '#A9B86A', h1b: '#7F9147', h2a: '#87A04F', h2b: '#5E7533', h3a: '#6C8A3E', h3b: '#4A6227', acc: '#6C8A3E', acct: '#55702D', acc2: '#D9772E', deep: '#3E4A22', dark: '#171C10', card: '#222A17', line: '#39432A', page: '#F6F3EA', wm: 'rgba(62,74,34,0.9)', wmo: 'rgba(62,74,34,0.2)', hdr: '#0F1A1F' },
  },
};

/** Turns a palette into `--sky1: …` style custom properties for a React `style` prop. */
export function themeStyle(key: ThemeKey): CSSProperties {
  const vars = THEMES[key].vars;
  const style: Record<string, string> = {};
  (Object.keys(vars) as (keyof Palette)[]).forEach((k) => {
    style[k === 'line' ? '--world-line' : `--${k}`] = vars[k];
  });
  return style as CSSProperties;
}
