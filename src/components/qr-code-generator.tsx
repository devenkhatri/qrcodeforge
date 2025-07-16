
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import QRCode from "qrcode";
import {
  QrCode,
  Link,
  Contact,
  Palette,
  Eye,
  Shapes,
  Upload,
  Sparkles,
  Download,
  Loader2,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { handleOptimize } from "@/app/actions";

type QrType = "url" | "contact";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  org: z.string().optional(),
  title: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function QRCodeGenerator() {
  const { toast } = useToast();
  const [qrType, setQrType] = useState<QrType>("url");
  const [url, setUrl] = useState("https://firebase.google.com/");
  const [logo, setLogo] = useState<string | null>(null);
  const [shapeColor, setShapeColor] = useState("#673AB7");
  const [eyeShape, setEyeShape] = useState("square");
  const [dotShape, setDotShape] = useState("square");

  const [baseQr, setBaseQr] = useState<string | null>(null);
  const [optimizedQr, setOptimizedQr] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "", org: "", title: "" },
  });

  const generateVCard = (data: ContactFormValues) => {
    let vCard = "BEGIN:VCARD\nVERSION:3.0\n";
    vCard += `FN:${data.name}\n`;
    vCard += `N:${data.name};;;\n`;
    if (data.org) vCard += `ORG:${data.org}\n`;
    if (data.title) vCard += `TITLE:${data.title}\n`;
    if (data.phone) vCard += `TEL;TYPE=CELL:${data.phone}\n`;
    if (data.email) vCard += `EMAIL:${data.email}\n`;
    vCard += "END:VCARD";
    return vCard;
  };

  const handleGenerateBaseQr = async () => {
    let dataToEncode = "";
    if (qrType === "url") {
      if (!url) {
        toast({ title: "Error", description: "URL cannot be empty.", variant: "destructive" });
        return;
      }
      dataToEncode = url;
    } else if (qrType === "contact") {
      const isValid = await contactForm.trigger();
      if (!isValid) return;
      dataToEncode = generateVCard(contactForm.getValues());
    }

    if (dataToEncode) {
      try {
        const qrCodeDataUri = await QRCode.toDataURL(dataToEncode, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
        setBaseQr(qrCodeDataUri);
        setOptimizedQr(null); // Reset optimized QR on new generation
        setReport(null);
        toast({ title: "Success", description: "QR Code generated!" });
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not generate QR code.", variant: "destructive" });
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newLogo = event.target?.result as string;
        setLogo(newLogo);
      };
      reader.readAsDataURL(file);
    }
  };

  const onOptimize = async () => {
    if (!baseQr) {
      await handleGenerateBaseQr();
      // Use a timeout to wait for state update before proceeding
      setTimeout(() => {
        // Need to read baseQr from a new closure after timeout
        setBaseQr(currentBaseQr => {
          if (!currentBaseQr) {
            toast({ title: "Error", description: "Please generate a base QR code first.", variant: "destructive" });
            return null;
          }
          runOptimization(currentBaseQr);
          return currentBaseQr;
        })
      }, 100);
    } else {
      runOptimization(baseQr);
    }
  };

  const runOptimization = async (qrCodeDataUri: string) => {
    setIsLoading(true);
    setReport(null);
    try {
      const result = await handleOptimize({
        qrCodeDataUri,
        logoDataUri: logo || undefined,
        shapeColor,
        eyeShape,
        dotShape,
      });

      if (result.success && result.data) {
        setOptimizedQr(result.data.optimizedQrCodeDataUri);
        setReport(result.data.optimizationReport);
        toast({ title: "AI Optimization Complete", description: "Your QR code is now optimized for performance and style." });
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error(error);
      toast({ title: "Optimization Failed", description: errorMessage, variant: "destructive" });
      setOptimizedQr(null);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = optimizedQr || baseQr || "";
    if (!link.href) {
        toast({ title: "Error", description: "No QR code to download.", variant: "destructive" });
        return;
    }
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentQrImage = optimizedQr || baseQr;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            Configuration
          </CardTitle>
          <CardDescription>
            Choose your QR code type, enter the data, and customize its appearance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={qrType} onValueChange={(v) => {
              setQrType(v as QrType);
              setBaseQr(null);
              setOptimizedQr(null);
              setReport(null);
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url"><Link className="mr-2" />URL</TabsTrigger>
              <TabsTrigger value="contact"><Contact className="mr-2" />Contact Card</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="pt-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            </TabsContent>
            <TabsContent value="contact" className="pt-4">
              <Form {...contactForm}>
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={contactForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={contactForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="+1 123 456 7890" {...field} /></FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={contactForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="john.doe@email.com" {...field} /></FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={contactForm.control} name="org" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl><Input placeholder="Company Inc." {...field} /></FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={contactForm.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl><Input placeholder="Software Engineer" {...field} /></FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <Accordion type="multiple" className="w-full mt-6" defaultValue={["appearance"]}>
            <AccordionItem value="appearance">
              <AccordionTrigger>
                <div className="flex items-center gap-2"><Palette />Appearance</div>
              </AccordionTrigger>
              <AccordionContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="shapeColor">Shape Color</Label>
                  <div className="relative">
                    <Input id="shapeColor" type="color" value={shapeColor} onChange={e => setShapeColor(e.target.value)} className="p-1 h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eyeShape"><Eye className="inline-block mr-1 w-4 h-4"/>Eye Shape</Label>
                  <Select value={eyeShape} onValueChange={setEyeShape}>
                    <SelectTrigger><SelectValue placeholder="Select eye shape" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dotShape"><Shapes className="inline-block mr-1 w-4 h-4" />Dot Shape</Label>
                   <Select value={dotShape} onValueChange={setDotShape}>
                    <SelectTrigger><SelectValue placeholder="Select dot shape" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="logo">
              <AccordionTrigger>
                <div className="flex items-center gap-2"><Upload />Logo</div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                    <Label htmlFor="logo-upload">Upload your logo (optional)</Label>
                    <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} />
                </div>
                {logo && <div className="mt-4"><Image src={logo} alt="Logo preview" width={64} height={64} className="rounded-md border" /></div>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
        </CardContent>
         <CardFooter>
            <Button onClick={handleGenerateBaseQr} className="w-full">Generate QR Code</Button>
        </CardFooter>
      </Card>

      <div className="sticky top-8">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Your generated QR code will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center aspect-square relative bg-muted/50 rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col justify-center items-center z-10 rounded-lg">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">AI is optimizing...</p>
              </div>
            )}
            {currentQrImage ? (
              <Image
                src={currentQrImage}
                alt="Generated QR Code"
                width={300}
                height={300}
                className="rounded-md object-contain"
                data-ai-hint="qr code"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="mx-auto w-16 h-16" />
                <p className="mt-2">Your QR code is waiting</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4 mt-6">
            <Button onClick={onOptimize} disabled={isLoading} className="w-full">
              <Sparkles className="mr-2" />
              Optimize with AI
            </Button>
            <Button onClick={handleDownload} disabled={!currentQrImage || isLoading} variant="secondary" className="w-full">
              <Download className="mr-2" />
              Download
            </Button>
            {report && (
                <Alert className="w-full mt-4 transition-all duration-500 ease-in-out">
                    <Info className="h-4 w-4" />
                    <AlertTitle>AI Optimization Report</AlertTitle>
                    <AlertDescription>
                        {report}
                    </AlertDescription>
                </Alert>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
