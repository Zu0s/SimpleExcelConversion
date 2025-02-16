'use client'

import { useState } from 'react';
import Image from 'next/image';
import Modal from './components/Modal';
import FileImporter from './components/FileImporter';
import { completedPlanHeaders } from './keys';

import * as XLSX from 'xlsx'

const defaultMainSettings:object = {
  sheetName: '',
  fieldNoteSheetName: '',
  language: { value: 'English', label: 'English' }, // select - single
  groupNumber: '', // text
  company: '', // text
  spheres: [], // select - multiple
  refferalSource: '', // select - single
  exisitingDupesFound: [],
  convertedSheet: undefined,
  dupeCounter: 0,
  updateCounter: 0,
  hasStateUpdated: false
}

export default function Home() {
  const [mainSettings, setMainSettings]:any = useState(defaultMainSettings);
  //main sheet from user
  const [workbook, setWorkbook]:any = useState('test');
  //field note sheet
  const [fieldNoteSheet, setFieldNoteSheet]:any = useState('test2');

  function checkState() {
    //gonna use this for testing options
    let excelSheetToObject = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
    console.log('Checking Legal Shield excel sheet object below:')
    console.log(excelSheetToObject)
    console.log('-----')
    console.log('Checking Field Note excel sheet object below')
    // console.log(fieldNoteSheet)
    let fieldNoteSheetToObject = XLSX.utils.sheet_to_json(fieldNoteSheet.Sheets[fieldNoteSheet.SheetNames[0]])
    console.log(fieldNoteSheetToObject)
    console.log(fieldNoteSheet)
  }

  /* Handle Sheet Functions */

  function convertSheet() {
    // turn original sheet into Object
    const objectMainSheet: any = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]] , {raw: false})
    const fieldNoteMainSheet: any = XLSX.utils.sheet_to_json(fieldNoteSheet.Sheets[fieldNoteSheet.SheetNames[0]], {raw: false})
    let dupeCounter = 0; let updateCounter = 0;

    // Scuffed .map()
    let filterdSheet = []
    for (let i = 0; i < objectMainSheet.length; i ++) {
        let currentItem: any = objectMainSheet[i]
        
        //Removes spaces, Phone number logic
        function removeSpacesAndNumbers(obj: any) { // CHANGE PHONE NUMBER LOGIC - more consistent and less janky
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

        function nameFixer(currentName: any) {
            let nameArr = currentName.toLowerCase().split(' ')
            //remove middle initial
            if (nameArr.length > 1) { nameArr.splice(0, nameArr.length, ...nameArr.filter((currName:any) => currName.length > 1)) }

            //capitalizes names
            for (let nameI = 0; nameI < nameArr.length ; nameI ++) { nameArr[nameI] = nameArr[nameI].charAt(0).toUpperCase() + nameArr[nameI].substring(1) }
            return nameArr.join(' ')
        }

        //Check Duplicates
        let dupeArray: any[] = []
        for(let tempI = i + 1; objectMainSheet[tempI] !== undefined && nameFixer(currentItem['First Name']) === nameFixer(objectMainSheet[tempI]['First Name']) && nameFixer(currentItem['Last Name']) === nameFixer(objectMainSheet[tempI]['Last Name']) && currentItem['Email'].toLowerCase() === objectMainSheet[tempI]['Email'].toLowerCase() ; tempI ++) {
            let currentObject = objectMainSheet[tempI]; 
            removeSpacesAndNumbers(currentObject)
            dupeCounter++
            dupeArray.push(currentObject)
        }
        removeSpacesAndNumbers(currentItem)

        // Logic for Plan Description Stiching
        let filteredPlanDescription = currentItem['Plan Description']
        if(dupeArray.length !== 0) {
            let planDescriptionArray = dupeArray.map(currentPlan => { return currentPlan['Plan Description'] })
            let filteredArr = planDescriptionArray.reduce((r, a) => r.concat(a, ' | '), [])
            if (filteredArr[filteredArr.length -1 ] = ' | ') { filteredArr.splice(filteredArr.length - 1, 1) }
            
            filteredPlanDescription = `${currentItem['Plan Description']} | ${filteredArr.join('')}`.replace('+', '|')
        }

        //spheres logic
        let filteredSpheres = ' '
        if (mainSettings.spheres.length > 0) {
            let spheresArray = mainSettings.spheres.map((currentItem: any) => currentItem.value)
            let filteredArr = spheresArray.reduce((r:any, a: any) => r.concat(a, ' | '), [])
            if (filteredArr[filteredArr.length -1 ] = ' | ') { filteredArr.splice(filteredArr.length - 1, 1) }
            filteredSpheres = filteredArr.join('')
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
            }
            return returnedItem
        }

        let existingContacts: any;
        let existingContactFound = false;
        function handleUpdate() {
            //create reffernce array to check for updates to Field Notes
            existingContacts = fieldNoteMainSheet.filter((currContact:any) => {
                let currContactEmail = currContact['Email'] !== undefined ? currContact['Email'].toLowerCase() : 'No Curr Contact Email'
                let currentItemEmail = currentItem['Email'] !== undefined ? currentItem['Email'].toLowerCase() : 'No Curr Item Email'
                let currentContactPhones = [currContact['Cell Phone'] !== undefined ? currContact['Cell Phone'].replace(/[^a-zA-Z0-9]/g, ''): 'No Curr Contact Cell Phone']

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
            if (existingContacts.length === 1) { updateCounter++ ; return true } 
            else if (existingContacts.length > 1) {
                console.log(existingContacts); 
                // alert(`more than one duplicated located in Field Notes: ${currentItem['First Name']} ${currentItem['Last Name']}`) ;  // CHANGES THIS TO BE A MODAL NOTE ALERT SO CODE DOESNT STOP
                existingContactFound = true
                return false 
            } 
            else { return false }
        }


        /* New JSON Object */
        filterdSheet.push({
            ...(handleUpdate() && existingContacts[0]),
            'Legal Plan #': (currentItem['Plan Description'].includes('COMMERCIAL') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Legal Shield', true) : '' ), 
            'IDShield #': (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Member Number']: dupeArray.length !== 0 ? findPlan('IDShield', true) :  ' '), 
            'CDLP #': (currentItem['Plan Description'].includes('COMMERCIAL') ? currentItem['Member Number'] : dupeArray.length !== 0 ? findPlan('Commercial', true) : ' '), 
            'Small Buisness Plan #': ' ', 
            'First Name (0r) Group Account Name': (nameFixer(currentItem['First Name'])),
            'Last Name': (nameFixer(currentItem['Last Name'])),
            'Address': currentItem['Address 1'],
            'Address 2': currentItem['Address 2'],
            'Address 3': currentItem['Address 3'],
            'Country': currentItem['Country'],
            'City': currentItem['City'],
            'State': currentItem['State/Province'],
            'Zip': currentItem['Zip/Postal Code'],
            'Email': currentItem['Email'].toLowerCase(),
            'Home Phone': currentItem['Home Phone'],
            'Day Phone': currentItem['Day Phone'],
            'Cell Phone': currentItem['Cell Phone'] ,
            'Birthday': (currentItem['Date of Birth']), 
            'Annual Premium': currentItem['Annual Premium'],
            'LegalShield Monthly Rate': (currentItem['Plan Description'].includes('COMMERCIAL') ? ' ' : Array.from( currentItem['Member Number'] )[0] === '1' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Legal Shield', false) : ''  ), 
            'IDShield Monthly Rate': (Array.from( currentItem['Member Number'] )[0] === '7' ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('IDShield', false) : ' '), 
            'CDLP Monthly Rate': (currentItem['Plan Description'].includes('COMMERCIAL') ? currentItem['Monthly Premium'] : dupeArray.length !== 0 ? findPlan('Commercial', false) : ' '), 
            'Small Biz Monthly Rate': ' ', 
            'Plans Offered/Chosen' : filteredPlanDescription, 
            'Pay Periods': currentItem['Pay Period'],
            'Pay Period Amount': currentItem['Pay Period Amount'],
            'Group Division': currentItem['Group Division'],
            'Employee ID': currentItem['Employee ID'],
            'Production Date': (currentItem['Production Date']),
            'Effective Date': (currentItem['Effective Date']),
            'Cancel Date': (currentItem['Cancel Date']),
            'Last Plan Amount': (currentItem['Last Plan Amount Update']),
            'Pre-Cancel': currentItem['Pre-Cancel'],
            'Pending IDT': currentItem['Pending IDT'],
            'Status (pick one)': currentItem['Status'],
            'Referral Source (pick one)': mainSettings.refferalSource.value, 
            'Language': (filteredPlanDescription.toLowerCase().includes('spanish')? 'Spanish' : mainSettings.language.value), 
            'Group # ': mainSettings.groupNumber,
            'Company': mainSettings.company, 
            'Spheres': filteredSpheres, 
            'Contact Type': ' ' /* CHECK WITH Dad: CONFUSED */
        })

        /* remove next item if duplicate detected */
        if (dupeArray.length !== 0 ) { for (let spliceI = 0; spliceI < dupeArray.length; spliceI++) {
            objectMainSheet.splice(objectMainSheet.findIndex((item: any) => { return item['Member Number'].toString() === dupeArray[spliceI]['Member Number'] }), 1 )
        }}
    }
    /* Move sheet to state*/
    setMainSettings((prevMainSettings:any) => {
        return {
            ...prevMainSettings,
            convertedSheet: filterdSheet,
            dupeCounter: dupeCounter,
            updateCounter: updateCounter,
            hasStateUpdated: false
        }
    })
    console.log('----- Convert Log -----') 
    console.log(`Duplicates: ${dupeCounter}`)
    console.log(`Updates: ${updateCounter}`)
    // console.log(filterdSheet) // REMOVE FOR LIVE PUSH
  }

  function downloadSheet() {
    let newWS = XLSX.utils.json_to_sheet(mainSettings.convertedSheet, { header: completedPlanHeaders })
    let newWB = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(newWB, newWS, "NewDownload" )
    XLSX.writeFile(newWB, `simpleExcelConvertDownload.xlsx`)
  }

  /* Handle Modal */
  let [isOpen, setIsOpen] = useState(false)
  function modalOpen() { setIsOpen(true) }

  let toolTipConvert = ''
  let tempToolTipConvert = []
  if (mainSettings.groupNumber === '') {tempToolTipConvert.push('Group #')} if (mainSettings.company === '') { tempToolTipConvert.push('Company') } if (fieldNoteSheet === 'test2') { tempToolTipConvert.push('Field Note Sheet') }
  toolTipConvert = tempToolTipConvert.join(', ')
  return (
    <>
    <div className='m-10'>
      <h1>Simple Excel Conversion</h1>
    </div>

    <div className='h-full'>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} mainSettings={mainSettings}/>
      <div>
        <FileImporter defaultMainSettings={defaultMainSettings} mainSettings={mainSettings} setMainSettings={setMainSettings} workbook={workbook} setWorkbook={setWorkbook} fielfieldNoteSheet={fieldNoteSheet} setFieldNoteSheet={setFieldNoteSheet}/>

        <div className='flex flex-row gap-4' >
          {mainSettings.sheetName !== '' ?
              fieldNoteSheet === 'test2' || mainSettings.groupNumber === '' || mainSettings.company === '' ? 
                  <div data-tooltip={`Missing: ${toolTipConvert}`} >
                      <button disabled={true} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" onClick={convertSheet}>Convert</button>
                  </div>
                  : <button onClick={convertSheet} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Convert</button>
              :null
          }
          {mainSettings.convertedSheet !== undefined ?
              !mainSettings.hasStateUpdated ? 
              <button onClick={downloadSheet} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Download</button>
                  :<div data-tooltip={`Something has changed re convert the file`}> <button disabled={true} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" >Re Convert</button> </div>
              :null
          }
          {mainSettings.convertedSheet !== undefined?
              <button onClick={() => setIsOpen(true)} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Check Log</button>
              : null
          }
        </div>

        {/* <button onClick={checkState}>Random Testing</button>  */}
      </div>
    </div>
    </>
  );
}
