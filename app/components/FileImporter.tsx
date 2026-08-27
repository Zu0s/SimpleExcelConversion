import { useState } from 'react';
import { shittyDb } from '../keys'
import { techButtonStyles, disabledTechButtonStyles, panelStyles } from '../groupedStyles';
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
        return props.setMainSettings(() => {
            console.log(props.userSettings.userPref)
            let spheresPref = props.defaultMainSettings.spheres
            if (props.userSettings.userPref) {
                spheresPref = props.userSettings.userPref.spheresOptionsPref
            }
            return {
                ...props.defaultMainSettings,
                spheres: spheresPref
            }
        })
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

    // Check box function
    function handleNewGroup(e: any) { // cant trigger state update 
        const {checked} = e.target
        props.setMainSettings((prevSettings: any) => ({
            ...prevSettings,
            hasStateUpdated: true,
            newGroup: checked,
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
        control: (styles: any) => ({
            ...styles,
            backgroundColor: '#000C47',
            color: '#EDF1FB',
            borderColor: '#0B3FB6',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 12,
            boxShadow: 'none',
            padding: '0.3rem',
            ':hover': { borderColor: '#0B3FB6', borderWidth: 2, borderStyle: 'solid' },
        }),
        option: (styles: any, { isFocused, isSelected }) => { 

            return {
                ...styles,
                backgroundColor: isSelected 
                ? '#00132C'
                : isFocused
                ? '#00132C'
                : '#000C47',
                color: '#EDF1FB',
            }
        },
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#000C47', color:'#EDF1FB'}),
        menu: (styles) => ({ ...styles, backgroundColor: '#000C47', border: '2px solid #0B3FB6', borderRadius: 12 }),
        menuList: (styles) => ({
            ...styles,
           "::-webkit-scrollbar": { width: "9px" },
           "::-webkit-scrollbar-track": { background: '#000C47' },
           "::-webkit-scrollbar-thumb": { background: '#EDF1FB' },
           "::-webkit-scrollbar-thumb:hover": { background: '#a5a8b1' }
        }),
        indicatorSeparator: (styles) => ({ ...styles, backgroundColor: '#0B3FB6'}),
        input: (styles) => ({ ...styles, ...dot(), color: '#EDF1FB'}),
        placeholder: (styles) => ({ ...styles, ...dot(), color: '#EDF1FB' }),
        singleValue: (styles) => ({ ...styles, ...dot(), color: '#EDF1FB' }),
        dropdownIndicator: (styles: any) => ({ ...styles, color: '#EDF1FB' }),
        clearIndicator: (styles) => ({ ...styles, color: '#EDF1FB'}) ,
        multiValue: (styles) => ({ ...styles, color: '#EDF1FB', backgroundColor: '#00132C' }),
        multiValueLabel: (styles) => ({ ...styles, color: '#EDF1FB' }),
        multiValueRemove: (styles) => ({ ...styles, color: '#EDF1FB', ':hover': { backgroundColor: '#0B3FB6', color: '#EDF1FB'}  }),
    }   

    return(
        <div 
            className='flex flex-col min-h-full w-full font-[family-name:var(--font-geist-sans)]'
            id='file-importer--main'
            onDragEnter={handleDragEnter}    
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >

            <div className={`flex ${ props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ? 'flex-row gap-4 p-4 justify-between self-center w-full' : 'flex-col items-center justify-center gap-4 p-4 mx-auto' }` }>
                { props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ? null : <p className={`file-importer--text ${isDragging === true ? 'allowChildDragging' : ''} text-5xl md:max-lg:text-4xl text-center`}>Select Files Below</p> }
                
                <div className={` flex ${ props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ? 'flex-col': 'flex-col items-center gap-4'} `}>
                    <label className={`  
                        ${ props.mainSettings.sheetName !== '' ? 'text-3xl' : `${techButtonStyles} text-xl w-fit justify-middle`} 
                        ${ props.mainSettings.sheetName  !== '' || props.mainSettings.fieldNoteSheetName !== '' ? '' : 'hello'  } 
                       cursor-pointer `} 
                        htmlFor='file-importer--input'
                    >
                        {` ${props.mainSettings.sheetName === '' ? "Select Legal Shield Files"  : props.mainSettings.sheetName} `}
                    </label>
                    <input
                        className={` `}
                        id='file-importer--input'
                        type='file'
                        accept=''
                        onChange={handleMainFileChange}
                    >
                    </input>
            
                    <div className={ ` ${props.mainSettings.sheetName  !== '' || props.mainSettings.fieldNoteSheetName !== '' ? 'mt-2 flex' : 'flex items-center justify-center'}`}>
                        <label className={`  ${props.mainSettings.newGroup ? `${disabledTechButtonStyles} text-xl w-fit` : props.mainSettings.fieldNoteSheetName === '' ? `${techButtonStyles} text-xl w-fit`  : 'text-3xl'} cursor-pointer `}  htmlFor='fieldNote-importer'>{` ${props.mainSettings.fieldNoteSheetName === '' ? "Select Field Note File"  : props.mainSettings.fieldNoteSheetName} `}</label>
                            <input
                                className='file-picker '
                                id='fieldNote-importer'
                                type='file'
                                accept=''
                                onChange={handleFieldNoteFileChange}
                            >
                        </input>

                        { props.mainSettings.sheetName !== '' && props.mainSettings.fieldNoteSheetName === '' ? 
                            <>
                                <input
                                className='ml-3 self-center cursor-pointer '
                                id='newGroupCheck'
                                name='newGroupCheck'
                                type='checkbox'
                                checked={props.mainSettings.newGroup}
                                onChange={handleNewGroup}
                                ></input>
                                <label className='ml-1 text-xl self-center cursor-pointer' htmlFor='newGroupCheck'>New Group</label>
                            </>
                            : undefined
                        }
                    </div>
                </div>

                {props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ?
                    <button className={`${techButtonStyles} text-3xl w-fit self-center row-span-2 self-center justify-self-center`} onClick={handleRemoveFile}>Remove</button>
                    : undefined
                }
            </div>
            {props.mainSettings.sheetName !== '' || props.mainSettings.fieldNoteSheetName !== '' ?
                <div className={`${panelStyles} p-5 flex flex-col gap-4 text-2xl modifications-panel`}>

                    <h1 className=' w-fit text-3xl'>Modifications</h1>
                    <div>    
                        <label className='modification-subTitle'>Group # </label>
                        <input 
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className='bg-[#000C47] border-[2px] border-[#0B3FB6] p-2 px-8 focus:outline-hidden outline-none w-full rounded-xl text-[#EDF1FB]'
                            type='number'
                            name='groupNumber'
                            onChange={handleInputChange}
                            value={props.mainSettings.groupNumber}
                        ></input>
                    </div>
                    <div>
                        <label className='modification-subTitle'>Company </label>
                        <input 
                            className='bg-[#000C47] border-[2px] border-[#0B3FB6] p-2 px-8 focus:outline-hidden outline-none w-full rounded-xl text-[#EDF1FB]'
                            type='text'
                            name='company'
                            onChange={handleInputChange}
                            value={props.mainSettings.company}
                        ></input>
                    </div>
                    <div>
                        <label className='modification-subTitle'>Language - (Pick One) </label>
                        <Select
                            name='language'
                            styles={selectStyles}
                            defaultValue={{ value: 'English', label: 'English' }}
                            options={[{ value: 'English', label: 'English' }, { value: 'Spanish', label: 'Spanish' }]}
                            value={props.mainSettings.language}
                            onChange={handleSelectChange}
                        />
                    </div>
                    <div>
                        <label className='modification-subTitle'>Referal Source - (Pick One)</label>
                        <Select 
                            name='refferalSource'
                            styles={selectStyles}
                            options={props.userSettings.referralSourceOptions}
                            value={props.mainSettings.refferalSource}
                            onChange={handleSelectChange}
                        />
                    </div>
                    <div className="modifications-spheres md:max-lg:pb-0">
                        <label className='modification-subTitle'>Spheres - (Multiple)</label>
                        <Select 
                            name='spheres'
                            classNamePrefix='sec-select'
                            styles={selectStyles}
                            isMulti
                            className=''
                            options={props.userSettings.spheresOptions}
                            value={props.mainSettings.spheres}
                            onChange={handleSelectChange}
                        />
                    </div>
                </div>
            :
                <>
                    {/* <p className={`file-importer--text ${isDragging === true ? 'allowChildDragging' : ''} text-5xl mt-3 self-center justify-self-center`}>Select File Below</p> */}
                </>
            }
       
            
        </div>
    )
}