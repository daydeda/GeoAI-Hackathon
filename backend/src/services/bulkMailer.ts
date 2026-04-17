import nodemailer from 'nodemailer'

export type BulkEmailRecipient = {
  userId: string
  email: string
  fullName: string
}

export type BulkEmailInput = {
  subject: string
  /** Raw HTML body — sanitized by caller before passing in */
  htmlBody: string
  recipients: BulkEmailRecipient[]
  fromName?: string
}

export type BulkEmailResult = {
  sent: number
  failed: number
  failures: Array<{ email: string; reason: string }>
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

  if (!user) throw new Error('SMTP_USER is required.')

  if (refreshToken && oauthClientId && oauthClientSecret) {
    return nodemailer.createTransport({
      host, port, secure,
      auth: { type: 'OAuth2', user, clientId: oauthClientId, clientSecret: oauthClientSecret, refreshToken },
    })
  }

  if (!pass) throw new Error('SMTP_PASS is required when OAuth2 is not configured.')

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

export async function sendBulkEmail(input: BulkEmailInput): Promise<BulkEmailResult> {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM
    ? `"${input.fromName || 'GeoAI Hackathon'}" <${process.env.SMTP_FROM}>`
    : (process.env.SMTP_USER as string)

  let sent = 0
  let failed = 0
  const failures: Array<{ email: string; reason: string }> = []

  for (const recipient of input.recipients) {
    try {
      // Personalise the HTML: replace {{name}} placeholder if used
      const personalHtml = input.htmlBody
        .replace(/\{\{name\}\}/gi, escapeHtml(recipient.fullName))
        .replace(/\{\{email\}\}/gi, escapeHtml(recipient.email))

      const textBody = htmlToPlainText(input.htmlBody)
        .replace(/\{\{name\}\}/gi, recipient.fullName)
        .replace(/\{\{email\}\}/gi, recipient.email)

      await transporter.sendMail({
        from,
        to: recipient.email,
        subject: input.subject,
        html: personalHtml,
        text: textBody,
      })
      sent++
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error'
      failures.push({ email: recipient.email, reason })
      failed++
    }
  }

  return { sent, failed, failures }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Very lightweight HTML-to-plaintext strip for fallback text part */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
