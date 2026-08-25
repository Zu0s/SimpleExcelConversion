'use client'

import { useState } from 'react';
import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { panelStyles, techButtonStyles } from '../groupedStyles'

export default function Modal(props: { isOpen: boolean, setIsOpen: Function, mainSettings: any, userSettings: { password: string, user: string } }) {
  const [toggleBox, setToggleBox] = useState({
    unmappedCollums: false,
    failedMappings: false
  })

  

  function handleToggleBox(boxName: string) {// toggle buttons
    setToggleBox((prevToggle: any) => {
      return {
        ...prevToggle,
        [boxName]: !prevToggle[boxName]
      }
    })
  }

  function close() { // close modal
    setToggleBox((prevToggle: any) => { // close the toggle boxes unless they stay open on reopen
      return {
        unmappedCollums: false,
        failedMappings: false
      }
    })
    return props.setIsOpen(false)
  }

  /* Mapping for drop down text */
  const newUnmappedCollums = props.mainSettings.unusedCollumsLegalShield.map((currentItem: any) => {
    return <p className={` mt-2 ml-5 mr-5 text-[#E54800] whitespace-nowrap overflow-x-auto text-xl cursor-default`} >{currentItem}</p>
  })

  const newFailedMappings = props.mainSettings.failedMappings.map((currentItem: any) => {
    return <p className={` mt-2 ml-5 mr-5 text-[#E54800] whitespace-nowrap overflow-x-auto text-xl cursor-default`} >{currentItem}</p>
  })

  // changing text color if there is an error to pull user over 
  const failedMappingText = (props.mainSettings.failedMappings.length === 0 ? ` text-[#EDF1FB] border-b-2 border-[#0B3FB6] text-xl  cursor-default` : ` text-[#E54800] border-b-2 border-[#0B3FB6] text-xl  cursor-default`)



  return (
    <>
      <Dialog open={props.isOpen} as="div" className="relative z-10 focus:outline-none blur-none" onClose={close}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className={`${props.mainSettings.exisitingDupesFound.length > 0 ? 'w-max ' : 'max-w-md'} ${panelStyles} flex flex-col w-full p-8 text-[#EDF1FB] font-[family-name:var(--font-geist-sans)] duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0`}
            >
              { props.userSettings.password === '' ?
                <>
                <DialogTitle as="h1" className="text-4xl justify-self-center self-center text-center" >
                  Error
                </DialogTitle>
                <h1 className="text-2xl text-center">User Password is Incorrect</h1>
                <div className="mt-4 flex flex-row-reverse">
                    <Button
                      className={`${techButtonStyles} justify-self-end self-end`}
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
                  <div className={`${panelStyles} p-5 mt-4`}>
                    <h1 className="text-2xl">Convert Log:</h1>
                    <p className="mt-2 text-lg ml-5 text-[#EDF1FB] ">Duplicates: <span className='border-b-2 border-[#0B3FB6] text-xl text-[#EDF1FB] cursor-default' data-tooltip={`Shield At Work users on multiple lines`}>{props.mainSettings.dupeCounter}</span></p>
                    <p className="mt-2 text-lg mb-4 ml-5 text-[#EDF1FB]">Updates: <span className='border-b-2 border-[#0B3FB6] text-xl text-[#EDF1FB] cursor-default' data-tooltip={`How many contacts in field notes already`}>{props.mainSettings.updateCounter}</span></p>
                  </div>

                  <div className={`${panelStyles} p-5 mt-4 mb-4`}>
                    <h1 className="text-2xl">Modular Mapping: {props.mainSettings.failedMappings.length === 0 ? '' : <span className='text-[#E54800]'>Critical Error</span>}</h1>
                    <div>
                      <p className="mt-2 text-lg ml-5 text-[#EDF1FB]">Unmaped Collums: <span className='border-b-2 border-[#0B3FB6] text-xl text-[#EDF1FB] cursor-default' data-tooltip={`Legal Shield collums not mapped with a Field Notes Headers`}>{props.mainSettings.unusedCollumsLegalShield.length === 0 ? '0' : props.mainSettings.unusedCollumsLegalShield.length}</span>{ props.mainSettings.unusedCollumsLegalShield.length === 0 ? '' : <span><Button className={`float-right text-lg mr-5 px-3 border rounded-xl border-[#0B3FB6] bg-[#000C47] text-[#EDF1FB] hover:bg-[#093390]`} onClick={() => { handleToggleBox('unmappedCollums') }}>x</Button></span> }</p>
                      {toggleBox.unmappedCollums ? 
                        <div className='mt-1 p-1 pb-2 border-2 rounded-xl border-[#0B3FB6] bg-[#000C47] flex flex-col'>
                        <p className={`w-fit mt-2 ml-5 mr-5 text-[#EDF1FB] border-b-2 border-[#0B3FB6] text-lg cursor-default`}>Legal Shield Headers</p>
                        {newUnmappedCollums}
                      </div>
                        : ''
                      }
                    </div>
                    <div>
                      <p className="mt-2 text-lg ml-5 text-[#EDF1FB]">Failed Mappings: <span className={failedMappingText} data-tooltip={`Field Notes headers that failed to map to a Legal Shield Header`}>{props.mainSettings.failedMappings.length === 0 ? '0' : props.mainSettings.failedMappings.length}</span>{props.mainSettings.failedMappings.length === 0 ? '' : <span><Button className={`float-right text-lg mr-5 px-3 border rounded-xl border-[#0B3FB6] bg-[#000C47] text-[#EDF1FB] hover:bg-[#093390]`} onClick={() => { handleToggleBox('failedMappings') }}>x</Button></span>}</p>
                      {toggleBox.failedMappings ?
                      <div className='mt-1 p-1 pb-2 border-2 rounded-xl border-[#0B3FB6] bg-[#000C47] flex flex-col'>
                        <p className={`w-fit mt-2 ml-5 mr-5 text-[#E54800] border-b-2 border-[#0B3FB6] text-lg cursor-default`}>Field Notes Header - Legal Shield Header</p>
                        
                        {newFailedMappings}
                      </div>
                      : '' }
                    </div>
                  </div>

                  {props.mainSettings.exisitingDupesFound.length > 0 ? 
                  <div>
                    <h1 className="text-2xl">Error Log: </h1>
                    {props.mainSettings.exisitingDupesFound.map((currentErrorObj: any, key = 1) => {
                      return <p className='ml-5 mt-2 text-lg text-[#E54800]'><span data-tooltip={`Shield At Work file`} className='border-b-2 border-[#0B3FB6] cursor-default'>{`${currentErrorObj.orignalName}`}</span>: found duplicate at <span className='border-b-2 border-[#0B3FB6] cursor-default' data-tooltip={`Field Notes File`}>{`${currentErrorObj.dupeFoundName}`}</span> with : <span data-tooltip={`Field Notes File  Header`} className='border-b-2 border-[#0B3FB6] text-xl text-[#EDF1FB] cursor-default'>{`${currentErrorObj.issueFound}`}</span></p>
                    })}
                    <p className='mt-4'><span className='text-lg'>Disclaimer:</span> File is still downloadable but <span className='text-lg border-b-2 border-[#0B3FB6] cursor-default' data-tooltip={`Any error above WILL NOT be updates in field notes`}>DO NOT</span> recomend due to errors above</p>
                  </div>
                  :<h1 className="text-2xl">No Errors Detected</h1>
                  }
                  <div className="mt-4 flex justify-center">
                    <Button
                      className={`${techButtonStyles}`}
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
