import { prisma } from './prisma'

// Tüm tabloları listele
export async function getAllTables(): Promise<string[]> {
  const result = await prisma.$queryRaw<Array<{ Tables_in_teamspeak: string }>>`
    SHOW TABLES
  `
  return result.map((row) => row.Tables_in_teamspeak)
}

// Tablo verilerini sayfalı olarak çek
export async function getTableData(
  tableName: string,
  page: number = 1,
  limit: number = 50
) {
  const offset = (page - 1) * limit

  // Toplam kayıt sayısı
  const countResult = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) as total FROM ${prisma.$queryRawUnsafe(`${tableName}`)}
  `
  const total = Number(countResult[0]?.total || 0)

  // Verileri çek
  const data = await prisma.$queryRawUnsafe(
    `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`
  )

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

// Tablo kolon bilgilerini al
export async function getTableColumns(tableName: string) {
  const columns = await prisma.$queryRawUnsafe(`
    DESCRIBE ${tableName}
  `)
  return columns
}

// Yeni satır ekle
export async function insertRow(tableName: string, data: Record<string, any>) {
  const columns = Object.keys(data)
  const values = Object.values(data)

  const placeholders = values.map(() => '?').join(', ')
  const columnsStr = columns.join(', ')

  const sql = `INSERT INTO ${tableName} (${columnsStr}) VALUES (${placeholders})`

  await prisma.$queryRawUnsafe(sql, ...values)
}

// Satır güncelle
export async function updateRow(
  tableName: string,
  id: string | number,
  data: Record<string, any>
) {
  const columns = Object.keys(data)
  const values = Object.values(data)

  const setClause = columns.map((col) => `${col} = ?`).join(', ')

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`

  await prisma.$queryRawUnsafe(sql, ...values, id)
}

// Satır sil
export async function deleteRow(tableName: string, id: string | number) {
  await prisma.$queryRawUnsafe(
    `DELETE FROM ${tableName} WHERE id = ?`,
    id
  )
}

// Token ekle (TeamSpeak tokens tablosu için özel insert)
export async function insertToken(tokenKey: string) {
  const sql = `
    INSERT INTO tokens (server_id, token_key, token_type, token_id1, token_id2, token_created, token_description)
    VALUES (1, ?, 0, 2, 0, UNIX_TIMESTAMP(), 'Manual admin token')
  `

  await prisma.$queryRawUnsafe(sql, tokenKey)
}

// Tokenları listele
export async function getTokens(limit: number = 10) {
  const result = await prisma.$queryRawUnsafe(`
    SELECT * FROM tokens
    ORDER BY token_created DESC
    LIMIT ${limit}
  `)
  return result
}

// Token sayısı
export async function getTokenCount(): Promise<number> {
  const result = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM tokens
  `) as Array<{ count: bigint }>
  return Number(result[0]?.count || 0)
}
