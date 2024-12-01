"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Camera, LogIn, LogOut, Gift, ChevronRight, ChevronLeft, Info, MapPin } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import AdminDashboard from "./AdminDashboard"
import { PhotoComparison } from './PhotoComparison'

type UserType = 'tenant' | 'employee' | 'admin' | 'special' | null;

type Submission = {
  id: string;
  type: 'tenant' | 'employee' | 'special';
  streetName: string;
  apartmentNumber: string;
  city: string;
  structuralDefects: number;
  decayMagnitude: number;
  defectIntensity: number;
  description: string;
  photoUrl: string;
  date: string;
  submittedBy?: string;
  latitude?: number;
  longitude?: number;
};

type TenantAccount = {
  email: string;
  password: string;
  name: string;
  address: string;
  referenceImages: string[];
};

const tenantAccounts: TenantAccount[] = [
  {
    email: "lilybarbiers@gmail.com",
    password: "passlily",
    name: "Lily Barbiers",
    address: "Effestraat 1, Eindhoven",
    referenceImages: ["/images/Window_timo.png", "/images/Painting_timo.png", "/images/Window2_timo.png", "/images/mirror_timo.png", "/images/door_timo.png"],
  },
  {
    email: "vanroosmalen@gmail.com",
    password: "topopaenoma",
    name: "Willy en Nellie",
    address: "Bernstraat 77, Oisterwijk",
    referenceImages: ["/images/radiator_timo.png", "/images/window3_timo.png", "/images/tv_timo.png", "/images/seat_timo.png", "/images/painting2_timo.png"],
  },
  {
    email: "timmermans@gmail.com",
    password: "Jiti",
    name: "Johan en Ilona",
    address: "Sportlaan 3, Tilburg",
    referenceImages: ["/images/painting2_timo.png", "/images/radiator_timo.png", "/images/window3_timo.png", "/images/tv_timo_timo.png", "/images/seat_timo.png"],
  },
  {
    email: "t4@kw.com",
    password: "pass4",
    name: "Vietlinh 1",
    address: "Academialaan 5, Tilburg",
    referenceImages: ["/images/Vietlinh/vietlinh1.png", "/images/Vietlinh/vietlinh2.png", "/images/Vietlinh/vietlinh3.png", "/images/Vietlinh/vietlinh4.png", "/images/Vietlinh/vietlinh5.png"]
  },
  {
    email: "t5@kw.com",
    password: "pass5",
    name: "Vietlinh 2",
    address: "Duurstraat 10, Eindhoven",
    referenceImages: ["/images/Vietlinh/vietlinh1_2.png", "/images/Vietlinh/vietlinh2_2.png", "/images/Vietlinh/vietlinh3_2.png", "/images/Vietlinh/vietlinh4_2.png", "/images/Vietlinh/vietlinh5_2.png"]
  },
  {
    email: "t6@kw.com",
    password: "pass6",
    name: "Hanyue 1",
    address: "JADS, den Bosch",
    referenceImages: ["/images/t3-ref1.png", "/images/t3-ref2.png"]
  },
  {
    email: "t7@kw.com",
    password: "pass7",
    name: "Patryk 1",
    address: "Spoorlaan 3, Tilburg",
    referenceImages: ["/images/P1.png", "/images/P2.png", "/images/P3.png", "/images/P4.png", "/images/P5.png"]
  },
  {
    email: "t8@kw.com",
    password: "pass8",
    name: "Patryk 2",
    address: "Spoorlaan 3, Tilburg",
    referenceImages: ["/images/t3-ref1.png", "/images/t3-ref2.png"]
  },
  {
    email: "t9@kw.com",
    password: "pass9",
    name: "Shaghi 1",
    address: "Sportlaan 9, Eindhoven",
    referenceImages: ["/images/t3-ref1.png", "/images/t3-ref2.png"]
  },
  {
    email: "t10@kw.com",
    password: "pass10",
    name: "Hanyue 2",
    address: "JADS, den Bosch",
    referenceImages: ["/images/t3-ref1.png", "/images/t3-ref2.png"]
  }
];

