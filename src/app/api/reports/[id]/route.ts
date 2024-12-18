import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.report.findUnique({
      where: {
        id: params.id
      }
    })

    if (!report) {
      return new Response("Report not found", { status: 404 })
    }

    // Set the appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Disposition', `inline; filename="${report.filename}"`)
    headers.set('Content-Type', 'application/pdf')

    // Return the report content as a downloadable file
    return new Response(report.content, {
      headers: headers,
    })
  } catch (error) {
    console.error('Error serving report:', error)
    return new Response("Error processing request", { status: 500 })
  }
}

