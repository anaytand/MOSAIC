/** Presentation only. Hardware layout and proposed shortcut mappings stay identical across themes. */
export type KeyboardThemeId = 'mosaic' | 'space' | 'ocean' | 'basketball' | 'music' | 'animals' | 'trains'

export interface KeyboardTheme {
  id: KeyboardThemeId
  name: string
  edition: string
  description: string
  colors: {
    shell: string
    deck: string
    key: string
    keyEdge: string
    legend: string
    macro: readonly [string, string, string, string, string, string]
    function: string
    wrist: string
    wristEdge: string
    ambient: string
    highlight: string
  }
}

export const keyboardThemes: Record<KeyboardThemeId, KeyboardTheme> = {
  mosaic: {
    id: 'mosaic', name: 'Default MOSAIC', edition: 'ORIGINAL EDITION',
    description: 'The reference-inspired dark teal shell with a pastel macro row and warm felt rest.',
    colors: { shell: '#17312f', deck: '#244443', key: '#263b3f', keyEdge: '#101e23', legend: '#f4f8f7', macro: ['#80c9bd', '#81a6dd', '#e7aa77', '#7bc1d2', '#789ed4', '#e8b284'], function: '#d6dfe1', wrist: '#b98264', wristEdge: '#82543e', ambient: '#b9e0d9', highlight: '#7fd4c4' },
  },
  space: {
    id: 'space', name: 'Space', edition: 'ORBIT EDITION',
    description: 'Deep navy, lavender controls, and small orbital details for a mission-ready look.',
    colors: { shell: '#20243e', deck: '#333656', key: '#343852', keyEdge: '#171b32', legend: '#f1f0ff', macro: ['#a8a3e8', '#9bb8ed', '#d2a9ea', '#a6b0e6', '#bea3dd', '#9ac7e4'], function: '#d8d5ee', wrist: '#79799e', wristEdge: '#555574', ambient: '#c7bdf4', highlight: '#c6b5ff' },
  },
  ocean: {
    id: 'ocean', name: 'Ocean', edition: 'DEEP SEA EDITION',
    description: 'Aqua keys, quiet wave lines, and coral details across the same familiar layout.',
    colors: { shell: '#163c49', deck: '#245968', key: '#245364', keyEdge: '#0f2d3a', legend: '#eefbfc', macro: ['#79d6d1', '#89c7e6', '#f1b99c', '#8ed7ca', '#8dbddc', '#efbba9'], function: '#cde7e8', wrist: '#75a9aa', wristEdge: '#47787e', ambient: '#a8e0dc', highlight: '#75dbdb' },
  },
  basketball: {
    id: 'basketball', name: 'Basketball', edition: 'COURTSIDE EDITION',
    description: 'Court-line details, warm orange accents, and a navy performance finish.',
    colors: { shell: '#273445', deck: '#36445a', key: '#2c3a4b', keyEdge: '#172331', legend: '#fff8ed', macro: ['#e9a56e', '#f1c891', '#d98859', '#e4b27b', '#efc390', '#d99863'], function: '#f5e2c7', wrist: '#c58659', wristEdge: '#915635', ambient: '#f2c193', highlight: '#f4b276' },
  },
  music: {
    id: 'music', name: 'Music', edition: 'STUDIO EDITION',
    description: 'Soft neon accents, rhythm marks, and deep violet-blue keycaps.',
    colors: { shell: '#302940', deck: '#4a385b', key: '#463a57', keyEdge: '#261d36', legend: '#fff4fc', macro: ['#d49bc7', '#a9a9e9', '#efaccb', '#b8a0de', '#d5a4d8', '#a6b9ec'], function: '#e8dbea', wrist: '#aa87ab', wristEdge: '#785d81', ambient: '#e2b7e6', highlight: '#ebb5da' },
  },
  animals: {
    id: 'animals', name: 'Animals', edition: 'WILDLIFE EDITION',
    description: 'Leaf and paw details in calm forest tones with soft clay highlights.',
    colors: { shell: '#294037', deck: '#3a5849', key: '#395143', keyEdge: '#1d332c', legend: '#f5faed', macro: ['#a2caa0', '#d4ba93', '#a8c6a4', '#ddb89b', '#9fc5aa', '#d1c1a0'], function: '#e1e7d2', wrist: '#a28d72', wristEdge: '#73634f', ambient: '#bdd9b6', highlight: '#bad58e' },
  },
  trains: {
    id: 'trains', name: 'Trains', edition: 'RAIL LINE EDITION',
    description: 'Steel-blue controls, route-map lines, and small signal accents.',
    colors: { shell: '#263a42', deck: '#39525b', key: '#344b53', keyEdge: '#1a3037', legend: '#f0f9f9', macro: ['#8dbbb4', '#94b5d0', '#e3b687', '#88bbb0', '#9fb4c9', '#e6b486'], function: '#d8e4e4', wrist: '#8c9d9b', wristEdge: '#5f7776', ambient: '#b6d0d0', highlight: '#a6d0c6' },
  },
}

export const keyboardThemeOrder: KeyboardThemeId[] = ['mosaic', 'space', 'ocean', 'basketball', 'music', 'animals', 'trains']
