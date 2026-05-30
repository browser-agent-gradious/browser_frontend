// ─── Config ───────────────────────────────────────────────────────────────────
// When ready to switch to API, set USE_API = true and fill API_BASE_URL
const USE_API = false
const API_BASE_URL = '/api/documents'

// Local file paths (relative to /public folder)
// Place your mock PDFs in: public/files/
const LOCAL_FILES = {
    // Payslips — keyed by month
    payslip: {
        'May 2026':   '/files/payroll/may-2026-payslip.pdf',
        'April 2026': '/files/payroll/april-2026-payslip.pdf',
        'March 2026': '/files/payroll/march-2026-payslip.pdf',
    },

    // Profile documents — keyed by document type
    'offer-letter':       '/files/documents/offer-letter.pdf',
    'appointment-letter': '/files/documents/appointment-letter.pdf',
    'form-16':            '/files/documents/form-16.pdf',
    'pf-statement':       '/files/documents/pf-statement.pdf',
}

// ─── Core download trigger ─────────────────────────────────────────────────────
function triggerDownload(url, filename) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}



// ─── API download (future) ─────────────────────────────────────────────────────
async function downloadFromAPI(endpoint, filename) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
    URL.revokeObjectURL(url)
}

// ─── Local download ────────────────────────────────────────────────────────────
function downloadFromLocal(filePath, filename) {
    triggerDownload(filePath, filename)
}


// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Download a payslip PDF for a given month.
 * @param {string} month - e.g. 'May 2026'
 */
export async function downloadPayslip(month) {
    const filename = `Payslip-${month.replace(' ', '-')}.pdf`

    if (USE_API) {
        const monthSlug = month.toLowerCase().replace(' ', '-')
        await downloadFromAPI(`payslip/${monthSlug}`, filename)
        return
    }

    const filePath = LOCAL_FILES.payslip[month]
    if (!filePath) {
        console.warn(`No local payslip found for month: ${month}`)
        return
    }

    downloadFromLocal(filePath, filename)
}

/**
 * Download a profile document.
 * @param {'offer-letter' | 'appointment-letter' | 'form-16' | 'pf-statement'} docType
 * @param {string} displayName - Human readable name e.g. 'Offer Letter'
 */
export async function downloadProfileDocument(docType, displayName) {

    const filename = `${displayName.replace(/\s+/g, '-')}.pdf`

    if (USE_API) {
        await downloadFromAPI(`profile/${docType}`, filename)
        return
    }

    const filePath = LOCAL_FILES[docType]
    if (!filePath) {
        console.warn(`No local file found for document type: ${docType}`)
        return
    }

    downloadFromLocal(filePath, filename)
}