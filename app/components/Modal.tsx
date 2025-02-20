'use client'

import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { buttonStyles } from '../groupedStyles'

export default function Modal(props: { isOpen: boolean, setIsOpen: Function, mainSettings: any, userSettings: { password: string, user: string } }) {

  function close() {
    return props.setIsOpen(false)
  }
  return (
    <>
      <Dialog open={props.isOpen} as="div" className="relative z-10 focus:outline-none blur-none" onClose={close}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className={`${props.mainSettings.exisitingDupesFound.length > 0 ? 'w-max ' : 'max-w-sm'} flex flex-col w-full rounded-xl border-2 border-[#706E6C] bg-[#292524] p-6 duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0`}
            >
              { props.userSettings.password === '' ?
                <>
                <DialogTitle as="h1" className="text-4xl justify-self-center self-center text-center" >
                  Error
                </DialogTitle>
                <h1 className="text-2xl text-center">User Password is Incorrect</h1>
                <div className="mt-4 flex flex-row-reverse">
                    <Button
                      className={`${buttonStyles} justify-self-end self-end`}
                      onClick={close}
                    >
                      Understood
                    </Button>
                  </div>
                </>
                :
                <>
                <DialogTitle as="h1" className="text-4xl justify-self-center self-center" >
                  Logs
                </DialogTitle>
                  <h1 className="text-2xl">Convert Log:</h1>
                  <p className="mt-2 text-lg ml-5 text-[#E54800] ">Duplicates: <span className='border-b-2 border-[#706E6C] text-xl text-[#FF5100] cursor-default' data-tooltip={`Shield At Work users on multiple lines`}>{props.mainSettings.dupeCounter}</span></p>
                  <p className="mt-2 text-lg mb-4 ml-5 text-[#E54800]">Updates: <span className='border-b-2 border-[#706E6C] text-xl text-[#FF5100] cursor-default' data-tooltip={`How many contacts in field notes already`}>{props.mainSettings.updateCounter}</span></p>
              
                  {props.mainSettings.exisitingDupesFound.length > 0 ? 
                  <div>
                    <h1 className="text-2xl">Error Log: </h1>
                    {props.mainSettings.exisitingDupesFound.map((currentErrorObj: any, key = 1) => {
                      return <p className='ml-5 mt-2 text-lg text-[#E54800]'><span data-tooltip={`Shield At Work file`} className='border-b-2 border-[#1B1917] cursor-default'>{`${currentErrorObj.orignalName}`}</span>: found duplicate at <span className='border-b-2 border-[#1B1917] cursor-default' data-tooltip={`Field Notes File`}>{`${currentErrorObj.dupeFoundName}`}</span> with : <span data-tooltip={`Field Notes File  Header`} className='border-b-2 border-[#706E6C] text-xl text-[#FF5100] cursor-default'>{`${currentErrorObj.issueFound}`}</span></p>
                    })}
                    <p className='mt-4'><span className='text-lg'>Disclaimer:</span> File is still downloadable but <span className='text-lg border-b-2 border-[#706E6C] cursor-default' data-tooltip={`Any error above WILL NOT be updates in field notes`}>DO NOT</span> recomend due to errors above</p>
                  </div>
                  :<h1 className="text-2xl">No Errors Detected</h1>
                  }
                  <div className="mt-4">
                    <Button
                      className={`${buttonStyles} `}
                      onClick={close}
                    >
                      Got it, thanks!
                    </Button>
                  </div>
                </>
              }
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  )
}