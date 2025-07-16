import { QrCode } from "lucide-react";
import { QRCodeGenerator } from "@/components/qr-code-generator";

export default function Home() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-4 mb-4">
          <QrCode className="w-12 h-12 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            QRCodeForge
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create, customize, and optimize your QR codes with the power of AI. Turn simple links and contacts into beautifully branded, scannable art.
        </p>
      </header>
      <QRCodeGenerator />
    </div>
  );
}
