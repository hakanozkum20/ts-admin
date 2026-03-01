import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTableData, getTableColumns, insertRow, updateRow, deleteRow, getAllTables } from '@/lib/db'
import { NextResponse } from 'next/server'

// Fix BigInt serialization for JSON responses
;(BigInt.prototype as any).toJSON = function () {
  return Number(this)
}

// Whitelist for SQL injection protection
async function isValidTable(tableName: string): Promise<boolean> {
  const tables = await getAllTables()
  return tables.includes(tableName)
}

// GET - Tablo verilerini çek
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    const tableName = name

    // Whitelist kontrolü
    if (!(await isValidTable(tableName))) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // Query parametrelerini al
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Verileri çek
    const result = await getTableData(tableName, page, limit)
    const columns = await getTableColumns(tableName)

    return NextResponse.json({
      tableName,
      columns,
      ...result
    })
  } catch (error) {
    console.error('Error fetching table data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    )
  }
}

// POST - Yeni satır ekle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    const tableName = name

    // Whitelist kontrolü
    if (!(await isValidTable(tableName))) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    const data = await request.json()

    // Yeni satır ekle
    await insertRow(tableName, data)

    return NextResponse.json({
      success: true,
      message: 'Row added successfully'
    })
  } catch (error) {
    console.error('Error adding row:', error)
    return NextResponse.json(
      { error: 'Failed to add row' },
      { status: 500 }
    )
  }
}

// PUT - Satır güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    const tableName = name

    // Whitelist kontrolü
    if (!(await isValidTable(tableName))) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // URL'den id'yi al
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const data = await request.json()

    // Satır güncelle
    await updateRow(tableName, id, data)

    return NextResponse.json({
      success: true,
      message: 'Row updated successfully'
    })
  } catch (error) {
    console.error('Error updating row:', error)
    return NextResponse.json(
      { error: 'Failed to update row' },
      { status: 500 }
    )
  }
}

// DELETE - Satır sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await params
    const tableName = name

    // Whitelist kontrolü
    if (!(await isValidTable(tableName))) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // URL'den id'yi al
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Satır sil
    await deleteRow(tableName, id)

    return NextResponse.json({
      success: true,
      message: 'Row deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting row:', error)
    return NextResponse.json(
      { error: 'Failed to delete row' },
      { status: 500 }
    )
  }
}
