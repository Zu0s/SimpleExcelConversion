'use client'

import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { panelStyles, techButtonStyles } from '../groupedStyles'

export default function SettingsModal(props: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  function close() {
    props.setIsOpen(false)
  }

  return (
    <Dialog open={props.isOpen} as="div" className="relative z-20 focus:outline-none" onClose={close}>
      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`${panelStyles} flex flex-col w-full max-w-md p-8 text-[#EDF1FB] font-[family-name:var(--font-geist-sans)]`}
          >
            <DialogTitle as="h1" className="text-4xl justify-self-center self-center text-center">
              Settings
            </DialogTitle>
            <p className="mt-4 text-2xl text-center">
              Settings will be managed here.
            </p>
            <div className="mt-6 flex justify-center">
              <Button className={techButtonStyles} onClick={close}>
                Done
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
