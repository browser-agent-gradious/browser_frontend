import React from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import { downloadProfileDocument } from '../utils/downloadService.js'
import { employee, documents } from '../data/profileData.js'
import styles from './ProfilePage.module.css'

const Field = ({ label, value }) => (
    <div className={styles.field}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldValue}>{value}</span>
    </div>
)

export default function ProfilePage() {
    return (
        <PageLayout title="Profile" subtitle="Your employee information.">
            <div className={styles.grid}>
                {/* Employee card */}
                <Card className={styles.profileCard}>
                    <div className={styles.avatar}>
                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <h2 className={styles.empName}>{employee.name}</h2>
                    <p className={styles.empDesig}>{employee.designation}</p>
                    <Badge variant="default">{employee.employmentType}</Badge>
                    <div className={styles.empId}>{employee.id}</div>
                </Card>

                {/* Details */}
                <div className={styles.details}>
                    <Card>
                        <h3 className={styles.cardTitle}>Personal Information</h3>
                        <div className={styles.fields}>
                            <Field label="Email" value={employee.email} />
                            <Field label="Phone" value={employee.phone} />
                            <Field label="Location" value={employee.location} />
                        </div>
                    </Card>

                    <Card>
                        <h3 className={styles.cardTitle}>Employment Details</h3>
                        <div className={styles.fields}>
                            <Field label="Department" value={employee.department} />
                            <Field label="Designation" value={employee.designation} />
                            <Field label="Reporting Manager" value={employee.reportingManager} />
                            <Field label="Joining Date" value={employee.joiningDate} />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Documents */}
            <section className={styles.docsSection}>
                
                <h2 className={styles.sectionTitle}>Documents</h2>

                <div className={styles.docsList}>
                    {documents.map(doc => (
                        
                        <Card key={doc.id} className={styles.docCard}>
                            
                            {/* Document Icon */}
                            <div className={styles.docIcon}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>

                            {/* Document Info */}
                            <div className={styles.docInfo}>
                                <span className={styles.docName}>{doc.name}</span>
                                <span className={styles.docMeta}>{doc.type} · {doc.date}</span>
                            </div>

                            {/* Download button */}
                            <button 
                                className={styles.docDownload} 
                                id={`${(doc.name).toLowerCase().replaceAll(' ', '-')}-download-btn`} 
                                aria-label={`Download ${doc.name}`}
                                onClick={() => downloadProfileDocument(doc.type, doc.name)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>

                        </Card>
                    ))}
                </div>
            </section>
        </PageLayout>
    )
}