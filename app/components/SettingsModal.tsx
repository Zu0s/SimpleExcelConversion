'use client'

import { useEffect, useState } from 'react';
import { Button } from '@headlessui/react'
import { techButtonStyles } from '../groupedStyles'
import { cloneSettings, type UserSettingsKey } from '../userSettingsStorage'

export type { UserSettingsKey } from '../userSettingsStorage'
export { defaultUserSettings, cloneSettings } from '../userSettingsStorage'

export default function SettingsModal(props: {
  settings: UserSettingsKey | undefined,
  onSave: (settings: UserSettingsKey) => void
}) {
  const [draft, setDraft] = useState<UserSettingsKey>(cloneSettings(props.settings))

  useEffect(() => {
    setDraft(cloneSettings(props.settings))
  }, [props.settings])

  function save() {
    props.onSave(cloneSettings(draft))
  }

  const extraAtFront = draft.alternateName.extraTextAtFront

  function setExtraTextAtFront(atFront: boolean) {
    setDraft((prev) => ({
      ...prev,
      alternateName: { ...prev.alternateName, extraTextAtFront: atFront }
    }))
  }

  return (
    <div className="flex flex-col text-[#EDF1FB] font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl justify-self-center self-center text-center">
        Settings
      </h1>

      <label className="mt-6 flex flex-row items-center gap-3 text-2xl cursor-pointer">
        <input
          type="checkbox"
          className="cursor-pointer"
          checked={draft.openLogAfterConvert}
          onChange={(e) => setDraft((prev) => ({ ...prev, openLogAfterConvert: e.target.checked }))}
        />
        Always Show Log
      </label>

      <div className="mt-6 border-t-2 border-[#0B3FB6] pt-6 flex flex-col gap-4">
        <h2 className="text-3xl">Alternative Download Name</h2>

        <label className="flex flex-row items-center gap-3 text-2xl cursor-pointer">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={draft.alternateName.useCompanyName}
            onChange={(e) => setDraft((prev) => ({
              ...prev,
              alternateName: { ...prev.alternateName, useCompanyName: e.target.checked }
            }))}
          />
          Use Company Name
        </label>

        <div className="flex flex-row items-center gap-3 flex-wrap">
          <p className="text-2xl">extra text</p>
          <div
            className="relative inline-grid grid-cols-2 rounded-full border-2 border-[#0B3FB6] bg-[#000C47] cursor-pointer"
            role="group"
            aria-label="Extra text position"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#0B3FB6] transition-transform duration-200 ease-out ${
                extraAtFront ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
            <button
              type="button"
              className="relative z-10 px-5 py-2.5 text-2xl font-semibold text-[#EDF1FB] cursor-pointer"
              aria-pressed={extraAtFront}
              onClick={() => setExtraTextAtFront(true)}
            >
              Front
            </button>
            <button
              type="button"
              className="relative z-10 px-5 py-2.5 text-2xl font-semibold text-[#EDF1FB] cursor-pointer"
              aria-pressed={!extraAtFront}
              onClick={() => setExtraTextAtFront(false)}
            >
              Back
            </button>
          </div>
        </div>

        <input
          id="settings-extra-text"
          className="bg-[#000C47] border-2 border-[#0B3FB6] p-2 px-4 focus:outline-hidden outline-none w-full rounded-xl text-2xl text-[#EDF1FB]"
          type="text"
          value={draft.alternateName.extraText}
          onChange={(e) => setDraft((prev) => ({
            ...prev,
            alternateName: { ...prev.alternateName, extraText: e.target.value }
          }))}
        />
      </div>

      <div className="mt-6 border-t-2 border-[#0B3FB6] pt-6 flex justify-center">
        <Button className={techButtonStyles} onClick={save}>
          Done
        </Button>
      </div>
    </div>
  )
}
