import ExcelJS from 'exceljs'
import { prisma } from '../plugins/prisma.js'
import path from 'path'
import os from 'os'
import { ExportType } from '@prisma/client'

export async function exportData(type: ExportType): Promise<{ fileKey: string; filePath: string; mimeType: string }> {
  const isCsv = type === 'TEAMS'
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(type)
  const ext = isCsv ? 'csv' : 'xlsx'
  const fileKey = `export_${type.toLowerCase()}_${Date.now()}.${ext}`
  const filePath = path.join(os.tmpdir(), fileKey)

  const mimeType = isCsv 
    ? 'text/csv' 
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  switch (type) {
    case 'USERS': {
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: 'Roles', key: 'roles', width: 30 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ]
      const users = await prisma.user.findMany({ include: { userRoles: { include: { role: true } } } })
      users.forEach(u => sheet.addRow({
        id: u.id, email: u.email, fullName: u.fullName,
        roles: u.userRoles.map(ur => ur.role.name).join(', '),
        createdAt: u.createdAt.toISOString(),
      }))
      break
    }
    case 'TEAMS': {
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Team Name', key: 'name', width: 30 },
        { header: 'Institution', key: 'institution', width: 30 },
        { header: 'Track', key: 'track', width: 25 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Members', key: 'members', width: 10 },
      ]
      const teams = await prisma.team.findMany({ include: { members: true } })
      teams.forEach(t => sheet.addRow({ id: t.id, name: t.name, institution: t.institution, track: t.track, status: t.currentStatus, members: t.members.length }))
      break
    }
    case 'SUBMISSIONS': {
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Team', key: 'team', width: 30 },
        { header: 'Version', key: 'version', width: 10 },
        { header: 'GISTDA Declared', key: 'gistda', width: 15 },
        { header: 'Review Status', key: 'review', width: 15 },
        { header: 'Submitted At', key: 'submittedAt', width: 20 },
      ]
      const subs = await prisma.submission.findMany({ where: { isActive: true }, include: { team: true, moderatorReview: true } })
      subs.forEach(s => sheet.addRow({ id: s.id, team: s.team.name, version: s.version, gistda: s.gistdaDeclared, review: s.moderatorReview?.status ?? 'PENDING', submittedAt: s.submittedAt.toISOString() }))
      break
    }
    case 'SCORES': {
      sheet.columns = [
        { header: 'Submission ID', key: 'submissionId', width: 36 },
        { header: 'Team', key: 'team', width: 30 },
        { header: 'Judge Count', key: 'judgeCount', width: 12 },
        { header: 'Weighted Score', key: 'score', width: 15 },
        { header: 'Calculated At', key: 'calculatedAt', width: 20 },
      ]
      const aggs = await prisma.scoreAggregate.findMany({ include: { team: true } })
      aggs.forEach(a => sheet.addRow({ submissionId: a.submissionId, team: a.team.name, judgeCount: a.judgeCount, score: a.totalWeighted.toFixed(2), calculatedAt: a.calculatedAt.toISOString() }))
      break
    }
  }

  // Style header row (only if Excel)
  if (!isCsv) {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FF00E5FF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF050D1A' } }
    await workbook.xlsx.writeFile(filePath)
  } else {
    await workbook.csv.writeFile(filePath)
  }

  return { fileKey, filePath, mimeType }
}
