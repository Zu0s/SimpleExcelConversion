export type SelectOption = {
    value?: string
    label?: string
}

export type ConversionSettings = {
    language?: SelectOption | string
    groupNumber?: string
    company?: string
    spheres?: SelectOption[]
    refferalSource?: SelectOption | string
    excelHeaders: Record<string, string>
}

export type ExistingDupe = {
    orignalName: string
    dupeFoundName: string
    issueFound: string
}

export type ConversionResult = {
    convertedSheet: Record<string, unknown>[]
    dupeCounter: number
    updateCounter: number
    unusedCollumsLegalShield: string[]
    failedMappings: string[]
    exisitingDupesFound: ExistingDupe[]
}

const PHONE_KEYS = new Set(['Home Phone', 'Day Phone', 'Cell Phone'])
const PHONE_PLACEHOLDER = '(000) 000-0000'
const FIELD_NOTE_MEMBER_KEYS = ['Legal Plan #', 'IDShield #', 'CDLP #', 'Small Buisness Plan #']

export function nameFixer(currentName: unknown): string {
    if (currentName == null || currentName === '') return ''
    const nameArr = String(currentName).toLowerCase().split(' ')
    const filtered = nameArr.length > 1 ? nameArr.filter((part) => part.length > 1) : nameArr
    return filtered
        .map((part) => part.charAt(0).toUpperCase() + part.substring(1))
        .join(' ')
}

export function memberNumberFirstDigit(memberNumber: unknown): string {
    if (memberNumber == null || memberNumber === '') return ''
    const asString = String(memberNumber).trim()
    return asString.charAt(0)
}

export function referralSourceValue(source: unknown): string {
    if (source == null || source === '') return ''
    if (typeof source === 'object' && source !== null && 'value' in source) {
        const value = (source as SelectOption).value
        return value == null ? '' : String(value)
    }
    return String(source)
}

export function languageValue(language: unknown, planDescription: string): string {
    if (planDescription.toLowerCase().includes('spanish')) return 'Spanish'
    if (typeof language === 'object' && language !== null && 'value' in language) {
        const value = (language as SelectOption).value
        return value == null || value === '' ? 'English' : String(value)
    }
    if (typeof language === 'string' && language !== '') return language
    return 'English'
}

export function personKey(row: Record<string, unknown>, rowId?: string | number): string {
    const first = nameFixer(row['First Name'])
    const last = nameFixer(row['Last Name'])
    const email = String(row['Email'] ?? '').trim().toLowerCase()
    if (email) return `${first}\0${last}\0email:${email}`
    const phone = phoneForCompare(row['Cell Phone'])
    if (phone) return `${first}\0${last}\0phone:${phone}`
    if (!first && !last) return ''
    return `${first}\0${last}\0row:${rowId ?? ''}`
}

export function phoneForCompare(value: unknown): string {
    if (value == null || value === '') return ''
    return String(value).replace(/[^a-zA-Z0-9]/g, '')
}

function planDescriptionOf(item: Record<string, unknown>): string {
    return String(item['Plan Description'] ?? '')
}

function isCommercial(item: Record<string, unknown>): boolean {
    return planDescriptionOf(item).toLowerCase().includes('commercial')
}

function isBusiness(item: Record<string, unknown>): boolean {
    return planDescriptionOf(item).toLowerCase().includes('business')
}

function isIdShield(item: Record<string, unknown>): boolean {
    return memberNumberFirstDigit(item['Member Number']) === '7'
}

function cleanRow(obj: Record<string, unknown>): Record<string, unknown> {
    const next: Record<string, unknown> = { ...obj }
    for (const key of Object.keys(next)) {
        const value = next[key]
        if (typeof value === 'string') {
            next[key] = value.replace(/\s+/g, ' ').trim()
        }
        if (PHONE_KEYS.has(key)) {
            const phone = next[key]
            if (phone == null || phone === '' || String(phone).trim() === PHONE_PLACEHOLDER) {
                next[key] = ''
            } else {
                next[key] = String(phone).replace(/[()\-]/g, '').replace(/\s+/g, ' ').trim()
            }
        }
    }
    return next
}

function findPlan(
    dupeArray: Record<string, unknown>[],
    typeOfPlan: 'IDShield' | 'Commercial' | 'Legal Shield' | 'Buisness',
    isMemberNumber: boolean
): unknown {
    let found: Record<string, unknown> | undefined
    if (typeOfPlan === 'IDShield') {
        found = dupeArray.find(isIdShield)
    } else if (typeOfPlan === 'Commercial') {
        found = dupeArray.find(isCommercial)
    } else if (typeOfPlan === 'Legal Shield') {
        found = dupeArray.find((item) => !isCommercial(item) && !isBusiness(item) && !isIdShield(item))
    } else if (typeOfPlan === 'Buisness') {
        found = dupeArray.find((item) => isBusiness(item) && !isIdShield(item))
    }
    if (found == null) return ''
    return isMemberNumber ? (found['Member Number'] ?? '') : (found['Monthly Premium'] ?? '')
}

