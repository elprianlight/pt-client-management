'use client'

export function PrintButton() {
  return (
    <button type="button" className="btn-primary" style={{ minHeight: 48, padding: '0 24px', borderRadius: 999 }} onClick={() => window.print()}>
      Cetak / simpan PDF
    </button>
  )
}
