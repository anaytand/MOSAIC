import type { AppPage } from './types.ts'
export type AuthPage = 'signup' | 'login' | 'forgot' | 'reset' | 'check-email' | 'confirmed' | 'account'
export interface AppRoute { page: AppPage; workspace: boolean; setup: boolean; sensory?: boolean; auth?: AuthPage }
export function parseRoute(hash: string): AppRoute {
  const auth = hash.match(/^#auth\/(signup|login|forgot|reset|check-email|confirmed|account)$/)?.[1] as AuthPage | undefined
  if (auth) return { page: 'Home', workspace: false, setup: false, auth }
  if (hash === '#sensory') return { page: 'Settings', workspace: false, setup: false, sensory: true }
  if (hash === '#setup') return { page: 'Home', workspace: false, setup: true }
  if (hash === '#learn/workspace') return { page: 'Learn', workspace: true, setup: false }
  const page: AppPage = hash === '#learn' ? 'Learn' : hash === '#progress' ? 'Progress' : hash === '#settings' ? 'Settings' : hash === '#keyboard' || hash === '#keyboards' ? 'Keyboard' : 'Home'
  return { page, workspace: false, setup: false }
}
export function initialRoute(hash: string, search: string): AppRoute {
  const callback = new URLSearchParams(search).get('mosaic_auth')
  if (callback === 'confirm' || callback === 'reset') return { page: 'Home', workspace: false, setup: false, auth: callback === 'confirm' ? 'confirmed' : 'reset' }
  return parseRoute(hash)
}
export function routeHash(route: AppRoute): string { return route.auth ? `#auth/${route.auth}` : route.page === 'Keyboard' ? '#keyboard' : route.sensory ? '#sensory' : route.setup ? '#setup' : route.workspace ? '#learn/workspace' : `#${route.page.toLowerCase()}` }
