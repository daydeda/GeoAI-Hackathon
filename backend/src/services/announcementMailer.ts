import nodemailer from 'nodemailer'

type AnnouncementResult = 'QUALIFIED' | 'DISQUALIFIED'

type AnnouncementMailInput = {
  to: string
  recipientName: string
  teamName: string
  projectName?: string
  result: AnnouncementResult
}

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const refreshToken = process.env.SMTP_REFRESH_TOKEN
  const oauthClientId = process.env.GOOGLE_CLIENT_ID
  const oauthClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!user) {
    throw new Error('SMTP_USER is required.')
  }

  if (refreshToken && oauthClientId && oauthClientSecret) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        type: 'OAuth2',
        user,
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        refreshToken,
      },
    })
  }

  if (!pass) {
    throw new Error('SMTP_PASS is required when OAuth2 is not configured.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildAnnouncementEmail(input: AnnouncementMailInput): {
  subject: string
  html: string
  text: string
} {
  const safeTeam = escapeHtml(input.teamName)
  const projectName = escapeHtml(input.projectName || 'GeoAI Hackathon')

  if (input.result === 'QUALIFIED') {
    return {
      subject: `ยินดีด้วย! ทีมของคุณผ่านเข้ารอบโครงการ ${projectName}`,
      text: `สวัสดีทีม ${input.teamName},\n\nเรามีความยินดีที่จะแจ้งให้ทราบว่าทีมของคุณผ่านการคัดเลือกเข้าสู่รอบถัดไปของโครงการ ${input.projectName || 'GeoAI Hackathon'}\n\nทีมงานจะติดต่อรายละเอียดขั้นตอนถัดไปเร็วๆ นี้\n\nขอแสดงความยินดีและขอบคุณที่เข้าร่วม`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
          <h2 style="color:#0ea5e9; margin:0 0 12px;">ยินดีด้วย! ทีมของคุณผ่านเข้ารอบ</h2>
          <p>สวัสดีครับ/ค่ะทีม <strong>${safeTeam}</strong>,</p>
          <p>
            เรามีความยินดีที่จะแจ้งให้ทราบว่าทีมของคุณ <strong>ผ่านการคัดเลือก</strong>
            เข้าสู่รอบถัดไปของโครงการ <strong>${projectName}</strong>
          </p>
          <p>
            ขั้นตอนถัดไป: ทีมงานจะติดต่อรายละเอียดกำหนดการและข้อกำหนดเพิ่มเติมให้ทางอีเมลนี้
          </p>
          <p>ขอแสดงความยินดีอีกครั้ง และขอบคุณที่เข้าร่วมการแข่งขัน</p>
          <p style="margin-top:16px; color:#64748b;">Best regards,<br/>${projectName} Team</p>
        </div>
      `,
    }
  }

  return {
    subject: `ประกาศผลการคัดเลือกโครงการ ${projectName}`,
    text: `สวัสดีทีม ${input.teamName},\n\nคณะกรรมการได้พิจารณาผลงานของท่านแล้ว และต้องขออภัยที่ต้องแจ้งว่าทีมของท่านไม่ผ่านการคัดเลือกในครั้งนี้\n\nขอขอบคุณที่ให้ความสนใจและเข้าร่วมโครงการ ${input.projectName || 'GeoAI Hackathon'}\n\nหวังเป็นอย่างยิ่งว่าจะได้พบกันอีกในกิจกรรมครั้งต่อไป`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#0f172a;">
        <h2 style="color:#ef4444; margin:0 0 12px;">ประกาศผลการคัดเลือก</h2>
        <p>สวัสดีครับ/ค่ะทีม <strong>${safeTeam}</strong>,</p>
        <p>
          คณะกรรมการได้พิจารณาผลงานของท่านแล้ว และต้องขออภัยที่ต้องแจ้งว่า
          ทีมของท่าน <strong>ไม่ผ่านการคัดเลือก</strong> ในครั้งนี้
        </p>
        <p>
          อย่างไรก็ตาม เราขอขอบคุณที่ท่านให้ความสนใจและสละเวลาเข้าร่วมโครงการ
          <strong> ${projectName}</strong>
        </p>
        <p>หวังเป็นอย่างยิ่งว่าจะได้พบกันอีกในกิจกรรมครั้งต่อไป</p>
        <p style="margin-top:16px; color:#64748b;">Best regards,<br/>${projectName} Team</p>
      </div>
    `,
  }
}

export async function sendAnnouncementEmail(input: AnnouncementMailInput): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from) {
    throw new Error('SMTP_FROM or SMTP_USER must be configured.')
  }

  const content = buildAnnouncementEmail(input)
  await transporter.sendMail({
    from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  })
}