function joinWithPipes(values: unknown[]): string {
    return values
        .map((value) => (value == null ? '' : String(value)))
        .filter((value) => value !== '')
        .join(' | ')
}

function spheresValue(spheres: SelectOption[] | undefined, planDescription: string): string {
    if (!spheres || spheres.length === 0) return ' '
    const joined = joinWithPipes(spheres.map((item) => item.value))
    if (planDescription.toLowerCase().includes('spanish')) {
        return joined.replace('English', 'Spanish')
    }
    return joined
}

function findExistingContacts(
    fieldNoteRows: Record<string, unknown>[],
    currentItem: Record<string, unknown>,
    dupeArray: Record<string, unknown>[]
): Record<string, unknown>[] {
    const currentEmail = currentItem['Email'] != null && currentItem['Email'] !== ''
        ? String(currentItem['Email']).toLowerCase()
        : ''
    const currentPhone = phoneForCompare(currentItem['Cell Phone'])
    const groupMemberNumbers = [currentItem, ...dupeArray]
        .map((row) => String(row['Member Number'] ?? ''))
        .filter((value) => value !== '')

    return fieldNoteRows.filter((contact) => {
        const contactEmail = contact['Email'] != null && contact['Email'] !== ''
            ? String(contact['Email']).toLowerCase()
            : ''
        const contactPhone = phoneForCompare(contact['Cell Phone'])
        const contactMemberNumbers = FIELD_NOTE_MEMBER_KEYS
            .map((key) => String(contact[key] ?? ''))
            .filter((value) => value !== '')

        if (currentEmail && contactEmail && contactEmail === currentEmail) return true
        if (currentPhone && contactPhone && contactPhone === currentPhone) return true
        if (groupMemberNumbers.some((memberNumber) => contactMemberNumbers.includes(memberNumber))) return true
        return false
    })
}

function describeExistingDupes(
    existingContacts: Record<string, unknown>[],
    currentItem: Record<string, unknown>,
    dupeArray: Record<string, unknown>[]
): ExistingDupe[] {
    const currentEmail = currentItem['Email'] != null && currentItem['Email'] !== ''
        ? String(currentItem['Email']).toLowerCase()
        : ''
    const currentPhone = phoneForCompare(currentItem['Cell Phone'])
    const dupeMemberNumbers = dupeArray.map((row) => String(row['Member Number'] ?? ''))
    const combinedCurrItemName = `${nameFixer(currentItem['First Name'])} ${nameFixer(currentItem['Last Name'])}`.trim()

    const issues: ExistingDupe[] = []
    for (const contact of existingContacts) {
        const combinedCurrObjName = `${String(contact['First Name (0r) Group Account Name'] ?? contact['First Name'] ?? '')} ${String(contact['Last Name'] ?? '')}`.trim()
        const keys = ['Email', 'Cell Phone', ...FIELD_NOTE_MEMBER_KEYS]
        for (const key of keys) {
            if (FIELD_NOTE_MEMBER_KEYS.includes(key)) {
                const contactValue = String(contact[key] ?? '')
                if (
                    contactValue !== '' &&
                    (contactValue === String(currentItem['Member Number'] ?? '') || dupeMemberNumbers.includes(contactValue))
                ) {
                    issues.push({ orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key })
                    break
                }
            } else if (key === 'Email') {
                const contactEmail = contact['Email'] != null && contact['Email'] !== ''
                    ? String(contact['Email']).toLowerCase()
                    : ''
                if (contactEmail !== '' && contactEmail === currentEmail) {
                    issues.push({ orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key })
                    break
                }
            } else if (key === 'Cell Phone') {
                const contactPhone = phoneForCompare(contact['Cell Phone'])
                if (contactPhone !== '' && contactPhone === currentPhone) {
                    issues.push({ orignalName: combinedCurrItemName, dupeFoundName: combinedCurrObjName, issueFound: key })
                    break
                }
            }
        }
    }
    return issues
}

