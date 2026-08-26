'use client'

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { panelStyles, techButtonStyles } from '../groupedStyles'
import { cloneSettings, type UserSettingsKey } from '../userSettingsStorage'

export type { UserSettingsKey } from '../userSettingsStorage'
export { defaultUserSettings, cloneSettings } from '../userSettingsStorage'

export default function SettingsModal(props: {
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  settings: UserSettingsKey | undefined,
  onSave: (settings: UserSettingsKey) => void
}) {
  const [draft, setDraft] = useState<UserSettingsKey>(cloneSettings(props.settings))

  useEffect(() => {
    if (props.isOpen) {
      setDraft(cloneSettings(props.settings))
    }
  }, [props.isOpen, props.settings])

  function close() {
    props.setIsOpen(false)
  }

  function save() {
    props.onSave(cloneSettings(draft))
    props.setIsOpen(false)
  }

  const toggleIdle = 'rounded-xl bg-[#00132C] border-2 border-[#0B3FB6] px-3.5 py-2.5 text-2xl font-semibold text-[#EDF1FB]'

  return (
    <Dialog open={props.isOpen} as="div" className="relative z-20 focus:outline-none" onClose={close}>
      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`${panelStyles} flex flex-col w-full max-w-lg p-8 gap-6 text-[#EDF1FB] font-[family-name:var(--font-geist-sans)]`}
          >
            <DialogTitle as="h1" className="text-4xl justify-self-center self-center text-center">
              Settings
            </DialogTitle>

            <label className="flex flex-row items-center gap-3 text-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={draft.openLogAfterConvert}
                onChange={(e) => setDraft((prev) => ({ ...prev, openLogAfterConvert: e.target.checked }))}
              />
              Always Show Log
            </label>

            <div className={`${panelStyles} p-5 flex flex-col gap-4`}>
              <h2 className="text-3xl">Alternative Download Name</h2>

              <label className="flex flex-row items-center gap-3 text-2xl cursor-pointer">
                <input
                  type="checkbox"
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
                <button
                  type="button"
                  className={draft.alternateName.extraTextAtFront ? techButtonStyles : toggleIdle}
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    alternateName: { ...prev.alternateName, extraTextAtFront: true }
                  }))}
                >
                  Front
                </button>
                <button
                  type="button"
                  className={!draft.alternateName.extraTextAtFront ? techButtonStyles : toggleIdle}
                  onClick={() => setDraft((prev) => ({
                    ...prev,
                    alternateName: { ...prev.alternateName, extraTextAtFront: false }
                  }))}
                >
                  Back
                </button>
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

            <div className="mt-2 flex justify-center">
              <Button className={techButtonStyles} onClick={save}>
                Done
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
