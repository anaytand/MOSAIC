import { useEffect, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { loadLessonProgress, loadPreferences, saveLessonProgress, savePreferences } from '../preferences.ts'
import type { LessonProgress, UserPreferences } from '../types.ts'
import { clearPending, CloudConflictError, CloudProgressStore, hasGuestWork, mergeAccountCopies, mergeGuestProgress, readPending, writePending } from './cloudProgress.ts'
import type { LearningData } from './cloudProgress.ts'

export type SyncStatus = 'loading' | 'ready' | 'saving' | 'saved' | 'failed' | 'conflict' | 'guest'
const importFlag = (id: string) => `mosaic-guest-imported-v1:${id}`
const guestData = (): LearningData => ({ preferences: loadPreferences(), progress: loadLessonProgress() })
const guestImportAvailable = (id: string): boolean => {
  if (!hasGuestWork(guestData())) return false
  try { return localStorage.getItem(importFlag(id)) !== '1' } catch { return true }
}

export function useLearningPersistence(client: SupabaseClient | null, session: Session | null, authReady: boolean) {
  const userId = session?.user.id ?? null
  const [preferences, setPreferencesState] = useState<UserPreferences>(loadPreferences)
  const [progress, setProgressState] = useState<LessonProgress>(loadLessonProgress)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [message, setMessage] = useState('')
  const [canImport, setCanImport] = useState(false)
  const [conflict, setConflict] = useState<{ cloud: LearningData; device: LearningData; hasCloudData: boolean } | null>(null)
  const [reload, setReload] = useState(0)
  const storeRef = useRef<CloudProgressStore | null>(null)
  const epochRef = useRef(0)
  const dataRef = useRef<LearningData>({ preferences, progress })
  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const importedRef = useRef(false)
  const skipInitialSaveRef = useRef(false)
  useEffect(() => { dataRef.current = { preferences, progress } }, [preferences, progress])
  const remember = (data: LearningData) => {
    dataRef.current = data
    if (!authReady || !ready || activeUserId !== userId) return
    if (userId) writePending(userId, data)
    else { savePreferences(data.preferences); saveLessonProgress(data.progress) }
  }
  const setPreferences = (value: SetStateAction<UserPreferences>) => {
    const next = typeof value === 'function' ? value(dataRef.current.preferences) : value
    remember({ ...dataRef.current, preferences: next })
    setPreferencesState(next)
  }
  const setProgress = (value: SetStateAction<LessonProgress>) => {
    const next = typeof value === 'function' ? value(dataRef.current.progress) : value
    remember({ ...dataRef.current, progress: next })
    setProgressState(next)
  }

  useEffect(() => {
    if (!authReady) return
    const epoch = ++epochRef.current
    queueMicrotask(() => {
      if (epoch !== epochRef.current) return
      setReady(false)
      setActiveUserId(null)
      setConflict(null)
      setCanImport(false)
      setMessage('')
    })
    importedRef.current = false
    skipInitialSaveRef.current = true
    saveQueue.current = Promise.resolve()
    if (!userId || !client) {
      storeRef.current = null
      const guest = guestData()
      queueMicrotask(() => {
        if (epoch !== epochRef.current) return
        setPreferencesState(guest.preferences)
        setProgressState(guest.progress)
        setStatus('guest')
        setReady(true)
      })
      return
    }
    queueMicrotask(() => { if (epoch === epochRef.current) setStatus('loading') })
    const store = new CloudProgressStore(client, userId)
    storeRef.current = store
    void store.load().then(({ data, hasCloudData }) => {
      if (epoch !== epochRef.current) return
      const pending = readPending(userId)
      if (pending && JSON.stringify(pending) === JSON.stringify(data)) clearPending(userId)
      else if (pending && !hasCloudData) {
        skipInitialSaveRef.current = false
        setPreferencesState(pending.preferences)
        setProgressState(pending.progress)
        setActiveUserId(userId)
        setReady(true)
        setStatus('saving')
        return
      } else if (pending) {
        setConflict({ cloud: data, device: pending, hasCloudData })
        setStatus('conflict')
        return
      }
      setPreferencesState(data.preferences)
      setProgressState(data.progress)
      setActiveUserId(userId)
      setCanImport(guestImportAvailable(userId))
      setReady(true)
      setStatus(hasCloudData ? 'saved' : 'ready')
    }).catch((error: unknown) => {
      if (epoch !== epochRef.current) return
      const backup = readPending(userId)
      if (backup) {
        setPreferencesState(backup.preferences)
        setProgressState(backup.progress)
        setActiveUserId(userId)
        setReady(true)
      }
      setMessage(error instanceof Error ? error.message : 'Could not load your cloud progress.')
      setStatus('failed')
    })
    const tracker = epochRef
    return () => { tracker.current++ }
  }, [authReady, client, userId, reload])

  useEffect(() => {
    if (!authReady || !ready || activeUserId !== userId) return
    if (!userId) {
      savePreferences(preferences)
      saveLessonProgress(progress)
      return
    }
    if (skipInitialSaveRef.current) { skipInitialSaveRef.current = false; return }
    const data = { preferences, progress }
    const backedUp = writePending(userId, data)
    setStatus('saving')
    const epoch = epochRef.current
    const timer = window.setTimeout(() => {
      const store = storeRef.current
      if (!store || epoch !== epochRef.current) return
      saveQueue.current = saveQueue.current.catch(() => {}).then(() => store.save(data))
      void saveQueue.current.then(() => {
        if (epoch !== epochRef.current || dataRef.current.preferences !== preferences || dataRef.current.progress !== progress) return
        clearPending(userId, data)
        if (importedRef.current) {
          try { localStorage.setItem(importFlag(userId), '1') } catch { /* Import still finished on this session. */ }
          importedRef.current = false
        }
        setStatus('saved')
        setMessage('')
      }).catch((error: unknown) => {
        if (epoch !== epochRef.current) return
        const detail = error instanceof Error ? error.message : 'Could not save to the cloud.'
        setMessage(backedUp ? `${detail} Your changes remain on this device.` : `${detail} Browser backup is unavailable; keep this page open and retry.`)
        setStatus(error instanceof CloudConflictError ? 'conflict' : 'failed')
      })
    }, 850)
    return () => window.clearTimeout(timer)
  }, [authReady, ready, activeUserId, userId, preferences, progress, reload])

  const retry = () => {
    if (!userId) return
    // Reload remote versions before retrying; an older device must never blindly replace them.
    setReload((value) => value + 1)
  }
  const useCloud = () => {
    if (!conflict || !userId) return
    clearPending(userId)
    setPreferencesState(conflict.cloud.preferences)
    setProgressState(conflict.cloud.progress)
    setConflict(null)
    setActiveUserId(userId)
    setReady(true)
    setStatus(conflict.hasCloudData ? 'saved' : 'ready')
    skipInitialSaveRef.current = true
    setCanImport(guestImportAvailable(userId))
  }
  const useDevice = () => {
    if (!conflict || !userId) return
    const merged = mergeAccountCopies(conflict.cloud, conflict.device)
    skipInitialSaveRef.current = false
    setPreferencesState(merged.preferences)
    setProgressState(merged.progress)
    setConflict(null)
    setActiveUserId(userId)
    setReady(true)
    setStatus('saving')
  }
  const importGuest = () => {
    if (!userId || !ready || !canImport) return
    const local = guestData()
    const merged = mergeGuestProgress({ preferences, progress }, local, !!storeRef.current?.hasProfile)
    importedRef.current = true
    setPreferencesState(merged.preferences)
    setProgressState(merged.progress)
    setCanImport(false)
  }
  return { preferences, setPreferences, lessonProgress: progress, setLessonProgress: setProgress,
    dataReady: authReady && ready && activeUserId === userId, activeUserId, status, message, canImport,
    conflict, retry, useCloud, useDevice, importGuest }
}
