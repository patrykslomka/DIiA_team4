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
      },
      select: {
        id: true,
        filename: true,
        createdAt: true,
        submission: {
          select: {
            streetName: true,
            apartmentNumber: true,
            city: true,
          }
        }
      }
    })

    if (!report) {
      return new Response("Report not found", { status: 404 })
    }

    return new Response(JSON.stringify(report), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return new Response("Error processing request", { status: 500 })
  }
}

