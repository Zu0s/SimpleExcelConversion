export function sanitizeDownloadBase(name: string) {
  return name.replace(/[/\\:*?"<>|]/g, '').trim()
}

export function buildDownloadFileName(companyRaw: string, settings: {
  alternateName?: {
    useCompanyName?: boolean,
    extraText?: string,
    extraTextAtFront?: boolean
  }
} | undefined) {
  const company = String(companyRaw || '').trim()
  const extra = String(settings?.alternateName?.extraText || '').trim()
  const useCompany = Boolean(settings?.alternateName?.useCompanyName && company.length > 0)
  const extraTextAtFront = Boolean(settings?.alternateName?.extraTextAtFront)
  let base = 'simpleExcelConvertDownload'
  if (!useCompany && extra === '') {
    base = 'simpleExcelConvertDownload'
  } else if (useCompany && extra === '') {
    base = company
  } else if (useCompany && extra && extraTextAtFront) {
    base = `${extra} ${company}`
  } else if (useCompany && extra && !extraTextAtFront) {
    base = `${company} ${extra}`
  } else {
    base = extra
  }
  return `${sanitizeDownloadBase(base) || 'simpleExcelConvertDownload'}.xlsx`
}
