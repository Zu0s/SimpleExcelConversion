import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    convertLegalShieldRows,
    languageValue,
    memberNumberFirstDigit,
    nameFixer,
    personKey,
    phoneForCompare,
    referralSourceValue,
    type ConversionSettings
} from './conversion'
import { shittyDb } from '../keys'

const excelHeaders = shittyDb.billButkovich.excelHeaders as Record<string, string>

const baseSettings: ConversionSettings = {
    language: { value: 'English', label: 'English' },
    groupNumber: '1001',
    company: 'Acme',
    spheres: [{ value: 'Employee Benefits', label: 'Employee Benefits' }, { value: 'English', label: 'English' }],
    refferalSource: { value: 'Cold Call', label: 'Cold Call' },
    excelHeaders
}

function legalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        'Email': 'jane@example.com',
        'Member Number': '12345',
        'Plan Description': 'Family Legal Plan',
        'Monthly Premium': '24.95',
        'Cell Phone': '(555) 111-2222',
        'Home Phone': '',
        'Day Phone': '',
        ...overrides
    }
}

describe('nameFixer', () => {
    it('title-cases names and drops middle initials', () => {
        assert.equal(nameFixer('jane q doe'), 'Jane Doe')
    })

    it('returns empty string for missing names instead of throwing', () => {
        assert.equal(nameFixer(undefined), '')
        assert.equal(nameFixer(null), '')
        assert.equal(nameFixer(''), '')
    })
})

describe('memberNumberFirstDigit', () => {
    it('reads the first digit from numeric Excel values', () => {
        assert.equal(memberNumberFirstDigit(72345), '7')
        assert.equal(memberNumberFirstDigit('12345'), '1')
    })

    it('returns empty string for missing member numbers', () => {
        assert.equal(memberNumberFirstDigit(undefined), '')
    })
})

describe('referralSourceValue', () => {
    it('returns empty string when no source is selected', () => {
        assert.equal(referralSourceValue(''), '')
        assert.equal(referralSourceValue(undefined), '')
    })

    it('reads the value from a select option', () => {
        assert.equal(referralSourceValue({ value: 'Cold Call', label: 'Cold Call' }), 'Cold Call')
    })
})

describe('languageValue', () => {
    it('uses Spanish when the plan description includes Spanish', () => {
        assert.equal(languageValue({ value: 'English' }, 'Family Legal Spanish'), 'Spanish')
    })
})

describe('personKey', () => {
    it('treats the same person as one key regardless of name casing', () => {
        assert.equal(
            personKey({ 'First Name': 'JANE', 'Last Name': 'DOE', Email: 'Jane@Example.com' }),
            personKey({ 'First Name': 'jane', 'Last Name': 'doe', Email: 'jane@example.com' })
        )
    })

    it('does not merge blank unidentified rows together', () => {
        assert.equal(personKey({}), '')
    })

    it('does not treat same-name rows with no email or phone as the same person', () => {
        assert.notEqual(
            personKey({ 'First Name': 'Jane', 'Last Name': 'Doe' }, 0),
            personKey({ 'First Name': 'Jane', 'Last Name': 'Doe' }, 1)
        )
    })

    it('groups same-name rows without email when the phone number matches', () => {
        assert.equal(
            personKey({ 'First Name': 'Jane', 'Last Name': 'Doe', 'Cell Phone': '(555) 111-2222' }),
            personKey({ 'First Name': 'Jane', 'Last Name': 'Doe', 'Cell Phone': '5551112222' })
        )
    })
})

describe('phoneForCompare', () => {
    it('strips formatting so equivalent numbers match', () => {
        assert.equal(phoneForCompare('(555) 111-2222'), phoneForCompare('5551112222'))
    })
})

