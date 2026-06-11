import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold">Terms of Service</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="geometric-clip">
          <CardContent className="p-6 md:p-10 space-y-6 text-sm leading-relaxed">
            <div className="text-center space-y-2 pb-4 border-b border-border">
              <h1 className="text-2xl md:text-3xl font-bold">STINE DIGITAL TERMS OF SERVICE & USER AGREEMENT</h1>
              <p className="text-muted-foreground">Last Updated: June 2026</p>
            </div>

            <p>Welcome to STINE. By accessing or using our mobile application, web platform, and AI audio tools, you agree to be bound by these Terms.</p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">1. Creator Music Uploads & Copyright Ownership</h2>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Independent artists, producers, and DJs retain <strong>100% ownership</strong> of their uploaded masters and musical compositions.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>By uploading audio content via the STINE Creator Studio, you grant STINE a non-exclusive, worldwide, royalty-free license to stream, host, and distribute your audio to users.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>You strictly certify that you own all copyrights or possess the necessary explicit commercial licenses for any audio, vocals, or samples uploaded. Unauthorized copyrighted material will be subject to immediate removal under our take-down policy.</span></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">2. Revenue Share & Automated Payouts</h2>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Creators verified as Official STINE DJs or Broadcasters are eligible to earn revenue from user streams and subscription metrics.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong>The Split Matrix:</strong> STINE retains a standard <strong>30% platform commission fee</strong> on gross creator earnings to cover operational costs, hosting, and payment gateway fees. The remaining <strong>70% net balance</strong> belongs entirely to the creator.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong>Settlement:</strong> Payouts are calculated dynamically and disbursed directly to the creator's verified Nigerian or international settlement accounts via our automated dashboard approval button. Creators are responsible for providing accurate billing and bank routing details.</span></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">3. Subscription Tiers, Limits, and Abuse</h2>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Users agree to the platform limitations mapped to their active billing tier (including download limits, mixer allocation caps, and audio streaming bitrates).</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Manipulating stream counts using automated bots, scripts, or external exploitation tools is <strong>strictly prohibited</strong> and will result in permanent account termination and forfeiture of earnings.</span></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">4. Fair Use of AI & Developer Tools</h2>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>STINE provides advanced AI audio mixing and music creation tools. Users are strictly prohibited from using these tools to maliciously clone the voices or copyrighted identities of real-world artists without documented permission.</span></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">5. DMCA & Infringement Take-Down Claims</h2>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>If you believe your copyrighted work has been uploaded to STINE without authorization, please submit a formal take-down notice to <a href="mailto:legal@stine.app" className="text-primary underline">legal@stine.app</a> containing proof of ownership. We enforce a <strong>24-to-48-hour removal window</strong> for verified claims.</span></li>
              </ul>
            </section>

            <div className="pt-4 border-t border-border text-muted-foreground text-xs">
              <p>By using STINE, you confirm you have read, understood, and agree to these Terms of Service. These terms are effective as of June 2026 and may be updated with notice.</p>
            </div>

            <Button className="w-full geometric-gradient text-primary-foreground" onClick={() => window.history.back()}>
              I Understand — Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
