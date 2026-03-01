import { DataTable } from '@/components/data-table'
import { getTableData, getTableColumns, getAllTables } from '@/lib/db'
import { notFound } from 'next/navigation'

type TableColumn = {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: string | null
  Extra: string
}

type TableRow = Record<string, unknown>

export default async function TablePage({
  params,
  searchParams
}: {
  params: Promise<{ name: string }>
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const { name } = await params
  const { page = '1', limit = '50' } = await searchParams

  // Tablo adı doğrulama
  const tables = await getAllTables()
  if (!tables.includes(name)) {
    notFound()
  }

  // Verileri çek
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const result = await getTableData(name, pageNum, limitNum)
  const columns = await getTableColumns(name)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight capitalize">{name}</h1>
        <p className="text-muted-foreground">
          Viewing table data with {result.total} total rows
        </p>
      </div>
      <DataTable
        tableName={name}
        columns={columns as TableColumn[]}
        data={result.data as TableRow[]}
        total={result.total}
        page={result.page}
        limit={result.limit}
        totalPages={result.totalPages}
      />
    </div>
  )
}
