import { useEffect, useState } from "react";
import { Check, Sparkles, TrendingUp, Target, Shield, Zap, ExternalLink, ChevronRight, Mail, ArrowRight, Loader2, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface InviteLinkResponse {
  success: boolean;
  inviteLink: string | null;
  emailSent: boolean;
}

export default function Success() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    setSessionId(sid);

    if (!sid) {
      setTimeout(() => {
        setLocation('/subscribe');
      }, 3000);
    }
  }, [setLocation]);

  // Fetch the unique invite link
  const { data: inviteData, isLoading: isLoadingLink } = useQuery<InviteLinkResponse>({
    queryKey: ['/api/invite-link', sessionId],
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Keep polling every 2 seconds until we have the invite link (webhook may still be processing)
      if (!query.state.data?.inviteLink) {
        return 2000;
      }
      return false;
    },
    retry: 5,
    retryDelay: 1000,
  });

  const inviteLink = inviteData?.inviteLink;

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextSteps = [
    {
      icon: Sparkles,
      title: "Join Private VIP Channel",
      description: inviteLink 
        ? "Your exclusive invite link is ready! Click the button below to join the private signals channel."
        : "Your exclusive invite link is being generated...",
      action: inviteLink ? {
        label: "Join Telegram Channel",
        url: inviteLink,
        external: true
      } : null
    },
    {
      icon: Mail,
      title: "Check Your Email",
      description: "We've also sent your invite link to your email for safekeeping. Check your spam folder if you don't see it.",
      action: null
    },
    {
      icon: Target,
      title: "Start Trading",
      description: "You'll receive 3-5 premium signals daily with complete analysis, entry/exit points, and risk management.",
      action: null
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "87.5% Win Rate",
      description: "Proven track record over 12 months"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Every signal includes stop loss & position sizing"
    },
    {
      icon: Zap,
      title: "Real-time Alerts",
      description: "Instant notifications for all new signals"
    }
  ];

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
            <CardDescription>Redirecting to subscription page...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Welcome to Premium Signals | EntryLab</title>
        <meta name="description" content="Your subscription is confirmed! Access your private Telegram channel and start receiving premium signals." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Success Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-primary/10 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent glow-effect" />
          
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center space-y-8">
              {/* Success Animation */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-500/20 rounded-full border-4 border-emerald-500/30 animate-pulse">
                <Check className="w-12 h-12 text-emerald-500" />
              </div>

              <div className="space-y-4">
                <Badge className="mx-auto w-fit glow-badge" variant="outline" data-testid="badge-success">
                  <Sparkles className="w-3 h-3 mr-2" />
                  Subscription Confirmed
                </Badge>

                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 bg-clip-text text-transparent leading-tight animate-glow" data-testid="text-hero-title">
                  Welcome to<br />Premium Signals!
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
                  You're now part of an elite community of <span className="text-primary font-semibold">4,821+ profitable traders</span>
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="bg-card/50 border-primary/20 hover-elevate" data-testid={`benefit-${index}`}>
                    <CardContent className="p-6 text-center space-y-2">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" data-testid="text-steps-title">Next Steps</h2>
              <p className="text-xl text-muted-foreground">Get started in 3 simple steps</p>
            </div>

            <div className="space-y-6">
              {nextSteps.map((step, index) => (
                <Card key={index} className="hover-elevate" data-testid={`step-${index}`}>
                  <CardHeader className="flex flex-row items-start gap-4 pb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="no-default-hover-elevate">Step {index + 1}</Badge>
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                      </div>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    {index === 0 && isLoadingLink ? (
                      <Button size="lg" variant="outline" className="w-full" disabled data-testid={`button-step-${index}`}>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading your invite link...
                      </Button>
                    ) : step.action ? (
                      step.action.external ? (
                        <a 
                          href={step.action.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button size="lg" className="w-full" data-testid={`button-step-${index}`}>
                            {step.action.label}
                            <ExternalLink className="ml-2 h-5 w-5" />
                          </Button>
                        </a>
                      ) : (
                        <a href={step.action.url} className="w-full">
                          <Button size="lg" variant="outline" className="w-full" data-testid={`button-step-${index}`}>
                            {step.action.label}
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </Button>
                        </a>
                      )
                    ) : null}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Important Information */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Your Subscription Details
                  </h3>
                  <p className="text-sm pl-7">
                    Your payment has been processed successfully. You'll receive a confirmation email with your receipt and billing details.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Channel Access
                  </h3>
                  <p className="text-sm pl-7">
                    The private Telegram channel invite link has been sent to your email. Access is granted immediately and remains active as long as your subscription is valid.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Signal Delivery
                  </h3>
                  <p className="text-sm pl-7">
                    You'll receive 3-5 premium signals daily via Telegram. Each signal includes entry price, stop loss, take profit targets, position sizing, and risk management guidance.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Support & Questions
                  </h3>
                  <p className="text-sm pl-7">
                    Our analyst team is available 24/7 in the private channel to answer questions, provide market insights, and help you maximize your trading results.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Money-Back Guarantee
                  </h3>
                  <p className="text-sm pl-7">
                    Not satisfied? Request a full refund within 7 days, no questions asked. Just contact our support team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/20 to-background border-primary/30 text-center p-8 md:p-12 glow-card">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl mb-4">Ready to Start Trading?</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Join the private channel now and start receiving signals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingLink ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-lg font-medium">
                      Generating your exclusive invite link...
                    </p>
                  </div>
                ) : inviteLink ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-md">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                        <code className="flex-1 text-sm font-mono truncate" data-testid="text-invite-link">
                          {inviteLink}
                        </code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleCopyLink}
                          data-testid="button-copy-link"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <a 
                      href={inviteLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full max-w-md"
                    >
                      <Button size="lg" className="w-full text-lg py-6 hover:scale-105 transition-transform" data-testid="button-join-channel">
                        Join Private VIP Channel Now
                        <ExternalLink className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium">
                      Your unique invite link will appear here shortly
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We've also sent it to your email
                    </p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Can't find the email? Check your spam folder or contact support at support@entrylab.io
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
