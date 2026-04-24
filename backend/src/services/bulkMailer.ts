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
  let sent = 0
  let failed = 0
  const failures: Array<{ email: string; reason: string }> = []

  let transporter: nodemailer.Transporter | null = null
  let from = ''

  try {
    try {
      transporter = createTransporter()
      let envFrom = process.env.SMTP_USER as string
      if (process.env.SMTP_FROM) {
        const match = process.env.SMTP_FROM.match(/<([^>]+)>/)
        envFrom = match ? match[1] : process.env.SMTP_FROM.replace(/["<>]/g, '').trim()
      }
      from = `"${input.fromName || 'GeoAI Hackathon'}" <${envFrom}>`
    } catch (err: any) {
      console.error('BulkMailer: Setup failed:', err)
      throw new Error(`Email setup failed: ${err.message}`)
    }

    // Process in limited concurrency batches
    const BATCH_SIZE = 10
    
    // Pre-calculate plain text body once to save CPU
    const basePlainText = htmlToPlainText(input.htmlBody)
    console.log(`BulkMailer: Processing ${input.recipients.length} recipients in batches of ${BATCH_SIZE}`)

    for (let i = 0; i < input.recipients.length; i += BATCH_SIZE) {
      const batch = input.recipients.slice(i, i + BATCH_SIZE)
      console.log(`BulkMailer: Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} recipients)...`)
      
      const results = await Promise.all(batch.map(async (recipient) => {
        try {
          const name = recipient.fullName || 'Competitor'
          const email = recipient.email || ''
          
          if (!email) throw new Error('Recipient email is missing')

          const personalHtml = input.htmlBody
            .replace(/\{\{name\}\}/gi, escapeHtml(name))
            .replace(/\{\{email\}\}/gi, escapeHtml(email))

          const textBody = basePlainText
            .replace(/\{\{name\}\}/gi, name)
            .replace(/\{\{email\}\}/gi, email)

          if (!transporter) throw new Error('Transporter not initialized')

          await transporter.sendMail({
            from,
            to: email,
            subject: input.subject,
            html: personalHtml,
            text: textBody,
          })
          return { success: true, email }
        } catch (err: any) {
          let reason = err.message || 'Unknown error'
          if (err.code) reason += ` (${err.code})`
          if (err.response) reason += ` - ${err.response}`
          
          console.error(`BulkMailer: Failed for ${recipient.email}:`, reason)
          return { success: false, email: recipient.email, reason }
        }
      }))

      for (const r of results) {
        if (r.success) {
          sent++
        } else {
          failed++
          failures.push({ email: r.email, reason: r.reason! })
        }
      }

      // Safety pause: Wait 1 second between batches
      if (i + BATCH_SIZE < input.recipients.length) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  } finally {
    // Close the pool since we're done
    if (transporter) {
      console.log('BulkMailer: Closing transporter pool.')
      transporter.close()
    }
  }

  return { sent, failed, failures }
}

function escapeHtml(value: any): string {
  if (typeof value !== 'string') return String(value || '')
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Very lightweight HTML-to-plaintext strip for fallback text part */
function htmlToPlainText(html: any): string {
  if (typeof html !== 'string') return ''
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
