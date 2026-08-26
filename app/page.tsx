'use client'

import { useState, useEffect, useRef } from 'react';
import Modal from './components/Modal';
import SettingsModal from './components/SettingsModal';
import SignOutConfirm from './components/SignOutConfirm';
import FileImporter from './components/FileImporter';
import { shittyDb } from './keys';
import { techButtonStyles, disabledTechButtonStyles, panelStyles, pageGradientStyles } from './groupedStyles';
import { buildDownloadFileName } from './downloadFileName';
import { persistUserSettings, settingsForLogin } from './userSettingsStorage';

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
    const [settingsInDropdown, setSettingsInDropdown] = useState(false)
    const [signOutConfirmIsOpen, setSignOutConfirmIsOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

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

    function closeUserDropdown() {
        setNavIsOpen(false)
        setSettingsInDropdown(false)
        setSignOutConfirmIsOpen(false)
    }

    function handleNavIsOpen () {
        if (navIsOpen) {
            closeUserDropdown()
            return
        }
        setNavIsOpen(true)
        setSettingsInDropdown(false)
        setSignOutConfirmIsOpen(false)
    }

    function handleOpenSettings() {
        setSignOutConfirmIsOpen(false)
        setSettingsInDropdown(true)
        setNavIsOpen(true)
    }

    function requestSignOut() {
        setSettingsInDropdown(false)
        setSignOutConfirmIsOpen(true)
        setNavIsOpen(true)
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
                    user: foundUser.user,
                    settings: settingsForLogin(foundUser.user)
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
        setSignOutConfirmIsOpen(false)
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

    useEffect(() => {
        if (!navIsOpen) return
        function onPointerDown(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                closeUserDropdown()
            }
        }
        document.addEventListener('mousedown', onPointerDown)
        return () => document.removeEventListener('mousedown', onPointerDown)
    }, [navIsOpen])
  /* Handle Sheet Functions */

    function convertSheet() {
        // turn original sheet into Object
        const objectMainSheet: any = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]] , {raw: false})
        const fieldNoteMainSheet: any = mainSettings.newGroup ? [] : XLSX.utils.sheet_to_json(fieldNoteSheet.Sheets[fieldNoteSheet.SheetNames[0]], {raw: false})
        let dupeCounter = 0; let updateCounter = 0;
        setMainSettings((prevMainSetings: any) => {
            return {
                ...prevMainSetings,
                exisitingDupesFound: []
            }
        })

        // .map() for excel sheet ( Just a for loop so it can modify original array while iterating )
        const filterdSheet: any = []
        for (let i = 0; i < objectMainSheet.length; i ++) {
            const currentItem: any = objectMainSheet[i]
            
            //Removes spaces, Phone number logic
            function removeSpacesAndNumbers(obj: any) { // FIX THIS TO BE MORE CONSISTENT 
                Object.keys(obj).forEach(function(key) {
                    if(typeof obj[key] === 'string') { obj[key] = obj[key].replace(/\s+/g,' ').trim() }
                    
                    const skippedValues = new Set (['Home Phone', 'Day Phone', 'Cell Phone'])
                    if (skippedValues.has(key)) { 
                        if(obj[key] === '(000) 000-0000') { obj[key] = '' }
                        else {
                            obj[key] = obj[key].replace('(', '').replace(')', '').replace('-', '')
                        }
                        /* check for extensions too potentiall?? */
                        // 10 digit number code created - EASIER TO CHANGE BASE FROM 10 DIGITS
                        // let tempPhoneNumber = obj[key].replace(/[^a-zA-Z0-9]/g, '')
                        // obj[key] = tempPhoneNumber === '0'.repeat(tempPhoneNumber.length) ? '': tempPhoneNumber
                    }
                })
            }

            // Removes spaces from strings
            function nameFixer(currentName: any) {
                const nameArr = currentName.toLowerCase().split(' ')
                //remove middle initial
                if (nameArr.length > 1) { nameArr.splice(0, nameArr.length, ...nameArr.filter((currName:any) => currName.length > 1)) }

                //capitalizes names
                for (let nameI = 0; nameI < nameArr.length ; nameI ++) { nameArr[nameI] = nameArr[nameI].charAt(0).toUpperCase() + nameArr[nameI].substring(1) }
                return nameArr.join(' ')
            }

            //Check Duplicates
            const dupeArray: any[] = []
            for(let tempI = i + 1; objectMainSheet[tempI] !== undefined && nameFixer(currentItem['First Name']) === nameFixer(objectMainSheet[tempI]['First Name']) && nameFixer(currentItem['Last Name']) === nameFixer(objectMainSheet[tempI]['Last Name']) && currentItem['Email'].toLowerCase() === objectMainSheet[tempI]['Email'].toLowerCase() ; tempI ++) {
                const currentObject = objectMainSheet[tempI]; 
                removeSpacesAndNumbers(currentObject)
                dupeCounter++
                dupeArray.push(currentObject)
            }
            removeSpacesAndNumbers(currentItem)

            // Logic for Plan Description Stiching
            let filteredPlanDescription = currentItem['Plan Description']
            if(dupeArray.length !== 0) {
                const planDescriptionArray = dupeArray.map(currentPlan => { return currentPlan['Plan Description'] })
                const filteredArr = planDescriptionArray.reduce((r, a) => r.concat(a, ' | '), [])
                if (filteredArr[filteredArr.length -1 ] = ' | ') { filteredArr.splice(filteredArr.length - 1, 1) }
                
                filteredPlanDescription = `${currentItem['Plan Description']} | ${filteredArr.join('')}`.replace('+', '|')
            }

            //spheres logic
            let filteredSpheres = ' '
            if (mainSettings.spheres.length > 0) {
                const spheresArray = mainSettings.spheres.map((currentItem: any) => currentItem.value)
                const filteredArr = spheresArray.reduce((r:any, a: any) => r.concat(a, ' | '), [])
                if (filteredArr[filteredArr.length -1 ] = ' | ') { filteredArr.splice(filteredArr.length - 1, 1) }
               
                const tempSpheresString = filteredArr.join('')

                if (filteredPlanDescription.toLowerCase().includes("spanish")) {
                    filteredSpheres = tempSpheresString.replace("English", "Spanish") 
                } else { filteredSpheres = tempSpheresString }

            }

            // logic for finding duped plans
            function findPlan(typeOfPlan: any, isMemberNumber: any) {
                let returnedItem = '';
                if(typeOfPlan === 'IDShield') {
                    const found = dupeArray.find(tempItem => { return Array.from(tempItem['Member Number'])[0] === '7' })
                    if(found !== undefined) {
                        if(isMemberNumber) { returnedItem = found['Member Number'] } 
                        else { returnedItem = found['Monthly Premium'] }
                    } 
                } else if (typeOfPlan === 'Commercial') {
                    const found = dupeArray.find(tempItem => { return tempItem['Plan Description'].includes('COMMERCIAL') })
                    if (found !== undefined) {
                        if(isMemberNumber) { returnedItem = found['Member Number'] } 
                        else { returnedItem = found['Monthly Premium'] }
                    } 
                } else if (typeOfPlan === 'Legal Shield') {
                    const found = dupeArray.find(tempItem => { return !tempItem['Plan Description'].includes('COMMERCIAL') && Array.from(tempItem['Member Number'])[0] !== '7' })
                    if (found !== undefined) {
                        if(isMemberNumber) { returnedItem = found['Member Number'] } 
                        else { returnedItem = found['Monthly Premium'] }
                    }
                } else if (typeOfPlan === 'Buisness') {
                    const found = dupeArray.find(tempItem => {return tempItem['Plan Description'].toLowerCase().includes('business') && Array.from(tempItem['Member Number'])[0] !== '7'})
                    if (found !== undefined) {
                        if(isMemberNumber) { returnedItem = found['Member Number'] } 
                        else { returnedItem = found['Monthly Premium'] }
                    }
                }
                return returnedItem
            }

            let existingContacts: any;
            function handleUpdate() {
                //create reffernce array to check for updates to Field Notes
                existingContacts = fieldNoteMainSheet.filter((currContact:any) => {
                    const currContactEmail = currContact['Email'] !== undefined ? currContact['Email'].toLowerCase() : 'No Curr Contact Email'
                    const currentItemEmail = currentItem['Email'] !== undefined ? currentItem['Email'].toLowerCase() : 'No Curr Item Email'
                    const currentContactPhones = [currContact['Cell Phone'] !== undefined ? currContact['Cell Phone'].replace(/[^a-zA-Z0-9]/g, ''): 'No Curr Contact Cell Phone']
                    
                    if ([currContact['Legal Plan #'], currContact['IDShield #'], currContact['CDLP #'],].indexOf(currentItem['Member Number']) > -1 || currContactEmail === currentItemEmail || currentContactPhones.indexOf(currentItem['Cell Phone'].replace(/[^a-zA-Z0-9]/g, '')) > -1)   {
                        return true
                    } else {
                        for (let a = 0; a < dupeArray.length; a++) {
                            if([currContact['Legal Plan #'], currContact['IDShield #'], currContact['CDLP #'],].indexOf(dupeArray[a]['Member Number']) > -1) {
                                return true
                            }
                        }
                        return false
                    }
                })
                if (existingContacts.length === 1) {updateCounter++ ; return true } 
                else if (existingContacts.length > 1) {
                    console.log(existingContacts); 
                    setMainSettings((prevMainSettings:any) => { // need to add this array to previous array
                        const tempCurrentItemEmail = currentItem['Email'] !== undefined ? currentItem['Email'].toLowerCase() : 'No Curr Item Email'
                        const tempCurrentItemPhone = currentItem['Cell Phone'].replace(/[^a-zA-Z0-9]/g, '')
                        const dupeArrayMemberNums = dupeArray.map((currentDupedobj: any) => { return { 'Member Number': currentDupedobj['Member Number'] } }) // MIGHT BE USELESS

                        const tempArr = existingContacts.map((currentObj: any) => {
                            const keys = ['Email', 'Cell Phone', 'Legal Plan #', 'IDShield #', 'CDLP #']
                            const memberNumberCheck = new Set (['Legal Plan #', 'IDShield #', 'CDLP #'])

                            // convert data to key usable data
                            currentObj['Email'] = currentObj['Email'] !== undefined ?  currentObj['Email'].toLowerCase() : 'No Curr Contact Email'
                            currentObj['Cell Phone'] = currentObj['Cell Phone'] !== undefined ? currentObj['Cell Phone'].replace(/[^a-zA-Z0-9]/g, '') : 'No Curr Contact Cell Phone'
                            

                            // combined name
                            const combinedCurrItemName = currentItem['First Name'].concat(' ',currentItem['Last Name']); const combinedCurrObjName = currentObj['First Name (0r) Group Account Name'].concat(' ', currentObj['Last Name'])

                            for (const key of keys) {
                                if (memberNumberCheck.has(key)) { 
                                    if (currentObj[key] === currentItem['Member Number'] || dupeArrayMemberNums.includes(currentObj[key])) {
                                        return { orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key }
                                    }
                                } else if (key === 'Email') {
                                    if (currentObj[key] === tempCurrentItemEmail) {
                                        return { orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key }
                                    }
                                } else if (key === 'Cell Phone') {
                                    if (currentObj[key] === tempCurrentItemPhone) {
                                        return { orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key }
                                    }
                                }
                            }
                            
                        })


                        const newArr = prevMainSettings.exisitingDupesFound.concat(tempArr)
                        return {
                            ...prevMainSettings,
                            exisitingDupesFound: newArr
                        }
                    })
                    return false 
                } 
                else { return false }
            }

            /* new system for binding the headers to each other */ // fix first anme
            let dataValues = { 
                /* Legal Shield Sheet Values */
                'Legal Plan #': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? '' : currentItem['Plan Description'].toLowerCase().includes('business') ? '' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Legal Shield', true) : '' ),
                    inUse: false
                },
                'IDShield #': {
                    value: (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Member Number']: dupeArray.length !== 0 ? findPlan('IDShield', true) :  ''),
                    inUse: false
                },
                'CDLP #': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Commercial', true) : ''),
                    inUse: false
                },
                'Small Buisness Plan #': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('business') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Buisness', true) : ''),
                    inUse: false
                },
                'First Name': {
                    value: (nameFixer(currentItem['First Name'])), // FORCED ERROR HERE
                    inUse: false
                },
                'Last Name': {
                    value: (nameFixer(currentItem['Last Name'])),
                    inUse: false
                },
                'Address 1': {
                    value: currentItem['Address 1'],
                    inUse: false
                },
                'Address 2': {
                    value: currentItem['Address 2'],
                    inUse: false
                },
                'Address 3': {
                    value: currentItem['Address 3'],
                    inUse: false
                },
                'Country': {
                    value: currentItem['Country'],
                    inUse: false
                },
                'City': {
                    value: currentItem['City'],
                    inUse: false
                },
                'State/Province': {
                    value: currentItem['State/Province'],
                    inUse: false
                },
                'Zip/Postal Code': {
                    value: currentItem['Zip/Postal Code'],
                    inUse: false
                },
                'Email': {
                    value: currentItem['Email'].toLowerCase(),
                    inUse: false
                },
                'Home Phone': {
                    value: currentItem['Home Phone'],
                    inUse: false
                },
                'Day Phone': {
                    value: currentItem['Day Phone'],
                    inUse: false
                },
                'Cell Phone': {
                    value: currentItem['Cell Phone'],
                    inUse: false
                },
                'Annual Premium': {
                    value: currentItem['Annual Premium'],
                    inUse: false
                },
                'Date of Birth': {
                    value: (currentItem['Date of Birth']),
                    inUse: false
                },
                'Legal Shield Monthly Rate': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? '' : currentItem['Plan Description'].toLowerCase().includes('business') ? '' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Legal Shield', false) : ''  ),
                    inUse: false
                },
                'IDShield Monthly Rate': {
                    value: (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('IDShield', false) : ''),
                    inUse: false
                },
                'CDLP Monthly Rate': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Commercial', false) : ''),
                    inUse: false
                },
                'Small Biz Monthly Rate': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('business') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Buisness', false) : ''),
                    inUse: false
                },
                'Plans Offered/Chosen': {
                    value: filteredPlanDescription,
                    inUse: false
                },
                'Pay Period': {
                    value: currentItem['Pay Period'],
                    inUse: false
                },
                'Pay Period Amount': {
                    value: currentItem['Pay Period Amount'],
                    inUse: false
                },
                'Group Division': {
                    value: currentItem['Group Division'],
                    inUse: false
                },
                'Employee ID': {
                    value: currentItem['Employee ID'],
                    inUse: false
                },
                'Production Date': {
                    value: (currentItem['Production Date']),
                    inUse: false
                },
                'Effective Date': {
                    value: (currentItem['Effective Date']),
                    inUse: false
                },
                'Cancel Date': {
                    value: (currentItem['Cancel Date']),
                    inUse: false
                },
                'Last Plan Amount Update': {
                    value: (currentItem['Last Plan Amount Update']),
                    inUse: false
                },
                'Pre-Cancel': {
                    value: currentItem['Pre-Cancel'],
                    inUse: false
                },
                'Pending IDT': {
                    value: currentItem['Pending IDT'],
                    inUse: false
                },
                'Status': {
                    value: currentItem['Status'],
                    inUse: false
                },
                /* Extra Values From Inputs */
                'Referral Source': {
                    value: mainSettings.refferalSource.value,
                    inUse: false
                },
                'Language': {
                    value: (filteredPlanDescription.toLowerCase().includes('spanish')? 'Spanish' : mainSettings.language.value),
                    inUse: false
                },
                'Group #': {
                    value: mainSettings.groupNumber,
                    inUse: false
                },
                'Company': {
                    value: mainSettings.company,
                    inUse: false
                },
                'Spheres': {
                    value: filteredSpheres,
                    inUse: false
                }
            }

            let currentUserObject = {
                /* handle and add update data on intialize */
                ...(handleUpdate() && existingContacts[0])
            }
            /*
                - on below function if doesn't have a correct key. return error and FORCE modal open
                - how to display collums not currently being used 
            */

            const failedMappings: any = []
            Object.keys(userSettings.excelHeaders).forEach(function(key: any) { // loop through user settings
                /* Loop and on each key add each key to above object */ // ADD ERROR DETECTION HERE
                if(!dataValues[userSettings.excelHeaders[key] as keyof typeof dataValues]) {
                    failedMappings.push(`${key} - ${userSettings.excelHeaders[key]}`)
                }
                
                dataValues = { // declare a variable is being used
                    ...dataValues,
                    [userSettings.excelHeaders[key] as keyof typeof dataValues]: { 
                        ...dataValues[userSettings.excelHeaders[key] as keyof typeof dataValues],
                        inUse: true
                    }
                }
                currentUserObject = {
                    ...currentUserObject,
                    [key]: dataValues[userSettings.excelHeaders[key] as keyof typeof dataValues].value
                }
            })
            setMainSettings((prevMainSettings: any) => { // this WORKS!!!!
                const unusedKeysArr: any = []
                Object.keys(dataValues).forEach(function(currentDataValueKey: any) {
                    if (!dataValues[currentDataValueKey as keyof typeof dataValues].inUse) {
                        unusedKeysArr.push(currentDataValueKey)
                    }
                })

                return {
                    ...prevMainSettings,
                    unusedCollumsLegalShield: unusedKeysArr,
                    failedMappings: failedMappings
                }
            })
            
            filterdSheet.push(currentUserObject)
            // console.log(mainSettings.unusedCollumsLegalShield)

            /* remove next item if duplicate detected */
            if (dupeArray.length !== 0 ) { for (let spliceI = 0; spliceI < dupeArray.length; spliceI++) {
                objectMainSheet.splice(objectMainSheet.findIndex((item: any) => { return item['Member Number'].toString() === dupeArray[spliceI]['Member Number'] }), 1 )
            }}
        }
        /* Move sheet to state*/
        setMainSettings((prevMainSettings:any) => {
            console.log(prevMainSettings.exisitingDupesFound)
            if (userSettings.settings?.openLogAfterConvert !== false || prevMainSettings.exisitingDupesFound.length > 0 || prevMainSettings.failedMappings.length > 0) {
                console.log('if ran')
                setIsOpen(true)
            }
            return {
                ...prevMainSettings,
                convertedSheet: filterdSheet,
                dupeCounter: dupeCounter,
                updateCounter: updateCounter,
                hasStateUpdated: false
            }
        })
    }

  function downloadSheet() {
    const sheetHeaders = Object.keys(userSettings.excelHeaders).map((key: any) => key)
    const newWS = XLSX.utils.json_to_sheet(mainSettings.convertedSheet, { header: sheetHeaders })
    const newWB = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWB, newWS, "NewDownload" )
    XLSX.writeFile(newWB, buildDownloadFileName(mainSettings.company, userSettings.settings))
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
            <div className={`flex items-center justify-center w-screen h-screen ${pageGradientStyles} font-[family-name:var(--font-geist-sans)]`}>
                <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings} userSettings={userSettings}/>
                <form onSubmit={handleSubmit} className={`${panelStyles} p-8 flex flex-col gap-6 w-[min(42rem,90vw)]`}>
                    <div className=''>
                        <h1 className='text-5xl text-center text-[#EDF1FB]'>Enter Password</h1>
                    </div>
                    <div className='flex flex-row gap-4 items-center'>
                        <input
                            className='bg-[#000C47] border-2 border-[#0B3FB6] p-2 px-8 focus:outline-hidden outline-none w-full rounded-xl text-3xl text-center font-bold text-[#EDF1FB]'
                            type='password'
                            onChange={handlePassInputChange}
                            value={passInput}
                        >
                        </input>
                        <button onClick={handleSubmit} className={`${techButtonStyles} w-fit`}>Submit</button>
                    </div>
                </form>
            </div>
        :
        <div  className={`${isOpen === true ? 'blur-sm': ''} min-h-screen flex flex-col flex-1 ${pageGradientStyles} font-[family-name:var(--font-geist-sans)]`}>
        {/* Main View */}    
            <nav id='Nav' className="mx-4 mt-4 flex flex-row items-stretch gap-2">
                <div className={`${panelStyles} flex flex-1 items-center px-6 py-4 min-w-0`}>
                    <h1 className='text-4xl text-[#EDF1FB]'>Simple Excel Conversion</h1>
                </div>
                <div className='relative overflow-visible shrink-0 self-stretch' ref={userMenuRef}>
                    <button
                        type="button"
                        className={`${panelStyles} h-full px-6 text-xl text-[#EDF1FB] hover:bg-[#093390] cursor-pointer flex items-center justify-center whitespace-nowrap`}
                        onClick={handleNavIsOpen}
                    >{userButtonText}</button>
                    {  !navIsOpen ? null
                    : 
                        <div className={`absolute top-full mt-2 right-0 z-20 ${panelStyles} flex flex-col text-[#EDF1FB] font-[family-name:var(--font-geist-sans)] ${settingsInDropdown ? 'p-8 min-w-[24rem] w-[min(32rem,calc(100vw-2rem))]' : signOutConfirmIsOpen ? 'p-8 min-w-[22rem] w-[min(28rem,calc(100vw-2rem))]' : 'p-2 min-w-full'}`}>
                            {settingsInDropdown ?
                                <SettingsModal
                                    settings={userSettings.settings}
                                    onSave={(settings) => {
                                        persistUserSettings(userSettings.user, settings)
                                        setUserSettings((prevUserSettings: any) => ({ ...prevUserSettings, settings }))
                                        closeUserDropdown()
                                    }}
                                />
                            : signOutConfirmIsOpen ?
                                <SignOutConfirm
                                    onCancel={closeUserDropdown}
                                    onConfirm={handleSignOut}
                                />
                            :
                                <>
                                    <button className='text-xl px-4 py-3 rounded-xl hover:bg-[#093390] text-left whitespace-nowrap cursor-pointer' onClick={handleOpenSettings}>Settings</button>
                                    <button className='text-xl px-4 py-3 rounded-xl hover:bg-[#093390] text-left whitespace-nowrap cursor-pointer' onClick={requestSignOut}>Sign Out</button>
                                </>
                            }
                        </div>
                    }
                </div>
            </nav>
            <div id='Body' className='min-w-[50%] flex-1 px-4 py-4'>
                <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings} userSettings={userSettings}/>
                <div className={`${panelStyles} p-6 min-h-[25%] min-w-[55%] justify-self-center mx-auto ${mainSettings.sheetName === '' || mainSettings.fieldNoteSheetName === '' ? 'content-center' : ''}`}>
                    <FileImporter defaultMainSettings={defaultMainSettings} mainSettings={mainSettings} setMainSettings={setMainSettings} workbook={workbook} setWorkbook={setWorkbook} fielfieldNoteSheet={fieldNoteSheet} setFieldNoteSheet={setFieldNoteSheet} userSettings={userSettings}/>
        
                    { mainSettings.sheetName != '' || mainSettings.fieldNoteSheetName != '' ? 
                    <div className={` ${ mainSettings.convertedSheet !== undefined ? 'justify-between px-[9%]' : 'justify-center' } flex flex-row mt-6 gap-4`} >
                        {mainSettings.sheetName !== '' ?
                            tempToolTipConvert.length > 0 ? 
                                <div  className='justify-center' data-tooltip={`Missing: ${toolTipConvert}`} >
                                    <button disabled={true} className={`${disabledTechButtonStyles} self-center mx-auto`} onClick={convertSheet}>Convert</button>
                                </div>
                                : <button onClick={convertSheet} className={`${techButtonStyles}`}>Convert</button>
                            :null
                        }
                        {mainSettings.convertedSheet !== undefined ?
                            !mainSettings.hasStateUpdated ? 
                            <button onClick={downloadSheet} className={`${techButtonStyles}`}>Download</button>
                                :<div data-tooltip={`Something has changed re convert the file`}> <button disabled={true} className={`${disabledTechButtonStyles}`} >Re Convert</button> </div>
                            :null
                        }
                        {mainSettings.convertedSheet !== undefined?
                            <button onClick={() => setIsOpen(true)} className={`${techButtonStyles}`}>Check Log</button>
                            : null
                        }
                    </div>
                    : null                        
                    }
                </div>
            </div>
            <footer id='Footer' className={`mx-4 mb-4 ${panelStyles} px-6 py-4 flex flex-row justify-between`}>
                <h1 className='text-xl self-center text-left'>Created by <a className={`rounded-xl hover:bg-[#093390] p-1 text-xl`} target="_blank" rel="noopener noreferrer" href='https://www.linkedin.com/in/brandonbutkovich/'>Zu0s</a></h1>      
                <div className='flex flex-row'>
                    <button className={`${techButtonStyles} border-none w-fit text-xl`} onClick={handleSupport}>{ userSettings.settingIsOpen ? <p data-tooltip={`Title with Support and your name`}>brandon.butk@gmail.com</p> : 'Support'}</button> 
                    <h1 className='text-xl self-center place-self-end text-right ml-4'>V 1.02.02</h1>
                </div>
            </footer>
        </div>  
        }
        </>
    );
}
