'use server'

import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

export async function generateNEN2767Report(submissionId: string) {
  try {
    // Fetch the submission with all details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      throw new Error('Submission not found')
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      font: join(process.cwd(), 'fonts', 'Helvetica.ttf')
    })

    const chunks: Buffer[] = []

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk))
    
    return new Promise<string>(async (resolve, reject) => {
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks)
        
        // Generate unique filename
        const fileName = `NEN2767-Report-${randomUUID()}.pdf`
        
        // Ensure reports directory exists
        const reportsDir = join(process.cwd(), 'public', 'reports')
        await mkdir(reportsDir, { recursive: true })
        
        // Save the PDF to public/reports
        const filePath = join(reportsDir, fileName)
        await writeFile(filePath, pdfBuffer)
        
        resolve(fileName)
      })

      doc.on('error', reject)

      // Register fonts
      doc.registerFont('Helvetica', join(process.cwd(), 'fonts', 'Helvetica.ttf'))
      doc.registerFont('Helvetica-Bold', join(process.cwd(), 'fonts', 'Helvetica-Bold.ttf'))

      // Calculate layout
      const pageWidth = doc.page.width
      const contentWidth = pageWidth - 100 // margins
      const textWidth = contentWidth * 0.6 // 60% for text
      const imageWidth = contentWidth * 0.4 // 40% for image
      const leftMargin = 50
      const rightMargin = leftMargin + textWidth + 20 // 20px spacing between text and image

      // Add title centered at the top
      doc.font('Helvetica-Bold').fontSize(20)
      doc.text('NEN2767 Inspection Report', { align: 'center' })
      doc.moveDown(2)

      // Add photo on the right side first
      try {
        const imageBuffer = Buffer.from(submission.photoUrl.split(',')[1], 'base64')
        doc.image(imageBuffer, rightMargin, 120, {
          fit: [imageWidth, 300],
          align: 'right'
        })
      } catch (error) {
        console.error('Error adding image to PDF:', error)
      }

      // Add text content on the left side
      doc.font('Helvetica-Bold').fontSize(14)
      doc.text('Property Information', leftMargin, 120)
      doc.font('Helvetica').fontSize(12)
      doc.text(`Address: ${submission.streetName} ${submission.apartmentNumber}`, leftMargin)
      doc.text(`City: ${submission.city}`, leftMargin)
      doc.text(`Inspection Date: ${submission.date.toLocaleDateString()}`, leftMargin)
      doc.moveDown()

      // Continue with text content on the left
      doc.font('Helvetica-Bold').fontSize(14)
      doc.text('Condition Assessment', leftMargin)
      doc.font('Helvetica').fontSize(12)
      doc.text(`Structural Defects: ${submission.structuralDefects}/6`, leftMargin)
      doc.text(`Decay Magnitude: ${submission.decayMagnitude}/6`, leftMargin)
      doc.text(`Defect Intensity: ${submission.defectIntensity}/6`, leftMargin)
      doc.moveDown()

      // Add the following lines after the Condition Assessment section:
      doc.moveDown()
      doc.font('Helvetica-Bold').fontSize(14)
      doc.text('Maintenance Assessment', leftMargin)
      doc.font('Helvetica').fontSize(12)
      doc.text(`Maintenance needed: ${submission.structuralDefects > 3 || submission.decayMagnitude > 3 || submission.defectIntensity > 3 ? 'Yes' : 'No'}`, leftMargin)
      doc.text('Costs: ???', leftMargin)
      doc.moveDown()

      // Description
      doc.font('Helvetica-Bold').fontSize(14)
      doc.text('Description', leftMargin)
      doc.font('Helvetica').fontSize(12)
      doc.text(submission.description || 'No description provided', leftMargin, doc.y, {
        width: textWidth,
        align: 'left'
      })
      doc.moveDown()

      // Location Data below other content
      if (submission.latitude && submission.longitude) {
        doc.font('Helvetica-Bold').fontSize(14)
        doc.text('Location Data', leftMargin)
        doc.font('Helvetica').fontSize(12)
        doc.text(`Latitude: ${submission.latitude}`, leftMargin)
        doc.text(`Longitude: ${submission.longitude}`, leftMargin)
      }

      // Finalize the PDF
      doc.end()
    })

  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}

