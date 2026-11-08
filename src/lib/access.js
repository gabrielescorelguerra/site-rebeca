import { useSyncExternalStore } from 'react'
import { ADMIN_AUTHENTICATED_KEY, AUTHENTICATED_KEY } from '../data/planning'

const TEST_KEY = 'rebeca-test-user'
const CHANGE_EVENT = 'rebeca-access-change'
const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT))

export function accessRole() {
  if (localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true') {
    return sessionStorage.getItem(TEST_KEY) === 'true' ? 'test' : 'admin'
  }
  return localStorage.getItem(AUTHENTICATED_KEY) === 'true' ? 'user' : 'guest'
}

function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useAccess() {
  const role = useSyncExternalStore(subscribe, accessRole, () => 'guest')
  return { admin: role === 'admin', authenticated: role !== 'guest', testing: role === 'test' }
}

export function startUserTest() {
  if (accessRole() !== 'admin') return
  sessionStorage.setItem(TEST_KEY, 'true')
  notify()
}

export function stopUserTest() {
  sessionStorage.removeItem(TEST_KEY)
  notify()
}

export function logout() {
  localStorage.removeItem(ADMIN_AUTHENTICATED_KEY)
  localStorage.removeItem(AUTHENTICATED_KEY)
  sessionStorage.removeItem(TEST_KEY)
  notify()
}

export function notifyLogin() {
  sessionStorage.removeItem(TEST_KEY)
  notify()
}
