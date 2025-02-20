import { useState } from 'react';
import { shittyDb } from '../keys'
import { buttonStyles } from '../groupedStyles';
import Select, { StylesConfig } from 'react-select';
import * as XLSX from 'xlsx';
import { ConsoleConstructorOptions } from 'console';

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

    const handleDragEnter = () => {
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

    /* Select Styles */
    const dot = (color:any = 'transparent') => ({
        alignItems: 'center',
        display: 'flex',
        ':before': {
            backgroundColor: color,
            borderRadius: 10,
            content: '" "',
            display: 'block',
            marginRight: 8,
            height: 10,
            width: 10,
        },
    })
    const selectStyles: StylesConfig<ConsoleConstructorOptions, true> = {
        control: (styles: any) => ({ ...styles, backgroundColor: '#1B1917', color: '#FF5100',border:0 ,boxShadow: 'none' ,borderBlockColor:'#292524', padding: '0.3rem'}),
        option: (styles: any, { isFocused, isSelected }) => { 

            return {
                ...styles,
                backgroundColor: isSelected 
                ? '#292524'
                : isFocused
                ? '#292524'
                : '#1B1917',
                color: '#FF5100',
            }
        },
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1B1917', color:'#FF5100'}),
        menu: (styles) => ({ ...styles, backgroundColor: '#1B1917'}),
        menuList: (styles) => ({
            ...styles,
           "::-webkit-scrollbar": { width: "9px" },
           "::-webkit-scrollbar-track": { background: '#292524' },
           "::-webkit-scrollbar-thumb": { background: '#FF5100' },
           "::-webkit-scrollbar-thumb:hover": { background: '#b23800' }
        }),
        indicatorSeparator: (styles) => ({ ...styles, backgroundColor: '#292524'}),
        input: (styles) => ({ ...styles, ...dot(), color: '#FF5100'}),
        placeholder: (styles) => ({ ...styles, ...dot(), color: '#FF5100' }),
        singleValue: (styles) => ({ ...styles, ...dot(), color: '#FF5100' }),
        dropdownIndicator: (styles: any) => ({ ...styles, color: '#706E6C' }),
        clearIndicator: (styles) => ({ ...styles, color: '#706E6C'}) ,
        multiValue: (styles) => ({ ...styles, color: '#FF5100', backgroundColor: '#292524' }),
        multiValueLabel: (styles) => ({ ...styles, color: '#FF5100' }),
        multiValueRemove: (styles) => ({ ...styles, color: '#FF5100', ':hover': { backgroundColor: '#7f2800', color: '#292524'}  }),
    }

    return(
        <div 
            className='flex flex-col border-8 border-[#706E6C] border-dashed bg-[#292524] min-h-full w-full p-6 rounded-md'
            id='file-importer--main'
            onDragEnter={handleDragEnter}    
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >   
            {props.mainSettings.sheetName !== '' ?
                    <div className='modification-box text-2xl px-5'>
                        <h1 className='text-3xl mb-4 border-b-2 border-bottom inline-block border-[#706E6C]'>Modifications</h1>
                        <br/>
                        <label className='modification-subTitle'>Group # </label>
                        <br/>
                        <input 
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className='bg-[#1B1917] p-2 px-8 focus:outline-hidden outline-none w-full rounded-sm'
                            type='number'
                            name='groupNumber'
                            onChange={handleInputChange}
                            value={props.mainSettings.groupNumber}
                            ></input>
                        <br/>
                        <br/>
                        <label className='modification-subTitle'>Company </label>
                        <br/>
                        <input 
                            className='bg-[#1B1917] p-2 px-8 focus:outline-hidden outline-none w-full rounded-sm'
                            type='text'
                            name='company'
                            onChange={handleInputChange}
                            value={props.mainSettings.company}
                            ></input>
                        <br/><br/>
                        <label className='modification-subTitle'>Language - (Pick One) </label>
                        <Select
                            name='language'
                            styles={selectStyles}
                            defaultValue={{ value: 'English', label: 'English' }}
                            options={[{ value: 'English', label: 'English' }, { value: 'Spanish', label: 'Spanish' }]}
                            value={props.mainSettings.language}
                            onChange={handleSelectChange}
                       />
                        <br />
                        <label className='modification-subTitle'>Referal Source - (Pick One)</label>
                        <Select 
                            name='refferalSource'
                            styles={selectStyles}
                            options={props.userSettings.referralSourceOptions}
                            value={props.mainSettings.refferalSource}
                            onChange={handleSelectChange}
                        />
                        <br />
                        <label className='modification-subTitle'>Spheres - (Multiple)</label>
                        <Select 
                            name='spheres'
                            styles={selectStyles}
                            isMulti
                            options={props.userSettings.spheresOptions}
                            value={props.mainSettings.spheres}
                            onChange={handleSelectChange}
                        />
                    </div>
                :
                    <>
                        <p className={`file-importer--text ${isDragging === true ? 'allowChildDragging' : ''} text-5xl mt-3 self-center justify-self-center`}>Select File Below</p>
                    </>
            }
            <div className='grid grid-cols-2 gap-3 mt-8 border-t-2 border-[#706E6C] pt-5'>
                <label className={`${props.mainSettings.sheetName === '' ? `${buttonStyles} text-xl w-fit justify-self-center`  : 'text-3xl'} self-center cursor-pointer`} htmlFor='file-importer--input'>{` ${props.mainSettings.sheetName === '' ? "Select Legal Shield Files"  : props.mainSettings.sheetName} `}</label>
                <input
                    className={`${isDragging === true ? 'allowChildDragging' : ''} `}
                    id='file-importer--input'
                    type='file'
                    accept=''
                    onChange={handleMainFileChange}
                >
                </input>

                {props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ?
                    <button className={`${buttonStyles} text-3xl w-fit self-center row-span-2 self-center justify-self-center`} onClick={handleRemoveFile}>Remove</button>
                    : undefined
                }

                <label className={`${props.mainSettings.fieldNoteSheetName === '' ? `${buttonStyles} text-xl w-fit justify-self-center`  : 'text-3xl'} self-center cursor-pointer`}  htmlFor='fieldNote-importer'>{` ${props.mainSettings.fieldNoteSheetName === '' ? "Select Field Note File"  : props.mainSettings.fieldNoteSheetName} `}</label>
                <input
                    className='file-picker'
                    id='fieldNote-importer'
                    type='file'
                    accept=''
                    onChange={handleFieldNoteFileChange}
                >
                </input>
            </div>
            
        </div>
    )
}