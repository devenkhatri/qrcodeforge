
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
  Download,
  Loader2,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

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

  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    setIsLoading(true);
    setQrCodeImage(null);

    let dataToEncode = "";
    if (qrType === "url") {
      if (!url) {
        toast({ title: "Error", description: "URL cannot be empty.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      dataToEncode = url;
    } else if (qrType === "contact") {
      const isValid = await contactForm.trigger();
      if (!isValid) {
        setIsLoading(false);
        return;
      }
      dataToEncode = generateVCard(contactForm.getValues());
    }

    if (!dataToEncode) {
      setIsLoading(false);
      return;
    }
    
    try {
      const generatedQr = await QRCode.toDataURL(dataToEncode, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      setQrCodeImage(generatedQr);
      toast({ title: "QR Code Generated", description: "Your QR code is ready." });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error(error);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
      setQrCodeImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeImage) {
        toast({ title: "Error", description: "No QR code to download.", variant: "destructive" });
        return;
    }
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            Configuration
          </CardTitle>
          <CardDescription>
            Choose your QR code type and enter the data to generate a QR code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={qrType} onValueChange={(v) => {
              setQrType(v as QrType);
              setQrCodeImage(null);
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
        </CardContent>
         <CardFooter>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <QrCode className="mr-2" />
                        Generate QR Code
                    </>
                )}
            </Button>
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
                <p className="mt-4 text-muted-foreground">Generating...</p>
              </div>
            )}
            {qrCodeImage ? (
              <Image
                src={qrCodeImage}
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
            <Button onClick={handleDownload} disabled={!qrCodeImage || isLoading} variant="secondary" className="w-full">
              <Download className="mr-2" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
