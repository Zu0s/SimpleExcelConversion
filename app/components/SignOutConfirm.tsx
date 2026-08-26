'use client'

import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { panelStyles, techButtonStyles } from '../groupedStyles'

export default function SignOutConfirm(props: {
  isOpen: boolean,
  onCancel: () => void,
  onConfirm: () => void
}) {
  return (
    <Dialog open={props.isOpen} as="div" className="relative z-20 focus:outline-none" onClose={props.onCancel}>
      <div className="fixed inset-0 z-20 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`${panelStyles} flex flex-col w-full max-w-md p-8 text-[#EDF1FB] font-[family-name:var(--font-geist-sans)]`}
          >
            <DialogTitle as="h1" className="text-4xl justify-self-center self-center text-center">
              Sign Out
            </DialogTitle>
            <p className="mt-4 text-2xl text-center">
              Are you sure you want to sign out?
            </p>
            <div className="mt-6 flex flex-row justify-center gap-4">
              <Button className={techButtonStyles} onClick={props.onCancel}>
                No
              </Button>
              <Button className={techButtonStyles} onClick={props.onConfirm}>
                Yes
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