function buildDataValues(
    currentItem: Record<string, unknown>,
    dupeArray: Record<string, unknown>[],
    settings: ConversionSettings,
    filteredPlanDescription: string
): Record<string, { value: unknown; inUse: boolean }> {
    const firstDigit = memberNumberFirstDigit(currentItem['Member Number'])
    const commercial = isCommercial(currentItem)
    const business = isBusiness(currentItem)
    const hasDupes = dupeArray.length !== 0

    return {
        'Legal Plan #': {
            value: commercial ? '' : business ? '' : firstDigit === '1' ? currentItem['Member Number'] : hasDupes ? findPlan(dupeArray, 'Legal Shield', true) : '',
            inUse: false
        },
        'IDShield #': {
            value: firstDigit === '7' ? currentItem['Member Number'] : hasDupes ? findPlan(dupeArray, 'IDShield', true) : '',
            inUse: false
        },
        'CDLP #': {
            value: commercial ? currentItem['Member Number'] : hasDupes ? findPlan(dupeArray, 'Commercial', true) : '',
            inUse: false
        },
        'Small Buisness Plan #': {
            value: business ? currentItem['Member Number'] : hasDupes ? findPlan(dupeArray, 'Buisness', true) : '',
            inUse: false
        },
        'First Name': {
            value: nameFixer(currentItem['First Name']),
            inUse: false
        },
        'Last Name': {
            value: nameFixer(currentItem['Last Name']),
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
            value: currentItem['Email'] == null || currentItem['Email'] === '' ? '' : String(currentItem['Email']).toLowerCase(),
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
            value: currentItem['Date of Birth'],
            inUse: false
        },
        'Legal Shield Monthly Rate': {
            value: commercial ? '' : business ? '' : firstDigit === '1' ? currentItem['Monthly Premium'] : hasDupes ? findPlan(dupeArray, 'Legal Shield', false) : '',
            inUse: false
        },
        'IDShield Monthly Rate': {
            value: firstDigit === '7' ? currentItem['Monthly Premium'] : hasDupes ? findPlan(dupeArray, 'IDShield', false) : '',
            inUse: false
        },
        'CDLP Monthly Rate': {
            value: commercial ? currentItem['Monthly Premium'] : hasDupes ? findPlan(dupeArray, 'Commercial', false) : '',
            inUse: false
        },
        'Small Biz Monthly Rate': {
            value: business ? currentItem['Monthly Premium'] : hasDupes ? findPlan(dupeArray, 'Buisness', false) : '',
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
            value: currentItem['Production Date'],
            inUse: false
        },
        'Effective Date': {
            value: currentItem['Effective Date'],
            inUse: false
        },
        'Cancel Date': {
            value: currentItem['Cancel Date'],
            inUse: false
        },
        'Last Plan Amount Update': {
            value: currentItem['Last Plan Amount Update'],
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
        'Referral Source': {
            value: referralSourceValue(settings.refferalSource),
            inUse: false
        },
        'Language': {
            value: languageValue(settings.language, filteredPlanDescription),
            inUse: false
        },
        'Group #': {
            value: settings.groupNumber ?? '',
            inUse: false
        },
        'Company': {
            value: settings.company ?? '',
            inUse: false
        },
        'Spheres': {
            value: spheresValue(settings.spheres, filteredPlanDescription),
            inUse: false
        }
    }
}

export function convertLegalShieldRows(
    legalShieldRows: Record<string, unknown>[],
    fieldNoteRows: Record<string, unknown>[],
    settings: ConversionSettings
): ConversionResult {
    const rows = legalShieldRows.map((row) => cleanRow(row))
    const fieldNotes = fieldNoteRows.map((row) => ({ ...row }))
    const processed = new Set<number>()
    const convertedSheet: Record<string, unknown>[] = []
    const existingDupesFound: ExistingDupe[] = []
    let dupeCounter = 0
    let updateCounter = 0
    let unusedCollumsLegalShield: string[] = []
    let failedMappings: string[] = []

    for (let i = 0; i < rows.length; i++) {
        if (processed.has(i)) continue

        const currentItem = rows[i]
        const key = personKey(currentItem, i)
        const dupeIndexes: number[] = []
        if (key !== '' && !key.includes('\0row:')) {
            for (let j = i + 1; j < rows.length; j++) {
                if (processed.has(j)) continue
                if (personKey(rows[j], j) === key) dupeIndexes.push(j)
            }
        }

        const dupeArray = dupeIndexes.map((index) => rows[index])
        dupeCounter += dupeArray.length
        processed.add(i)
        dupeIndexes.forEach((index) => processed.add(index))

        const filteredPlanDescription = joinWithPipes([
            currentItem['Plan Description'],
            ...dupeArray.map((row) => row['Plan Description'])
        ]).replace('+', '|')

        const existingContacts = findExistingContacts(fieldNotes, currentItem, dupeArray)
        let currentUserObject: Record<string, unknown> = {}
        if (existingContacts.length === 1) {
            updateCounter++
            currentUserObject = { ...existingContacts[0] }
        } else if (existingContacts.length > 1) {
            existingDupesFound.push(...describeExistingDupes(existingContacts, currentItem, dupeArray))
        }

        const dataValues = buildDataValues(currentItem, dupeArray, settings, filteredPlanDescription)
        const rowFailedMappings: string[] = []

        for (const keyName of Object.keys(settings.excelHeaders)) {
            const mappedHeader = settings.excelHeaders[keyName]
            const mappedValue = dataValues[mappedHeader]
            if (!mappedValue) {
                rowFailedMappings.push(`${keyName} - ${mappedHeader}`)
                currentUserObject[keyName] = undefined
                continue
            }
            mappedValue.inUse = true
            currentUserObject[keyName] = mappedValue.value
        }

        failedMappings = rowFailedMappings
        unusedCollumsLegalShield = Object.keys(dataValues).filter((dataKey) => !dataValues[dataKey].inUse)
        convertedSheet.push(currentUserObject)
    }

    return {
        convertedSheet,
        dupeCounter,
        updateCounter,
        unusedCollumsLegalShield,
        failedMappings,
        exisitingDupesFound: existingDupesFound
    }
}
