'use client'

import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import FileImporter from './components/FileImporter';
import { shittyDb } from './keys';
import { buttonStyles } from './groupedStyles';
import { convertLegalShieldRows } from './lib/conversion';

import * as XLSX from 'xlsx'

const defaultMainSettings:object = {
    sheetName: '',
    fieldNoteSheetName: '',
    newGroup: false,
    language: { value: 'English', label: 'English' },
    groupNumber: '', 
    company: '', 
    spheres: [], 
    refferalSource: '', 
    convertedSheet: undefined,
    dupeCounter: 0,
    updateCounter: 0,
    unusedCollumsLegalShield: [],
    failedMappings: [],
    exisitingDupesFound: [],
    hasStateUpdated: false
}

export default function Home() {
    // Main State for User
    const [mainSettings, setMainSettings]:any = useState(defaultMainSettings);

    // State from User
    const [workbook, setWorkbook]:any = useState('test');

    // State from Field Notes Sheet
    const [fieldNoteSheet, setFieldNoteSheet]:any = useState('test2');

    /* Handle Modal */
    const [isOpen, setIsOpen] = useState(false)

    const [navIsOpen, setNavIsOpen] = useState(false)

    /* Handles Password */
    const [passInput, setPassInput] = useState<string>('')

    /* Website check if user has a password */
    const [userSettings, setUserSettings]: any = useState({ 
        password: '', 
        user: '',
        settingIsOpen: false,
        userProfileIsOpen: false
    })
    
    /* Define text for the user Button */
    /*
        [A-Z] | Find Capital  
        .*    | everything else after and unlimited times delete everything from first capital 
        -
        exp: "helloName" | returns: hello
    */   

    const firstName: string = userSettings.user.charAt( 0 ).toUpperCase() + userSettings.user.replace( /[A-Z].*/ , '').replace(userSettings.user.charAt(0), '')
    const lastName: string = userSettings.user.charAt( firstName.length ).toUpperCase() // this fails
    const userButtonText: string = firstName + ' ' + lastName


    function handleSupport () { // toggle settings button
        return setUserSettings((prevUserSettings: any) => {
            return{ ...prevUserSettings, settingIsOpen: !prevUserSettings.settingIsOpen }
        } )    
    }

    function handleNavIsOpen () {
        return setNavIsOpen((prevState: boolean) => {
            return (!prevState)
        })
    }

    /* Functions */    
    function handlePassInputChange(e: any){
        const {value} = e.target
        setPassInput(() => (value))
    }

    function checkPass(inputPass: string) { /* Future make this api request */
        const foundUser = shittyDb.users.find((currentUser) => (inputPass === currentUser.password))
        if (foundUser) {
            setUserSettings((prevUserSettings: any) => {

                return ({ // allow access
                    ...shittyDb[foundUser.user],
                    password: foundUser.password,
                    user: foundUser.user
                })
            })
            // console.log(userSettings)
            setMainSettings((prevMainSettings: any) => { // should set main settings to be user settings 
                const tempUser = shittyDb[foundUser.user]
                return {
                    ...prevMainSettings,
                    spheres: tempUser.userPref.spheresOptionsPref
                }
            })
            window.localStorage.setItem('tempPass', inputPass) /* MOVE TO DATABASE FUTURE */
        } else {
            setIsOpen(true)
        }
    }

    function handleSignOut() {
        window.localStorage.removeItem('tempPass')
        return window.location.reload();
    }

    function handleSubmit(e: any) { 
        e.preventDefault();
        checkPass(passInput)
    }

    useEffect(() => {
        const userPref = window.localStorage.getItem('tempPass')

        if(userPref) { 
            checkPass(userPref)
        }
    }, [])
  /* Handle Sheet Functions */

    function convertSheet() {
        try {
            const objectMainSheet: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
                workbook.Sheets[workbook.SheetNames[0]],
                { raw: false }
            )
            const fieldNoteMainSheet: Record<string, unknown>[] = mainSettings.newGroup
                ? []
                : XLSX.utils.sheet_to_json(fieldNoteSheet.Sheets[fieldNoteSheet.SheetNames[0]], { raw: false })

            const result = convertLegalShieldRows(objectMainSheet, fieldNoteMainSheet, {
                language: mainSettings.language,
                groupNumber: mainSettings.groupNumber,
                company: mainSettings.company,
                spheres: mainSettings.spheres,
                refferalSource: mainSettings.refferalSource,
                excelHeaders: userSettings.excelHeaders
            })

            if (result.exisitingDupesFound.length > 0 || result.failedMappings.length > 0) {
                setIsOpen(true)
            }

            setMainSettings((prevMainSettings: any) => ({
                ...prevMainSettings,
                ...result,
                hasStateUpdated: false
            }))
        } catch (error) {
            console.error(error)
            setIsOpen(true)
            setMainSettings((prevMainSettings: any) => ({
                ...prevMainSettings,
                failedMappings: ['Conversion failed. Check the Legal Shield file and try again.'],
                hasStateUpdated: false
            }))
        }
    }

  function downloadSheet() {
    const sheetHeaders = Object.keys(userSettings.excelHeaders).map((key: any) => key)
    const newWS = XLSX.utils.json_to_sheet(mainSettings.convertedSheet, { header: sheetHeaders })
    const newWB = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWB, newWS, "NewDownload" )
    XLSX.writeFile(newWB, `simpleExcelConvertDownload.xlsx`)
  }

  /* Handles Toop Tip Text */
  let toolTipConvert = ''
  const tempToolTipConvert = []
  if (mainSettings.groupNumber === '') {tempToolTipConvert.push('Group #')} if (mainSettings.company === '') { tempToolTipConvert.push('Company') } if (!mainSettings.newGroup) { if (fieldNoteSheet === 'test2'){tempToolTipConvert.push('Field Note Sheet')} }
  toolTipConvert = tempToolTipConvert.join(', ')

    return (
        <>
        {/* Password Page */}
        { userSettings.password === '' ?
            <div className='grid grid-cols-3 grid-rows-3 items-center justify-center w-screen h-screen bg-[url(./vecteezy_blue-tech-digital.jpg)] bg-cover'>
                <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings} userSettings={userSettings}/>
                <form onSubmit={handleSubmit} className='flex flex-col mt-2 self-start row-start-2 col-start-2 '>
                    <div className=''>
                        <h1 className='text-5xl text-center '>Enter Password</h1>
                    </div>
                    <input
                        className='bg-[#292524] p-2 px-8 focus:outline-hidden outline-none w-full rounded-sm  text-3xl text-center font-bold'
                        type='password'
                        onChange={handlePassInputChange}
                        value={passInput}
                    >
                    </input>
                   
                </form>
                <button onClick={handleSubmit} className={`${buttonStyles}  w-fit justify-self-start self-start ml-2 mt-[3.5rem] col-start-3 row-start-2`}>Submit</button>
            </div>
        :
        <div  className={`${isOpen === true ? 'blur-sm': ''} flex flex-col flex-1 bg-[url(./vecteezy_blue-tech-digital.jpg)] opacity-80 bg-cover `}>
        {/* Main View */}    
            <nav id='Nav' className='px-4 pb-2 mb-2 flex flex-row justify-between relative bg-[#1B1917]'>
                <h1 className='text-4xl mt-4 ml-14 self-center bg-[#EDF1FB] bg-clip-text text-transparent bg-clip-text text-transparent bg-clip-text text-transparent opacity-[100%]'>Simple Excel Conversion</h1>
                <div className='overflow-visible text-center absolute right-[0%] top-[0%] mr-4 mt-2 '>
                    <button className={` mr-2 bg-[#1B1917] border-2 border-[#1a1816] ${ navIsOpen ? ' rounded-t-md ' : 'rounded-md  hover:border-2 hover:border-[#706E6C]' }  text-xl p-3 px-5 `} onClick={handleNavIsOpen}>{userButtonText} </button>
                    {  !navIsOpen ? null
                    : 
                        <div className='relative flex flex-col bg-[#1B1917] text-lg px-2 rounded-md '>
                            <button data-tooltip={`Future`} className='text-[#a5a8b1] mt-2' disabled>Settings</button>
                            <button className='mb-2' onClick={handleSignOut}>Sign Out</button>
                        </div>
                    }
                </div>
            </nav>
            <div id='Body' className='min-w-[50%]  h-full'>
                <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings} userSettings={userSettings}/>
                <div className={`min-h-[25%] min-w-[55%] rounded-md  bg-[#00132C]/[var(--bg-opacity)] [--bg-opacity:80%] justify-self-center  ${mainSettings.sheetName === '' || mainSettings.fieldNoteSheetName === '' ? 'content-center' : ''}`}>
                    <FileImporter defaultMainSettings={defaultMainSettings} mainSettings={mainSettings} setMainSettings={setMainSettings} workbook={workbook} setWorkbook={setWorkbook} fielfieldNoteSheet={fieldNoteSheet} setFieldNoteSheet={setFieldNoteSheet} userSettings={userSettings}/>
        
                    { mainSettings.sheetName != '' || mainSettings.fieldNoteSheetName != '' ? 
                    <div className={` ${ mainSettings.convertedSheet !== undefined ? 'justify-between px-[9%]' : 'justify-center' } flex flex-row my-4 pb-3`} >
                        {mainSettings.sheetName !== '' ?
                            tempToolTipConvert.length > 0 ? 
                                <div  className='justify-center' data-tooltip={`Missing: ${toolTipConvert}`} >
                                    <button disabled={true} className={` ${buttonStyles} text-[#a5a8b1] pointer-events-none cursor-not-allowed self-center mx-auto`} onClick={convertSheet}>Convert</button>
                                </div>
                                : <button onClick={convertSheet} className={`${buttonStyles}  hover:bg-[#292524]`}>Convert</button>
                            :null
                        }
                        {mainSettings.convertedSheet !== undefined ?
                            !mainSettings.hasStateUpdated ? 
                            <button onClick={downloadSheet} className={`${buttonStyles}`}>Download</button>
                                :<div data-tooltip={`Something has changed re convert the file`}> <button disabled={true} className={`${buttonStyles} cursor-not-allowed text-[#a5a8b1] pointer-events-none`} >Re Convert</button> </div>
                            :null
                        }
                        {mainSettings.convertedSheet !== undefined?
                            <button onClick={() => setIsOpen(true)} className={`${buttonStyles}`}>Check Log</button>
                            : null
                        }
                    </div>
                    : null                        
                    }
                </div>
            </div>
            <footer id='Footer' className='flex flex-row pb-3 mt-3 pt-2 px-4 justify-between bg-[#1B1917]'>
                <h1 className='text-xl self-center text-left'>Created by <a className={`rounded-md bg-[#1B1917] hover:bg-[#292524] p-1 text-xl`} target="_blank" rel="noopener noreferrer" href='https://www.linkedin.com/in/brandonbutkovich/'>Zu0s</a></h1>      
                <div className='flex flex-row'>
                    <button className={`${buttonStyles} border-none w-fit text-xl`} onClick={handleSupport}>{ userSettings.settingIsOpen ? <p data-tooltip={`Title with Support and your name`}>brandon.butk@gmail.com</p> : 'Support'}</button> 
                    <h1 className='text-xl self-center place-self-end text-right ml-4'>V 1.02.02</h1>
                </div>
            </footer>
        </div>  
        }
        </>
    );
}
