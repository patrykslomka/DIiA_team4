'use server'

import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { join } from 'path'
import { writeFile } from 'fs/promises'
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

    // Create a new PDF document with explicit font configuration
    const doc = new PDFDocument({
      font: join(process.cwd(), 'fonts', 'Helvetica.ttf'),
      size: 'A4'
    })

    const chunks: Buffer[] = []

    // Collect PDF chunks
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Return promise that resolves with PDF buffer
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks)
        
        // Save the PDF to a file
        const fileName = `NEN2767-Report-${randomUUID()}.pdf`
        const filePath = join(process.cwd(), 'public', 'reports', fileName)
        await writeFile(filePath, pdfBuffer)

        resolve(pdfBuffer)
      })

      doc.on('error', reject)

      // Register font family
      doc.registerFont('Helvetica', join(process.cwd(), 'fonts', 'Helvetica.ttf'))
      doc.registerFont('Helvetica-Bold', join(process.cwd(), 'fonts', 'Helvetica-Bold.ttf'))

      // Add content to PDF using registered fonts
      doc.font('Helvetica-Bold').fontSize(20).text('NEN2767 Inspection Report', { align: 'center' })
      doc.moveDown()
      
      // Property Information
      doc.font('Helvetica-Bold').fontSize(14).text('Property Information')
      doc.font('Helvetica').fontSize(12)
      doc.text(`Address: ${submission.streetName} ${submission.apartmentNumber}`)
      doc.text(`City: ${submission.city}`)
      doc.text(`Inspection Date: ${submission.date.toLocaleDateString()}`)
      doc.moveDown()

      // Condition Assessment
      doc.font('Helvetica-Bold').fontSize(14).text('Condition Assessment')
      doc.font('Helvetica').fontSize(12)
      doc.text(`Structural Defects: ${submission.structuralDefects}/6`)
      doc.text(`Decay Magnitude: ${submission.decayMagnitude}/6`)
      doc.text(`Defect Intensity: ${submission.defectIntensity}/6`)
      doc.moveDown()

      // Description
      doc.font('Helvetica-Bold').fontSize(14).text('Description')
      doc.font('Helvetica').fontSize(12)
      doc.text(submission.description || 'No description provided')
      doc.moveDown()

      // Location Data
      if (submission.latitude && submission.longitude) {
        doc.font('Helvetica-Bold').fontSize(14).text('Location Data')
        doc.font('Helvetica').fontSize(12)
        doc.text(`Latitude: ${submission.latitude}`)
        doc.text(`Longitude: ${submission.longitude}`)
      }

      // Finalize the PDF
      doc.end()
    })

  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}

