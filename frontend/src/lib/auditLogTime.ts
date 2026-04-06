export function formatAuditLogTimestamp(createdAt: string) {
  const parsed = new Date(createdAt)

  return {
    dateLabel: parsed.toLocaleDateString(),
    timeLabel: parsed.toLocaleTimeString(),
  }
}
