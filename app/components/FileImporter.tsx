import { useState } from 'react';
import { referralSourceOptions, spheresOptions } from '../keys'
import Select from 'react-select';
import * as XLSX from 'xlsx';

export default function FileImporter(props: any) {
    const [isDragging, setIsDragging] = useState(false)

    async function handleMainFileChange(e: any) {
        // console.log('main select file ran')
        e.preventDefault()  
        if (e.target.files.length > 0) {
            const file = e.target.files[0]
            const data = await file.arrayBuffer()
            const newWb = XLSX.read(data, {dense: true})

            props.setWorkbook(newWb)

            props.setMainSettings((prevState: any) => {
                return {
                    ...prevState,
                    hasStateUpdated: true,
                    sheetName: file.name
                }
            })
            return e.target.value = ''
        } else {
            return e.target.value = ''
        } 
    }

    async function handleFieldNoteFileChange(e: any) {
        e.preventDefault()
        if (e.target.files.length > 0) {
            const file = e.target.files[0]
            const data = await file.arrayBuffer()
            const newWb = XLSX.read(data, {dense: true})
            props.setFieldNoteSheet(newWb)


            props.setMainSettings((prevState: any) => {
                return {
                    ...prevState,
                    hasStateUpdated: true,
                    fieldNoteSheetName: file.name
                }
            })
            return e.target.value = ''
        } else {
            return e.target.value = ''
        } 
    }

    const handleDragOver = (ev: any) => {
        ev.preventDefault()
    };

    const handleDragEnter = (ev: any) => {
        console.log('user is in the box')
        if (isDragging === true) {
            return
        } else {
            return setIsDragging(true)
        }
    }

    const handleDragLeave = () => {
        console.log('User Left')
        setIsDragging(false)
    }

    /* 
        !!!!!!  FIND A WAY TO REMOVE THE CURRENT WORKBOOK IN THIS !!!!!!
    */
    const handleRemoveFile = () => {
        props.setWorkbook('test')
        props.setFieldNoteSheet('test2')
        return props.setMainSettings(props.defaultMainSettings)
    }

    /* Select onChange */ 
    function handleSelectChange (value: any, actionMeta: any) {
        props.setMainSettings((prevSettings: any) => {
            return {
            ...prevSettings,
            hasStateUpdated: true,
            [actionMeta.name]: value
            }
        })
    }

    /* Text onChange */
    function handleInputChange(e: any){
        const {name, value} = e.target
        props.setMainSettings((prevSettings: any) => ({
          ...prevSettings,
          hasStateUpdated: true,
          [name]: value
        }))
    }

    return(
        <div 
            className='flex flex-col border-2 min-h-full w-full p-4 rounded-sm'
            id='file-importer--main'
            onDragEnter={handleDragEnter}    
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >   
            {props.mainSettings.sheetName !== '' ?
                    <div className='modification-box'>
                        <p className='modification-title'>Modifications</p>
                        <label className='modification-subTitle'>Group # </label>
                        <input 
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className='modification-text'
                            type='number'
                            name='groupNumber'
                            onChange={handleInputChange}
                            value={props.mainSettings.groupNumber}
                            ></input>
                        <br/>
                        <label className='modification-subTitle'>Company </label>
                        <input 
                            className='modification-text'
                            type='text'
                            name='company'
                            onChange={handleInputChange}
                            value={props.mainSettings.company}
                            ></input>
                        <br/>
                        <label className='modification-subTitle'>Language - (Pick One) </label>
                        <Select
                            name='language'
                            defaultValue={{ value: 'English', label: 'English' }}
                            options={[{ value: 'English', label: 'English' }, { value: 'Spanish', label: 'Spanish' }]}
                            value={props.mainSettings.language}
                            onChange={handleSelectChange}
                       />
                        <br />
                        <label className='modification-subTitle'>Referal Source - (Pick One)</label>
                        <Select 
                            name='refferalSource'
                            options={referralSourceOptions}
                            value={props.mainSettings.refferalSource}
                            onChange={handleSelectChange}
                        />
                        <br />
                        <label className='modification-subTitle'>Spheres - (Multiple)</label>
                        <Select 
                            name='spheres'
                            isMulti
                            options={spheresOptions}
                            value={props.mainSettings.spheres}
                            onChange={handleSelectChange}
                        />
                        <br />
                    </div>
                :
                    <>
                        <p className={`file-importer--text ${isDragging === true ? 'allowChildDragging' : ''} text-5xl mt-3 `}>Select File Below</p>
                    </>
            }

            <label className={`${props.mainSettings.sheetName === '' ? 'border rounded-md p-2 mt-10 cursor-pointer'  : ''} self-center `} htmlFor='file-importer--input'>{` ${props.mainSettings.sheetName === '' ? "Select Files"  : props.mainSettings.sheetName} `}</label>

            {props.mainSettings.sheetName !== '' ?
                <button className='body-button' onClick={handleRemoveFile}>Remove</button>
                : undefined
            }
            
            <input
                className={`${isDragging === true ? 'allowChildDragging' : ''} `}
                id='file-importer--input'
                type='file'
                accept=''
                onChange={handleMainFileChange}
            >
            </input>
            <br/>
            <label className={`${props.mainSettings.fieldNoteSheetName === '' ? 'border rounded-md p-2 cursor-pointer'  : ''} self-center`}  htmlFor='fieldNote-importer'>{` ${props.mainSettings.fieldNoteSheetName === '' ? "Select Field Note File"  : props.mainSettings.fieldNoteSheetName} `}</label>
            <input
                className='file-picker'
                id='fieldNote-importer'
                type='file'
                accept=''
                onChange={handleFieldNoteFileChange}
            >
            </input>
        </div>
    )
}