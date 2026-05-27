import React from 'react'
import styles from './DataTable.module.css'

/**
 * DataTable
 * columns: [{ key, label, render? }]
 * rows:    array of objects
 */
export default function DataTable({ columns, rows, emptyText = 'No records found.' }) {
    if (!rows || rows.length === 0) {
        return <div className={styles.empty}>{emptyText}</div>
    }
    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className={styles.th}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row.id ?? i} className={styles.tr}>
                            {columns.map(col => (
                                <td key={col.key} className={styles.td}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}