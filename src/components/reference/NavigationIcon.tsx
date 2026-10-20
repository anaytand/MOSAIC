import type { AppPage } from '../../types'
export function NavigationIcon({ page }: { page: AppPage }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {page === 'Home' && <path d="m3 10 9-7 9 7v10h-6v-6H9v6H3Z" />}
    {page === 'Learn' && <path d="M4 20V6a3 3 0 0 1 3-3h13v15H7a3 3 0 0 0-3 2Zm0 0h16" />}
    {page === 'Progress' && <><path d="M4 20h17M6 16v-5m6 5V7m6 9V3" /><path d="m4 7 6-4" /></>}
    {page === 'Settings' && <><path d="M3 7h18M3 17h18" /><circle cx="8" cy="7" r="3" fill="currentColor" /><circle cx="16" cy="17" r="3" fill="currentColor" /></>}
  </svg>
}
