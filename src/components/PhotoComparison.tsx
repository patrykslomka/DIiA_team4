import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

interface PhotoComparisonProps {
  referenceImageSrc: string;
  selectedFile: File | null;
  onComparisonComplete: (message: string) => void;
  onRetake?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
}

export function PhotoComparison({ 
  referenceImageSrc, 
  selectedFile, 
  onComparisonComplete,
  onRetake,
  onBack,
  onContinue,
  canContinue 
}: PhotoComparisonProps) {
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonMessage, setComparisonMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setCapturedImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  const compareImages = async () => {
    if (!selectedFile) {
      setError('No photo selected')
      return
    }

    setIsComparing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('image', selectedFile, 'captured.jpg')
      
      // Fetch the reference image and append it as a file
      const referenceImageResponse = await fetch(referenceImageSrc)
      const referenceImageBlob = await referenceImageResponse.blob()
      formData.append('image_comp', referenceImageBlob, 'reference.jpg')

      const response = await fetch('/api/compare-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data.message) {
        throw new Error('Invalid response from server')
      }

      setComparisonMessage(data.message)
      onComparisonComplete(data.message)
    } catch (error) {
      console.error('Error comparing images:', error)
      setError(error instanceof Error ? error.message : 'Failed to compare images. Please try again.')
    } finally {
      setIsComparing(false)
    }
  }

  if (!selectedFile || !capturedImageUrl) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No photo captured. Please go back and take a photo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Reference Image</h3>
          <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted">
            <Image
              src={referenceImageSrc}
              alt="Reference"
              fill
              className="object-contain rounded-lg"
              priority
              unoptimized
            />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Your Photo</h3>
          <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted">
            <Image
              src={capturedImageUrl}
              alt="Captured"
              fill
              className="object-contain rounded-lg"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
      <Button 
        onClick={compareImages} 
        disabled={isComparing}
        className="w-full"
      >
        {isComparing ? 'Comparing...' : 'Compare Images'}
      </Button>
      {comparisonMessage && (
        <Alert variant={comparisonMessage.toLowerCase().includes('dark') ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Photo Analysis Result</AlertTitle>
          <AlertDescription>{comparisonMessage}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onRetake}>
          Retake Photo
        </Button>
        <Button 
          onClick={onContinue} 
          disabled={!comparisonMessage || !comparisonMessage.includes("Great picture")}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

