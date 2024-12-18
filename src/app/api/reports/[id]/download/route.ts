import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = join(process.cwd(), 'public', 'reports', params.filename)
    const fileBuffer = await readFile(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `inline; filename="${params.filename}"`,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return new NextResponse('PDF not found', { status: 404 })
  }
}

