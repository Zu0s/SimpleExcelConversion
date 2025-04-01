'use client'

import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import FileImporter from './components/FileImporter';
import { referralSourceOptions, shittyDb, spheresOptions } from './keys';
import { buttonStyles } from './groupedStyles';

import * as XLSX from 'xlsx'

const defaultMainSettings:object = {
  sheetName: '',
  fieldNoteSheetName: '',
  language: { value: 'English', label: 'English' }, // select - single
  groupNumber: '', // text
  company: '', // text
  spheres: [], // select - multiple
  refferalSource: '', // select - single
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

    /* Handles Password */
    const [passInput, setPassInput] = useState<string>('')

    /* Website check if user has a password */
    const [userSettings, setUserSettings]: any = useState({ 
        password: '', 
        user: '',
    })

    function handlePassInputChange(e: any){
        const {value} = e.target
        setPassInput(() => (value))
    }

    function checkPass(inputPass: string) {
        const foundUser = shittyDb.users.find((currentUser) => (inputPass === currentUser.password))
        if (foundUser) {
            setUserSettings((prevUserSettings: any) => {

                return ({ // allow access
                    ...shittyDb[foundUser.user],
                    password: foundUser.password,
                    user: foundUser.user,
                })
            })
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
        // turn original sheet into Object
        const objectMainSheet: any = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]] , {raw: false})
        const fieldNoteMainSheet: any = XLSX.utils.sheet_to_json(fieldNoteSheet.Sheets[fieldNoteSheet.SheetNames[0]], {raw: false})
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
                        if(obj[key] === '(000) 000-0000') { obj[key] = ' ' }
                        else {
                            obj[key] = obj[key].replace('(', '').replace(')', '').replace('-', ' ')
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
                let returnedItem = ' ';
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
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? ' ' : currentItem['Plan Description'].toLowerCase().includes('business') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Legal Shield', true) : '' ),
                    inUse: false
                },
                'IDShield #': {
                    value: (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Member Number']: dupeArray.length !== 0 ? findPlan('IDShield', true) :  ' '),
                    inUse: false
                },
                'CDLP #': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Commercial', true) : ' '),
                    inUse: false
                },
                'Small Buisness Plan #': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('business') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Buisness', true) : ''),
                    inUse: false
                },
                'First Name FAIL HERE': {
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
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? ' ' : currentItem['Plan Description'].toLowerCase().includes('business') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Legal Shield', false) : ''  ),
                    inUse: false
                },
                'IDShield Monthly Rate': {
                    value: (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('IDShield', false) : ' '),
                    inUse: false
                },
                'CDLP Monthly Rate': {
                    value: (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Commercial', false) : ' '),
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
            Object.keys(userSettings.testExcelHeaders).forEach(function(key: any) { // loop through user settings
                /* Loop and on each key add each key to above object */ // ADD ERROR DETECTION HERE
                if(!dataValues[userSettings.testExcelHeaders[key] as keyof typeof dataValues]) {
                    failedMappings.push(`${key} - ${userSettings.testExcelHeaders[key]}`)
                }
                
                dataValues = { // declare a variable is being used
                    ...dataValues,
                    [userSettings.testExcelHeaders[key] as keyof typeof dataValues]: { 
                        ...dataValues[userSettings.testExcelHeaders[key] as keyof typeof dataValues],
                        inUse: true
                    }
                }
                currentUserObject = {
                    ...currentUserObject,
                    [key]: dataValues[userSettings.testExcelHeaders[key] as keyof typeof dataValues].value
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

            /* New JSON Object */
            // filterdSheet.push({
            //     ...(handleUpdate() && existingContacts[0]),
            //     'Legal Plan #': (currentItem['Plan Description'].toLowerCase().includes('commercial') ? ' ' : currentItem['Plan Description'].toLowerCase().includes('business') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Legal Shield', true) : '' ), 
            //     'IDShield #': (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Member Number']: dupeArray.length !== 0 ? findPlan('IDShield', true) :  ' '), 
            //     'CDLP #': (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Commercial', true) : ' '), 
            //     'Small Buisness Plan #': (currentItem['Plan Description'].toLowerCase().includes('business') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Buisness', true) : ''), 
            //     'First Name (0r) Group Account Name': (nameFixer(currentItem['First Name'])),
            //     'Last Name': (nameFixer(currentItem['Last Name'])),
            //     'Address': currentItem['Address 1'],
            //     'Address 2': currentItem['Address 2'],
            //     'Address 3': currentItem['Address 3'],
            //     'Country': currentItem['Country'],
            //     'City': currentItem['City'],
            //     'State': currentItem['State/Province'],
            //     'Zip': currentItem['Zip/Postal Code'],
            //     'Email': currentItem['Email'].toLowerCase(),
            //     'Home Phone': currentItem['Home Phone'],
            //     'Day Phone': currentItem['Day Phone'],
            //     'Cell Phone': currentItem['Cell Phone'] ,
            //     'Birthday': (currentItem['Date of Birth']), 
            //     'Annual Premium': currentItem['Annual Premium'],
            //     'LegalShield Monthly Rate': (currentItem['Plan Description'].toLowerCase().includes('commercial') ? ' ' : currentItem['Plan Description'].toLowerCase().includes('business') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Legal Shield', false) : ''  ), 
            //     'IDShield Monthly Rate': (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('IDShield', false) : ' '), 
            //     'CDLP Monthly Rate': (currentItem['Plan Description'].toLowerCase().includes('commercial') ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Commercial', false) : ' '), 
            //     'Small Biz Monthly Rate': (currentItem['Plan Description'].toLowerCase().includes('business') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Buisness', false) : ''), 
            //     'Plans Offered/Chosen' : filteredPlanDescription, 
            //     'Pay Periods': currentItem['Pay Period'],
            //     'Pay Period Amount': currentItem['Pay Period Amount'],
            //     'Group Division': currentItem['Group Division'],
            //     'Employee ID': currentItem['Employee ID'],
            //     'Production Date': (currentItem['Production Date']),
            //     'Effective Date': (currentItem['Effective Date']),
            //     'Cancel Date': (currentItem['Cancel Date']),
            //     'Last Plan Amount': (currentItem['Last Plan Amount Update']),
            //     'Pre-Cancel': currentItem['Pre-Cancel'],
            //     'Pending IDT': currentItem['Pending IDT'],
            //     'Status (pick one)': currentItem['Status'],
            //     'Referral Source (pick one)': mainSettings.refferalSource.value, 
            //     'Language': (filteredPlanDescription.toLowerCase().includes('spanish')? 'Spanish' : mainSettings.language.value), 
            //     'Group # ': mainSettings.groupNumber,
            //     'Company': mainSettings.company, 
            //     'Spheres': filteredSpheres, 
            //     'Contact Type': ' ' /* CHECK WITH Dad: CONFUSED */
            // })

            /* remove next item if duplicate detected */
            if (dupeArray.length !== 0 ) { for (let spliceI = 0; spliceI < dupeArray.length; spliceI++) {
                objectMainSheet.splice(objectMainSheet.findIndex((item: any) => { return item['Member Number'].toString() === dupeArray[spliceI]['Member Number'] }), 1 )
            }}
        }
        /* Move sheet to state*/
        setMainSettings((prevMainSettings:any) => {
            console.log(prevMainSettings.exisitingDupesFound)
            if (prevMainSettings.exisitingDupesFound.length > 0 || prevMainSettings.failedMappings.length > 0) {
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

        // console.log('----- Convert Log -----')
        // console.log(`Duplicates: ${dupeCounter}`)
        // console.log(`Updates: ${updateCounter}`)
        // console.log(filterdSheet) // REMOVE FOR LIVE PUSH
    }

  function downloadSheet() {
    const sheetHeaders = Object.keys(userSettings.testExcelHeaders).map((key: any) => key)
    const newWS = XLSX.utils.json_to_sheet(mainSettings.convertedSheet, { header: sheetHeaders })
    const newWB = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWB, newWS, "NewDownload" )
    XLSX.writeFile(newWB, `simpleExcelConvertDownload.xlsx`)
  }


    // function checkState() {
    //     console.log(userSettings)
    //     console.log(shittyDb)
    //     console.log(userSettings.excelHeaders)
    // }

  /* Handles Toop Tip Text */
  let toolTipConvert = ''
  const tempToolTipConvert = []
  if (mainSettings.groupNumber === '') {tempToolTipConvert.push('Group #')} if (mainSettings.company === '') { tempToolTipConvert.push('Company') } if (fieldNoteSheet === 'test2') { tempToolTipConvert.push('Field Note Sheet') }
  toolTipConvert = tempToolTipConvert.join(', ')

    return (
        <>
        { userSettings.password === '' ?
            <div className='grid grid-cols-3 grid-rows-3 items-center justify-center h-screen'>
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
        <div className={`${isOpen === true ? 'blur-sm': ''}`}>
        <div className='m-10'>
          <h1 className='text-6xl text-center'>Simple Excel Conversion</h1>
        </div>
    
        <div className='h-full'>
          <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings} userSettings={userSettings}/>
          <div>
            <FileImporter defaultMainSettings={defaultMainSettings} mainSettings={mainSettings} setMainSettings={setMainSettings} workbook={workbook} setWorkbook={setWorkbook} fielfieldNoteSheet={fieldNoteSheet} setFieldNoteSheet={setFieldNoteSheet} userSettings={userSettings}/>
    
            <div className='flex flex-row gap-4 mx-5 my-2 justify-evenly' >
              {mainSettings.sheetName !== '' ?
                  fieldNoteSheet === 'test2' || mainSettings.groupNumber === '' || mainSettings.company === '' ? 
                      <div data-tooltip={`Missing: ${toolTipConvert}`} >
                          <button disabled={true} className={` ${buttonStyles} text-[#b23800] pointer-events-none cursor-not-allowed text-5xl`} onClick={convertSheet}>Convert</button>
                      </div>
                      : <button onClick={convertSheet} className={`${buttonStyles}  hover:bg-[#292524]`}>Convert</button>
                  :null
              }
              {mainSettings.convertedSheet !== undefined ?
                  !mainSettings.hasStateUpdated ? 
                  <button onClick={downloadSheet} className={`${buttonStyles}`}>Download</button>
                      :<div data-tooltip={`Something has changed re convert the file`}> <button disabled={true} className={`${buttonStyles} cursor-not-allowed text-[#b23800] pointer-events-none`} >Re Convert</button> </div>
                  :null
              }
              {mainSettings.convertedSheet !== undefined?
                  <button onClick={() => setIsOpen(true)} className={`${buttonStyles}`}>Check Log</button>
                  : null
              }
            </div>
    
            {/* <button onClick={checkState}>Random Testing</button>  */}
          </div>
        </div>
        </div>    
        }
        </>
    );
}