describe('convertLegalShieldRows', () => {
    it('writes Small Biz Monthly Rate from Monthly Premium, not Member Number', () => {
        const result = convertLegalShieldRows(
            [legalRow({
                'Plan Description': 'Small Business Plan',
                'Member Number': 'B9001',
                'Monthly Premium': '49.00'
            })],
            [],
            baseSettings
        )

        const row = result.convertedSheet[0]
        assert.equal(row['Small Biz Monthly Rate'], '49.00')
        assert.equal(row['Small Buisness Plan #'], 'B9001')
        assert.equal(row['Legal Plan #'], '')
        assert.equal(row['LegalShield Monthly Rate'], '')
    })

    it('fills Small Biz rate from a business dupe when the current row is a legal plan', () => {
        const result = convertLegalShieldRows(
            [
                legalRow({ 'Member Number': '12345', 'Plan Description': 'Family Legal Plan', 'Monthly Premium': '24.95' }),
                legalRow({ 'Member Number': 'B9001', 'Plan Description': 'Small Business Plan', 'Monthly Premium': '49.00' })
            ],
            [],
            baseSettings
        )

        assert.equal(result.convertedSheet.length, 1)
        assert.equal(result.convertedSheet[0]['Small Biz Monthly Rate'], '49.00')
        assert.equal(result.convertedSheet[0]['Small Buisness Plan #'], 'B9001')
        assert.equal(result.convertedSheet[0]['Legal Plan #'], '12345')
        assert.equal(result.convertedSheet[0]['LegalShield Monthly Rate'], '24.95')
    })

    it('does not write undefined when referral source was never selected', () => {
        const result = convertLegalShieldRows(
            [legalRow()],
            [],
            { ...baseSettings, refferalSource: '' }
        )

        assert.equal(result.convertedSheet[0]['Referral Source (pick one)'], '')
        assert.notEqual(result.convertedSheet[0]['Referral Source (pick one)'], undefined)
    })

    it('writes the selected referral source value', () => {
        const result = convertLegalShieldRows([legalRow()], [], baseSettings)
        assert.equal(result.convertedSheet[0]['Referral Source (pick one)'], 'Cold Call')
    })

    it('merges non-consecutive duplicate people into one Field Notes row', () => {
        const result = convertLegalShieldRows(
            [
                legalRow({ 'Member Number': '12345', 'Plan Description': 'Family Legal Plan', 'Monthly Premium': '24.95' }),
                legalRow({
                    'First Name': 'Bob',
                    'Last Name': 'Smith',
                    Email: 'bob@example.com',
                    'Member Number': '19999',
                    'Plan Description': 'Individual Legal Plan',
                    'Monthly Premium': '19.95'
                }),
                legalRow({ 'Member Number': '72345', 'Plan Description': 'IDShield', 'Monthly Premium': '12.00' })
            ],
            [],
            baseSettings
        )

        assert.equal(result.convertedSheet.length, 2)
        assert.equal(result.dupeCounter, 1)

        const jane = result.convertedSheet.find((row) => row['First Name (0r) Group Account Name'] === 'Jane')
        assert.ok(jane)
        assert.equal(jane?.['Legal Plan #'], '12345')
        assert.equal(jane?.['IDShield #'], '72345')
        assert.equal(jane?.['IDShield Monthly Rate'], '12.00')
        assert.equal(jane?.['Plans Offered/Chosen'], 'Family Legal Plan | IDShield')
    })

    it('does not merge different people who share a name but have no email or phone', () => {
        const result = convertLegalShieldRows(
            [
                legalRow({ Email: undefined, 'Cell Phone': '', 'Member Number': '12345' }),
                legalRow({ Email: undefined, 'Cell Phone': '', 'Member Number': '19999', 'Monthly Premium': '18.00' })
            ],
            [],
            baseSettings
        )

        assert.equal(result.convertedSheet.length, 2)
        assert.equal(result.dupeCounter, 0)
        assert.equal(result.convertedSheet[0]['Legal Plan #'], '12345')
        assert.equal(result.convertedSheet[1]['Legal Plan #'], '19999')
    })

    it('does not throw on numeric member numbers or missing email, name, and phone', () => {
        const result = convertLegalShieldRows(
            [{
                'First Name': undefined,
                'Last Name': undefined,
                Email: undefined,
                'Cell Phone': undefined,
                'Member Number': 12345,
                'Plan Description': 'Family Legal Plan',
                'Monthly Premium': '24.95'
            }],
            [],
            baseSettings
        )
        assert.equal(result.convertedSheet.length, 1)
        assert.equal(result.convertedSheet[0]['Legal Plan #'], 12345)
        assert.equal(result.convertedSheet[0]['LegalShield Monthly Rate'], '24.95')
        assert.equal(result.convertedSheet[0]['First Name (0r) Group Account Name'], '')
        assert.equal(result.convertedSheet[0]['Email'], '')
    })

    it('maps legal, IDShield, commercial, and extra input fields', () => {
        const result = convertLegalShieldRows(
            [
                legalRow({ 'Member Number': '11111', 'Plan Description': 'Family Legal Plan', 'Monthly Premium': '20.00' }),
                legalRow({ 'Member Number': '72222', 'Plan Description': 'IDShield', 'Monthly Premium': '9.00' }),
                legalRow({ 'Member Number': '33333', 'Plan Description': 'COMMERCIAL DRIVER', 'Monthly Premium': '15.00' })
            ],
            [],
            baseSettings
        )

        const row = result.convertedSheet[0]
        assert.equal(result.convertedSheet.length, 1)
        assert.equal(row['Legal Plan #'], '11111')
        assert.equal(row['IDShield #'], '72222')
        assert.equal(row['CDLP #'], '33333')
        assert.equal(row['LegalShield Monthly Rate'], '20.00')
        assert.equal(row['IDShield Monthly Rate'], '9.00')
        assert.equal(row['CDLP Monthly Rate'], '15.00')
        assert.equal(row['Language'], 'English')
        assert.equal(row['Group # '], '1001')
        assert.equal(row['Company'], 'Acme')
        assert.equal(row['Spheres'], 'Employee Benefits | English')
        assert.equal(row['Email'], 'jane@example.com')
    })

    it('counts a single Field Notes match as an update and flags ambiguous member-number matches', () => {
        const singleMatch = convertLegalShieldRows(
            [legalRow()],
            [{
                'First Name (0r) Group Account Name': 'Jane',
                'Last Name': 'Doe',
                Email: 'jane@example.com',
                'Legal Plan #': '12345'
            }],
            baseSettings
        )
        assert.equal(singleMatch.updateCounter, 1)
        assert.equal(singleMatch.exisitingDupesFound.length, 0)

        const ambiguous = convertLegalShieldRows(
            [legalRow({ 'Member Number': '12345' })],
            [
                { 'First Name (0r) Group Account Name': 'Jane', 'Last Name': 'A', Email: 'a@example.com', 'Legal Plan #': '12345' },
                { 'First Name (0r) Group Account Name': 'Jane', 'Last Name': 'B', Email: 'b@example.com', 'IDShield #': '12345' }
            ],
            baseSettings
        )
        assert.equal(ambiguous.updateCounter, 0)
        assert.ok(ambiguous.exisitingDupesFound.length >= 2)
        assert.ok(ambiguous.exisitingDupesFound.every((entry) => entry.issueFound))
        assert.ok(ambiguous.exisitingDupesFound.some((entry) => entry.issueFound === 'Legal Plan #' || entry.issueFound === 'IDShield #'))
    })

    it('matches existing Field Notes contacts using dupe member numbers as strings', () => {
        const result = convertLegalShieldRows(
            [
                legalRow({ 'Member Number': '12345', 'Plan Description': 'Family Legal Plan' }),
                legalRow({ 'Member Number': '72345', 'Plan Description': 'IDShield' })
            ],
            [
                { 'First Name (0r) Group Account Name': 'Old', 'Last Name': 'One', Email: 'old1@example.com', 'IDShield #': '72345' },
                { 'First Name (0r) Group Account Name': 'Old', 'Last Name': 'Two', Email: 'old2@example.com', 'IDShield #': '72345' }
            ],
            baseSettings
        )

        assert.equal(result.updateCounter, 0)
        assert.ok(result.exisitingDupesFound.some((entry) => entry.issueFound === 'IDShield #'))
        assert.ok(result.exisitingDupesFound.every((entry) => typeof entry.dupeFoundName === 'string' && entry.dupeFoundName.length > 0))
    })

    it('sets Spanish language and spheres when a plan description includes Spanish', () => {
        const result = convertLegalShieldRows(
            [legalRow({ 'Plan Description': 'Family Legal Spanish' })],
            [],
            baseSettings
        )
        assert.equal(result.convertedSheet[0]['Language'], 'Spanish')
        assert.equal(result.convertedSheet[0]['Spheres'], 'Employee Benefits | Spanish')
    })
})
