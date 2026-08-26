import { shittyDb } from './keys'

export type UserSettingsKey = {
  openLogAfterConvert: boolean,
  alternateName: {
    useCompanyName: boolean,
    extraText: string,
    extraTextAtFront: boolean
  }
}

export const defaultUserSettings: UserSettingsKey = {
  openLogAfterConvert: true,
  alternateName: {
    useCompanyName: false,
    extraText: '',
    extraTextAtFront: false
  }
}

export function userSettingsStorageKey(user: string) {
  return `simpleExcelUserSettings:${user}`
}

export function cloneSettings(settings: UserSettingsKey | undefined): UserSettingsKey {
  return {
    openLogAfterConvert: settings?.openLogAfterConvert ?? defaultUserSettings.openLogAfterConvert,
    alternateName: {
      useCompanyName: settings?.alternateName?.useCompanyName ?? false,
      extraText: settings?.alternateName?.extraText ?? '',
      extraTextAtFront: settings?.alternateName?.extraTextAtFront ?? false
    }
  }
}

export function loadUserSettings(user: string): UserSettingsKey | undefined {
  if (!user) return undefined
  try {
    const raw = window.localStorage.getItem(userSettingsStorageKey(user))
    if (!raw) return undefined
    return cloneSettings(JSON.parse(raw))
  } catch {
    return undefined
  }
}

export function persistUserSettings(user: string, settings: UserSettingsKey) {
  if (!user) return
  const next = cloneSettings(settings)
  if (shittyDb[user]) {
    shittyDb[user].settings = next
  }
  window.localStorage.setItem(userSettingsStorageKey(user), JSON.stringify(next))
}

export function settingsForLogin(user: string): UserSettingsKey {
  return loadUserSettings(user) ?? cloneSettings(shittyDb[user]?.settings)
}