export default function TenantPlatform() {
  const [currentStep, setCurrentStep] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [structuralDefects, setStructuralDefects] = useState(3)
  const [decayMagnitude, setDecayMagnitude] = useState(3)
  const [defectIntensity, setDefectIntensity] = useState(3)
  const [description, setDescription] = useState("")
  const [uploadedPhotosCount, setUploadedPhotosCount] = useState(0)
  const [userType, setUserType] = useState<UserType>(null)
  const [_submissions, setSubmissions] = useState<Submission[]>([])
  const [_selectedAddress, setSelectedAddress] = useState({ street: "", number: "", city: "" })
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [currentTenant, setCurrentTenant] = useState<TenantAccount | null>(null)
  const [currentReferenceImageIndex, setCurrentReferenceImageIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [showPhotoComparison, setShowPhotoComparison] = useState(false)
  const [comparisonScore, setComparisonScore] = useState<number | null>(null)
  
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          toast({
            title: "Locatie beoordeeld",
            description: "Je locatie is succesvol ontvangen",
            variant: "default",
          })
        },
        (error) => {
          console.error("Geolocation error:", error)
          toast({
            title: "Locatie fout",
            description: "Niet mogelijk om de locatie te achterhalen, sommige functies zullen daardoor beperkt zijn.",
            variant: "destructive",
          })
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Onbekende fout bij het openen van de camera'
      
      toast({
        title: "Camera Error",
        description: `Niet mogelijk om de camera te openen: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }, [toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `photo_${Date.now()}.jpg`, {
                type: 'image/jpeg'
              });
              setSelectedFile(file);
              stopCamera();
              setCurrentStep(currentStep + 1);
            }
          },
          'image/jpeg',
          1.0 // Maximum quality
        );
      }
    }
  }, [currentStep, stopCamera, setSelectedFile, setCurrentStep]);


  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    const tenant = tenantAccounts.find(account => account.email === email && account.password === password)
    if (tenant) {
      toast({
        title: "Login succesvol!",
        description: `Welkom bij het huurders platform van KleurrijkWonen, ${tenant.name}!`,
      })
      setUserType('tenant')
      setCurrentTenant(tenant)
      setCurrentStep(1)
    } else if (email === "employee@kw.com" && password === "employee") {
      toast({
        title: "Login succesvol!",
        description: "Welcome to the KleurijkWonen employee platform!",
      })
      setUserType('employee')
      setCurrentStep(10)
    } else if (email === "kevin@kw.com" && password === "admin") {
      toast({
        title: "Login successful!",
        description: "Welcome to the KleurijkWonen admin platform!",
      })
      setUserType('admin')
      setCurrentStep(20)
    } else {
      toast({
        title: "Login is niet gelukt",
        description: "Ongeldig email-adres of wachtwoord, probeer opnieuw",
        variant: "destructive",
      })
    }
    setDescription("")
  }

  const handleLogout = () => {
    setEmail("")
    setPassword("")
    setUserType(null)
    setCurrentStep(0)
    setDescription("")
    setCurrentTenant(null)
    setCurrentReferenceImageIndex(0)
    setUploadedPhotosCount(0)
    toast({
      title: "Uitgelogd",
      description: "Je bent succesvol uitgelogd",
    })
  }

  const getRewardLevel = (photoCount: number) => {
    if (photoCount >= 10) return "Goud"
    if (photoCount >= 5) return "Zilver"
    if (photoCount >= 1) return "Brons"
    return "None"
  }

  const resetAssessment = useCallback(() => {
    setStructuralDefects(3)
    setDecayMagnitude(3)
    setDefectIntensity(3)
    setDescription("")
    setSelectedFile(null)
    setShowPhotoComparison(false)
    setComparisonScore(null)
    setLocation(null)
  }, [])

  const [comparisonMessage, setComparisonMessage] = useState<string | null>(null)

  const handleComparisonComplete = (message: string) => {
    setComparisonMessage(message)
    if (message.toLowerCase().includes('good') || message.toLowerCase().includes('acceptable')) {
      toast({
        title: "Foto geaccepteerd",
        description: message,
        variant: "default",
      })
    } else {
      toast({
        title: "Foto moet worden aangepast",
        description: message,
        variant: "destructive",
      })
    }
  }


  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Maak eerst een foto voordat je hem verder gaat.",
        variant: "destructive",
      })
      return
    }
  
    setUploadProgress(0)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 500)
  
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('type', userType === 'tenant' ? 'tenant' : 'employee')

      if (userType === 'tenant' && currentTenant) {
        const [street, city] = currentTenant.address.split(',').map(s => s.trim())
        formData.append('streetName', street)
        formData.append('apartmentNumber', '1')
        formData.append('city', city)
        formData.append('submittedBy', currentTenant.email)
      } else if (userType === 'employee' && _selectedAddress) {
        formData.append('streetName', _selectedAddress.street)
        formData.append('apartmentNumber', _selectedAddress.number)
        formData.append('city', _selectedAddress.city)
        formData.append('submittedBy', email)
      } else {
        throw new Error('Invalid user type or missing address information')
      }

      // Ensure we're sending numbers or null for these fields
      formData.append('structuralDefects', structuralDefects !== null ? structuralDefects.toString() : '')
      formData.append('decayMagnitude', decayMagnitude !== null ? decayMagnitude.toString() : '')
      formData.append('defectIntensity', defectIntensity !== null ? defectIntensity.toString() : '')
      formData.append('description', description || '')

      if (location) {
        formData.append('latitude', location.latitude.toString())
        formData.append('longitude', location.longitude.toString())
      }

      console.log('Submitting form data:', Object.fromEntries(formData))

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })

      let data
      try {
        const textResponse = await response.text()
        data = textResponse ? JSON.parse(textResponse) : {}
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error('Invalid response format from server')
      }

      if (!response.ok) {
        console.error('Submission response error:', data)
        throw new Error(
          data.error || data.details || `Failed to submit the assessment (Status: ${response.status})`
        )
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (data && !data.error) {
        setSubmissions(prevSubmissions => [...prevSubmissions, data])

        if (userType === 'tenant') {
          setUploadedPhotosCount(prev => prev + 1)
        }

        resetAssessment()

        toast({
          title: "Submission Successful",
          description: "Your assessment has been submitted.",
          variant: "default",
        })

        setTimeout(() => {
          if (userType === 'tenant') {
            setCurrentStep(6)
          } else if (userType === 'employee') {
            setCurrentStep(15)
          }
        }, 1000)
      } else {
        throw new Error(data.error || 'Unknown submission error')
      }
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)

      console.error('Submission error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Het is mislukt om de beoordeling te versturen. Probeer het opnieuw.",
        variant: "destructive",
      })
    }
  }, [
    selectedFile,
    userType,
    currentTenant,
    _selectedAddress,
    email,
    structuralDefects,
    decayMagnitude,
    defectIntensity,
    description,
    location,
    toast,
    resetAssessment,
    setSubmissions,
    setUploadedPhotosCount,
    setCurrentStep
  ])
  
  
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Debounced description:", description)
    }, 300)
  
    return () => clearTimeout(timer)
  }, [description])

  useEffect(() => {
    if (currentStep === 3 && userType === 'tenant') {
      startCamera()
    } else {
      stopCamera()
    }
  }, [currentStep, userType, startCamera, stopCamera])

  const moveToNextReferenceImage = () => {
    if (currentTenant) {
      setCurrentReferenceImageIndex((prevIndex) => 
        (prevIndex + 1) % currentTenant.referenceImages.length
      )
    }
  }

  const tenantSteps = [
    // Step 1: Instructions
    <Card key="instructies" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Instructies & Informatie</CardTitle>
        <CardDescription>Help ons je leefplaats te verbeteren</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Waarom we je hulp nodig hebben:
          </h3>
          <p className="text-sm text-muted-foreground">
            Door het versturen van foto's en beoordelingen van je leefruimte help je ons met:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
            <li>Ruimtes te identificeren die onderhoud nodig hebben</li>
            <li>Prioriteiten stellen voor onderhoud en verbeteringen</li>
            <li>Het waarborgen van de veiligheid en comfort van onze huurders</li>
          </ul>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <Gift className="mr-2 h-4 w-4" />
            Wat jij krijgt:
          </h3>
          <p className="text-sm text-muted-foreground">
            Om je te bedanken voor je deelname wordt je beloond. We bepalen je beloning aan de hand van de hoeveelheid foto's die je hebt verstuurd:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
            <li>Brons: 1-4 foto's</li>
            <li>Zilver: 5-9 foto's</li>
            <li>Goud: 10+ foto's</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setCurrentStep(2)} className="w-full">
          Continue <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>,
    // Step 2: Example Photo
    <Card key="example" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Voorbeeld foto</CardTitle>
        <CardDescription>Zou jij deze foto voor ons kunnen namaken?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTenant && (
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={currentTenant.referenceImages[currentReferenceImageIndex]}
              alt={`Example photo ${currentReferenceImageIndex + 1}`}
              width={400}
              height={300}
              className="w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              Photo {currentReferenceImageIndex + 1} of {currentTenant.referenceImages.length}
            </div>
          </div>
        )}
        <Button onClick={() => setCurrentStep(3)} className="w-full">
          <Camera className="mr-2 h-4 w-4" /> Neem de foto
        </Button>
      </CardContent>
    </Card>,
    // Step 3: Capture Photo
    <Card key="capture" className="w-full max-w-md mx-auto h-[85vh] flex flex-col overflow-hidden my-4">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-lg">Foto maken</CardTitle>
        <CardDescription className="text-sm">Maak alsjeblieft een foto zoals in het voorbeeld</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-3 relative" ref={containerRef}>
        <div className="w-full h-full bg-muted rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0 py-3">
        <div className="w-full space-y-2">
          <Button onClick={capturePhoto} className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Foto maken
          </Button>
          {location ? (
            <div className="flex items-center justify-center text-sm text-green-600">
              <MapPin className="mr-1 h-4 w-4" /> Locatie gevonden
            </div>
          ) : (
            <div className="flex items-center justify-center text-sm text-yellow-600">
              <MapPin className="mr-1 h-4 w-4" /> Locatie zoeken...
            </div>
          )}
        </div>
      </CardFooter>
    </Card>,
    // Step 4: Photo Comparison
    <Card key="comparison" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Vergelijk foto's</CardTitle>
        <CardDescription>Controleer of je foto overeenkomt met de foto van het voorbeeld</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentTenant && (
          <PhotoComparison
            referenceImageSrc={currentTenant.referenceImages[currentReferenceImageIndex]}
            selectedFile={selectedFile}
            onComparisonComplete={handleComparisonComplete}
            onRetake={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(3)}
            onContinue={() => setCurrentStep(5)}
            canContinue={comparisonMessage !== null && !comparisonMessage.toLowerCase().includes('dark')}
          />
        )}
      </CardContent>
    </Card>,
    // Step 5: Condition Assessment
    <Card key="assessment" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Beoordeel de staat van het element</CardTitle>
        <CardDescription>Beordeel de staat van het element op een schaal van 1-6</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedFile && (
          <div className="rounded-lg overflow-hidden mb-6">
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Uploaded photo"
              width={400}
              height={300}
              className="w-full object-cover"
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Zijn er gebreken aan het element?</Label>
            <Slider
              value={[structuralDefects]}
              onValueChange={(value) => setStructuralDefects(value[0])}
              max={6}
              min={1}
              step={1}
            />
            <div className="text-sm text-muted-foreground text-center">{structuralDefects}/6</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Aanvullende Opmerkingen? (Optioneel)</Label>
            <Textarea
              id="description"
              placeholder="Any additional observations..."
              value={description}
              onChange={(e) => {
                const value = e.target.value
                requestAnimationFrame(() => {
                  setDescription(value)
                })
              }}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full mt-4">
          Verstuur <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>,
    // Step 6: Thank You and Rewards
    <Card key="thankyou" className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo.png"
            alt="KleurijkWonen Logo"
            width={200}
            height={80}
            className="rounded-lg"
          />
        </div>
        <CardTitle>Bedankt!</CardTitle>
        <CardDescription>Je inzending is ontvangen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadProgress < 100 ? (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              Verwerken van je inzending... {uploadProgress}%
            </p>
          </div>
        ) : (
          <>
            {selectedFile && (
              <div className="rounded-lg overflow-hidden">
                <Image
                  src={URL.createObjectURL(selectedFile)}
                  alt="Uploaded photo"
                  width={400}
                  height={300}
                  className="w-full object-cover"
                />
              </div>
            )}
            <div className="bg-muted p-4 rounded-lg text-center">
              <h3 className="font-semibold mb-2">Je belonings niveau!</h3>
              <p className="text-2xl font-bold">{getRewardLevel(uploadedPhotosCount)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Totaal aantal foto's verstuurd: {uploadedPhotosCount}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => {
                  moveToNextReferenceImage();
                  setCurrentStep(2);
                }} 
                className="w-full" 
                variant="outline"
              >
                Verstuur nog een andere foto
              </Button>
              <Button onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>,
  ]

  const employeeSteps = [
    // Step 10: Employee Dashboard
    <Card key="employeeDashboard" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Employee Dashboard</CardTitle>
        <CardDescription>Select a tenant address to inspect</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => {
          setSelectedAddress({ street: "Topstraat", number: "55", city: "Tiel" });
          setCurrentStep(11);
        }} className="w-full">
          Topstraat 55, Tiel
        </Button>
        <Button onClick={() => {
          setSelectedAddress({ street: "Kerkstraat", number: "23/4B", city: "Utrecht" });
          setCurrentStep(11);
        }} className="w-full">
          Kerkstraat 23/4B, Tiel
        </Button>
        <Button onClick={() => {
          setSelectedAddress({ street: "Schoolstraat", number: "15", city: "Boxtel" });
          setCurrentStep(11);
        }} className="w-full">
          Schoolstraat 15, Boxtel
        </Button>
      </CardContent>
      <CardFooter>
        <Button onClick={handleLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </CardFooter>
    </Card>,
    // Step 11: Example Photo
    <Card key="employeeExample" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Example Photo</CardTitle>
        <CardDescription>This is how your photo should look</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg overflow-hidden">
          <Image
            src="/images/jads-good2.png"
            alt="Example window frame"
            width={400}
            height={300}
            className="w-full object-cover"
          />
        </div>
        <Button onClick={() => setCurrentStep(12)} className="w-full">
          <Camera className="mr-2 h-4 w-4" /> Take Photo
        </Button>
      </CardContent>
    </Card>,
    // Step 12: Camera View
    <Card key="employeeCamera" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Take Photo</CardTitle>
        <CardDescription>Position the camera to capture the area clearly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => setCurrentStep(11)}>
            Cancel
          </Button>
          <Button onClick={capturePhoto}>
            Capture Photo
          </Button>
        </div>
      </CardContent>
    </Card>,
    // Step 13: Photo Comparison
<Card key="employeeComparison" className="w-full max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Compare Photos</CardTitle>
    <CardDescription>Please verify that your photo matches the example</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {selectedFile ? (
      <PhotoComparison
        referenceImageSrc="/images/timo.jpeg"
        selectedFile={selectedFile}
        onComparisonComplete={handleComparisonComplete}
        onRetake={() => setCurrentStep(12)}
        onBack={() => setCurrentStep(12)}
        onContinue={() => {
          if (comparisonMessage && !comparisonMessage.toLowerCase().includes('dark')) {
            setCurrentStep(14);
          }
        }}
      />
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Example Photo</Label>
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/images/jads-good2.png"
              alt="Example window frame"
              width={200}
              height={150}
              className="w-full object-cover"
            />
          </div>
        </div>
        <div>
          <Label>Your Photo</Label>
          <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center h-[150px]">
            <p className="text-muted-foreground">No photo captured</p>
          </div>
        </div>
      </div>
    )}
    {!selectedFile && (
      <div className="flex justify-center">
        <Button onClick={() => setCurrentStep(12)}>
          <Camera className="mr-2 h-4 w-4" /> Take Photo
        </Button>
      </div>
    )}
  </CardContent>
</Card>,
    // Step 14: Condition Assessment
    <Card key="employeeAssessment" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Assess the Condition</CardTitle>
        <CardDescription>Please rate the following aspects on a scale of 1-6</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedFile && (
          <div className="rounded-lg overflow-hidden mb-6">
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Uploaded photo"
              width={400}
              height={300}
              className="w-full object-cover"
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Are there defects to the structural element?</Label>
            <Slider
              value={[structuralDefects]}
              onValueChange={(value) => setStructuralDefects(value[0])}
              max={6}
              min={1}
              step={1}
            />
            <div className="text-sm text-muted-foreground text-center">{structuralDefects}/6</div>
          </div>
          <div className="space-y-2">
            <Label>What is the magnitude of the decay?</Label>
            <Slider
              value={[decayMagnitude]}
              onValueChange={(value) => setDecayMagnitude(value[0])}
              max={6}
              min={1}
              step={1}
            />
            <div className="text-sm text-muted-foreground text-center">{decayMagnitude}/6</div>
          </div>
          <div className="space-y-2">
            <Label>What is the intensity of the defects?</Label>
            <Slider
              value={[defectIntensity]}
              onValueChange={(value) => setDefectIntensity(value[0])}
              max={6}
              min={1}
              step={1}
            />
            <div className="text-sm text-muted-foreground text-center">{defectIntensity}/6</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Additional Information</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed observations..."
              value={description}
              onChange={(e) => {
                const value = e.target.value
                requestAnimationFrame(() => {
                  setDescription(value)
                })
              }}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full mt-4">
          Submit
        </Button>
      </CardContent>
    </Card>,
    // Step 15: Upload Progress
    <Card key="employeeUploadProgress" className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Uploading Submission</CardTitle>
        <CardDescription>Please wait while we process your submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-center text-muted-foreground">
            Processing submission... {uploadProgress}%
          </p>
        </div>
        {uploadProgress === 100 && (
          <div className="text-center">
            <p className="font-semibold text-green-600">Upload Complete!</p>
            <p className="text-sm text-muted-foreground mt-2">Returning to dashboard...</p>
          </div>
        )}
      </CardContent>
      {uploadProgress === 100 && (
        <CardFooter>
          <Button onClick={() => setCurrentStep(10)} className="w-full">
            Return to Dashboard
          </Button>
        </CardFooter>
      )}
    </Card>,
  ]

  const adminSteps = [
    <AdminDashboard
      key="adminDashboard"
      onLogout={handleLogout}
  />,
]

const loginStep = (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Voer uw gegevens in om toegang te verkrijgen tot het platform</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Vul hier je email-adres in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Wachtwoord</Label>
          <Input
            id="password"
            type="password"
            placeholder="Vul hier je wachtwoord in"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
      </form>
    </CardContent>
  </Card>
)

return (
  <div className="min-h-screen bg-background py-8 px-4">
    <div className="container max-w-lg mx-auto">
      {currentStep === 0 ? loginStep :
       userType === 'tenant' ? tenantSteps[currentStep - 1] :
       userType === 'employee' ? employeeSteps[currentStep - 10] :
       userType === 'admin' ? adminSteps[currentStep - 20] :
       null}
    </div>
    <canvas ref={canvasRef} style={{ display: 'none' }} width={400} height={300} />
  </div>
)
}