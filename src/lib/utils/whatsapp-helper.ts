/**
 * WhatsApp Helper Utilities & Message Templates
 */

export function formatPhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, '')

  if (!cleaned) return null

  // If starts with '0', replace with '62'
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  // If doesn't start with '62', prepend '62'
  else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }

  return cleaned
}

export interface WATemplateData {
  clientName: string
  packageName?: string
  remainingSessions?: number
  sessionDate?: string
  sessionTime?: string
  daysInactive?: number
}

export function getScheduleReminderMessage(data: WATemplateData): string {
  const timeInfo = [data.sessionDate, data.sessionTime].filter(Boolean).join(' jam ')
  return `Halo ${data.clientName}! 👋

Pengingat jadwal sesi latihan Personal Training kamu:
📅 Tanggal/Waktu: ${timeInfo || 'Besok'}

Mohon datang 10 menit lebih awal ya. Sampai jumpa di gym! 💪🔥`
}

export function getRenewalReminderMessage(data: WATemplateData): string {
  const remaining = data.remainingSessions ?? 0
  return `Halo ${data.clientName}! 👋

Semangat latihannya! Sekadar menginformasikan bahwa sisa sesi latihan kamu saat ini tinggal *${remaining} sesi* (${data.packageName || 'Paket PT'}).

Yuk perpanjang paket latihanmu sekarang agar progres fisik kamu tetap terjaga konsisten! 🏋️‍♂️✨`
}

export function getInactiveFollowUpMessage(data: WATemplateData): string {
  const days = data.daysInactive ?? 7
  return `Halo ${data.clientName}! 👋

Kangen latihan bareng nih! Sudah sekitar ${days} hari kamu belum sesi latihan.

Kapan ada waktu luang minggu ini untuk lanjut sesi latihan? Yuk atur jadwalnya lagi! 💪🔥`
}

export function getBirthdayMessage(data: WATemplateData): string {
  return `Selamat Ulang Tahun ${data.clientName}! 🎉🎂🥳

Semoga panjang umur, sehat selalu, dan makin konsisten mencapai fitness goal kamu!

Khusus hari ini, ada promo & bonus spesial untuk perpanjangan paket PT kamu. Yuk hubungi trainer kamu! 🎁💪`
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  if (!formattedPhone) return null
  const encodedText = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedText}`
}
