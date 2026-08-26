'use client'

import { Button } from '@headlessui/react'
import { techButtonStyles } from '../groupedStyles'

export default function SignOutConfirm(props: {
  onCancel: () => void,
  onConfirm: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center text-[#EDF1FB] font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl">
        Sign Out
      </h1>
      <p className="mt-4 text-2xl">
        Are you sure you want to sign out?
      </p>
      <div className="mt-6 flex flex-row justify-center gap-4">
        <Button className={`${techButtonStyles} cursor-pointer`} onClick={props.onCancel}>
          No
        </Button>
        <Button className={`${techButtonStyles} cursor-pointer`} onClick={props.onConfirm}>
          Yes
        </Button>
      </div>
    </div>
  )
}
