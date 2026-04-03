import { PDFDocument, rgb, PageSizes } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Team, User, TeamMember } from '@prisma/client'

type TeamWithMembers = Team & {
  leader: User
  members: (TeamMember & { user: User })[]
}

const TRACK_LABELS: Record<string, string> = {
  SMART_AGRICULTURE: 'Smart Agriculture',
  DISASTER_FLOOD_RESPONSE: 'Disaster & Flood Response',
}

const EVENT_NAME = process.env.PDF_ORGANIZER_NAME || 'AGRI-DISASTER AI HACKATHON 2026'
const ORGANIZER_ORG = process.env.PDF_ORGANIZER_ORG || 'GEOAI Organizing Committee'

export async function generatePermissionLetter({ team }: { team: TeamWithMembers }): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  // Load custom fonts for Thai support
  // In Docker, fonts are in /app/fonts. In local dev, they are in backend/fonts.
  const fontPath = join(process.cwd(), 'fonts')
  const regularFontBytes = readFileSync(join(fontPath, 'Sarabun-Regular.ttf'))
  const boldFontBytes = readFileSync(join(fontPath, 'Sarabun-Bold.ttf'))

  const regularFont = await pdfDoc.embedFont(regularFontBytes)
  const boldFont = await pdfDoc.embedFont(boldFontBytes)

  const page = pdfDoc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()

  const CYAN = rgb(0, 0.898, 1)     // #00e5ff
  const NAVY = rgb(0.02, 0.078, 0.102)  // #050d1a
  const WHITE = rgb(1, 1, 1)
  const GRAY = rgb(0.4, 0.4, 0.4)

  // ── Header bar ──────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: NAVY })
  page.drawText('GEOAI HACKATHON', { x: 40, y: height - 38, size: 22, font: boldFont, color: CYAN })
  page.drawText('OFFICIAL PERMISSION LETTER', { x: 40, y: height - 62, size: 10, font: regularFont, color: WHITE })

  // Accent line
  page.drawRectangle({ x: 0, y: height - 93, width, height: 3, color: CYAN })

  // ── Title section ───────────────────────────────────────────
  let y = height - 140

  page.drawText('LETTER OF PARTICIPATION', { x: 40, y, size: 18, font: boldFont, color: NAVY })
  y -= 20
  page.drawText('FINALIST — ONSITE PRESENTATION', { x: 40, y, size: 11, font: boldFont, color: CYAN })
  y -= 30

  // Divider
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 20

  // Date
  const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  page.drawText(`Date: ${dateStr}`, { x: 40, y, size: 10, font: regularFont, color: GRAY })
  y -= 30

  // ── Body text ───────────────────────────────────────────────
  const bodyLines = [
    `This document certifies that the team member named below has been selected as a Finalist`,
    `in the ${EVENT_NAME}.`,
    ``,
    `The finalist is required to attend the Onsite Final Presentation event. This letter serves`,
    `as official documentation for academic and employer leave requests.`,
  ]

  for (const line of bodyLines) {
    page.drawText(line, { x: 40, y, size: 10, font: regularFont, color: rgb(0.15, 0.15, 0.15) })
    y -= 18
  }
  y -= 10

  // ── Team info box ───────────────────────────────────────────
  page.drawRectangle({ x: 40, y: y - 70, width: width - 80, height: 75, color: rgb(0.97, 0.99, 1), borderColor: CYAN, borderWidth: 1 })

  page.drawText('TEAM INFORMATION', { x: 52, y: y - 14, size: 8, font: boldFont, color: CYAN })
  page.drawText(`Team Name: ${team.name}`, { x: 52, y: y - 30, size: 10, font: regularFont, color: NAVY })
  page.drawText(`Institution: ${team.institution}`, { x: 52, y: y - 46, size: 10, font: regularFont, color: NAVY })
  page.drawText(`Track: ${TRACK_LABELS[team.track] ?? team.track}`, { x: 52, y: y - 62, size: 10, font: regularFont, color: NAVY })
  y -= 90

  // ── Member roster ───────────────────────────────────────────
  y -= 20
  page.drawText('TEAM MEMBERS', { x: 40, y, size: 12, font: boldFont, color: NAVY })
  y -= 15
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 8

  // Table header
  page.drawRectangle({ x: 40, y: y - 22, width: width - 80, height: 22, color: NAVY })
  page.drawText('#', { x: 48, y: y - 16, size: 9, font: boldFont, color: WHITE })
  page.drawText('FULL NAME', { x: 72, y: y - 16, size: 9, font: boldFont, color: WHITE })
  page.drawText('EMAIL', { x: 280, y: y - 16, size: 9, font: boldFont, color: WHITE })
  page.drawText('ROLE', { x: 450, y: y - 16, size: 9, font: boldFont, color: WHITE })
  y -= 22

  for (let i = 0; i < team.members.length; i++) {
    const member = team.members[i]
    const isLeader = member.userId === team.leaderId
    const rowColor = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 1)

    page.drawRectangle({ x: 40, y: y - 22, width: width - 80, height: 22, color: rowColor })
    page.drawText(String(i + 1), { x: 48, y: y - 16, size: 9, font: regularFont, color: NAVY })
    page.drawText(member.user.fullName, { x: 72, y: y - 16, size: 9, font: isLeader ? boldFont : regularFont, color: NAVY })
    page.drawText(member.user.email, { x: 280, y: y - 16, size: 8, font: regularFont, color: rgb(0.3, 0.3, 0.3) })
    page.drawText(isLeader ? 'LEADER' : 'MEMBER', { x: 450, y: y - 16, size: 8, font: boldFont, color: isLeader ? CYAN : GRAY })
    y -= 22
  }

  y -= 40

  // ── Signature section ───────────────────────────────────────
  page.drawText('AUTHORIZED BY', { x: 40, y, size: 9, font: boldFont, color: GRAY })
  y -= 50

  // Signature box (stamp placeholder)
  page.drawRectangle({ x: 40, y: y - 10, width: 180, height: 55, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 })
  page.drawText('[Official Stamp]', { x: 70, y: y + 12, size: 9, font: regularFont, color: rgb(0.6, 0.6, 0.6) })
  page.drawLine({ start: { x: 40, y: y - 14 }, end: { x: 220, y: y - 14 }, thickness: 1, color: NAVY })
  page.drawText(ORGANIZER_ORG, { x: 40, y: y - 26, size: 9, font: boldFont, color: NAVY })
  page.drawText(EVENT_NAME, { x: 40, y: y - 40, size: 7, font: regularFont, color: GRAY })

  // ── Footer ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 35, color: NAVY })
  page.drawText('GEOAI HACKATHON · PROPRIETARY DOCUMENT · NOT FOR REDISTRIBUTION', {
    x: 40, y: 12, size: 7, font: regularFont, color: rgb(0.5, 0.6, 0.7),
  })
  page.drawText(`Generated: ${new Date().toISOString()}`, {
    x: width - 220, y: 12, size: 7, font: regularFont, color: rgb(0.5, 0.6, 0.7),
  })

  return pdfDoc.save()
}
