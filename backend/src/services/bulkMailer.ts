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
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host, port, secure,
      auth: { type: 'OAuth2', user, clientId: oauthClientId, clientSecret: oauthClientSecret, refreshToken },
    })
  }

  if (!pass) throw new Error('SMTP_PASS is required when OAuth2 is not configured.')

  return nodemailer.createTransport({ 
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    host, port, secure, 
    auth: { user, pass } 
  })
}

export async function sendBulkEmail(input: BulkEmailInput): Promise<BulkEmailResult> {
  const transporter = createTransporter()
  let envFrom = process.env.SMTP_USER as string
  if (process.env.SMTP_FROM) {
    const match = process.env.SMTP_FROM.match(/<([^>]+)>/)
    envFrom = match ? match[1] : process.env.SMTP_FROM.replace(/["<>]/g, '').trim()
  }
  const from = `"${input.fromName || 'GeoAI Hackathon'}" <${envFrom}>`

  let sent = 0
  let failed = 0
  const failures: Array<{ email: string; reason: string }> = []

  // Process in limited concurrency batches
  const BATCH_SIZE = 10
  for (let i = 0; i < input.recipients.length; i += BATCH_SIZE) {
    const batch = input.recipients.slice(i, i + BATCH_SIZE)
    
    await Promise.all(batch.map(async (recipient) => {
      try {
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
    }))

    // Safety pause: Wait 1 second between batches to prevent spam-triggering
    if (i + BATCH_SIZE < input.recipients.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Close the pool since we're done
  transporter.close()

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
