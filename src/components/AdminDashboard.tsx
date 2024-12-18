'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LogOut, AlertCircle, FileSpreadsheet, Users, Eye, FileText, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { generateNEN2767Report } from '@/app/actions/generate-report'

interface AdminDashboardProps {
  onLogout: () => void
}

interface Submission {
  id: string
  type: string
  streetName: string
  apartmentNumber: string
  city: string
  structuralDefects: number
  decayMagnitude: number
  defectIntensity: number
  description: string
  photoUrl: string
  date: string
  submittedBy?: string
  latitude?: number
  longitude?: number
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  //const [filter, setFilter] = useState('all')
  //const [sortOrder, setSortOrder] = useState('newest')
  //const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const [pendingSubmissions, setPendingSubmissions] = useState<Set<string>>(new Set())

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/submissions')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setSubmissions(data)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleGenerateReport = async (submissionId: string) => {
    if (pendingSubmissions.has(submissionId)) return

    setPendingSubmissions(prev => new Set(prev).add(submissionId))
    try {
      const { pdfFileName, csvFileName } = await generateNEN2767Report(submissionId)
    
      toast({
        title: "Reports Generated",
        description: "The NEN2767 PDF and CSV reports have been generated successfully.",
      })

      // Open the PDF report in a new tab
      window.open(`/reports/${pdfFileName}`, '_blank')

      // Provide a download link for the CSV file
      const csvLink = document.createElement('a')
      csvLink.href = `/reports/${csvFileName}`
      csvLink.download = csvFileName
      csvLink.click()

      // Trigger a refresh to ensure the new reports are available
      router.refresh()
    } catch (error) {
      console.error('Error generating reports:', error)
      toast({
        title: "Error",
        description: "Failed to generate the reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPendingSubmissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const filteredSubmissions = submissions

  const getTenantReports = () => submissions.filter(s => s.type === 'tenant').length
  const getEmployeeReports = () => submissions.filter(s => s.type === 'employee').length

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and view all submissions</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm font-medium">Total Submissions</span>
            </div>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Tenant Reports</span>
            </div>
            <p className="text-2xl font-bold">{getTenantReports()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Employee Reports</span>
            </div>
            <p className="text-2xl font-bold">{getEmployeeReports()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Removed filter controls section */}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Address</TableHead>
                <TableHead className="w-[10%]">Type</TableHead>
                <TableHead className="w-[15%]">Date</TableHead>
                <TableHead className="w-[35%]">Description</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading submissions...</TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No submissions found matching your criteria</TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.streetName} {submission.apartmentNumber}, {submission.city}
                    </TableCell>
                    <TableCell className="capitalize">{submission.type}</TableCell>
                    <TableCell>
                      {format(new Date(submission.date), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={submission.description}>
                        {submission.description || 'No description provided'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Submission Details</DialogTitle>
                              <DialogDescription>
                                {`Submitted on ${format(new Date(submission.date), 'dd MMMM yyyy HH:mm')}`}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-1">Location Details</h3>
                                  <p className="text-sm">
                                    {submission.streetName} {submission.apartmentNumber}
                                    <br />
                                    {submission.city}
                                  </p>
                                  {submission.latitude && submission.longitude && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      <MapPin className="h-4 w-4 inline mr-1" />
                                      {submission.latitude}, {submission.longitude}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-1">Description</h3>
                                  <p className="text-sm whitespace-pre-wrap">{submission.description}</p>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-1">Defect Assessment</h3>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Structural</p>
                                      <p className="font-medium">{submission.structuralDefects}/6</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Decay</p>
                                      <p className="font-medium">{submission.decayMagnitude}/6</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Intensity</p>
                                      <p className="font-medium">{submission.defectIntensity}/6</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Photo</h3>
                                <div className="aspect-video relative rounded-lg overflow-hidden border">
                                  {submission.photoUrl ? (
                                    <Image
                                      src={submission.photoUrl}
                                      alt="Submitted defect"
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      priority={false}
                                      unoptimized={process.env.NODE_ENV === 'development'}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                      <p className="text-muted-foreground">No photo available</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(submission.id)}
                          disabled={pendingSubmissions.has(submission.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

