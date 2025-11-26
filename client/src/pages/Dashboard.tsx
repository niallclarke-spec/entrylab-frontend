import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertCircle, Send, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  telegramConnected: boolean;
  email: string;
}

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch('/api/subscription-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setSubscriptionData(data);

      if (!data.hasSubscription) {
        toast({
          title: 'No subscription found',
          description: 'This email does not have an active subscription',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check subscription status',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge data-testid="badge-status-active" className="bg-green-600 hover:bg-green-700">Active</Badge>;
      case 'past_due':
        return <Badge data-testid="badge-status-past-due" className="bg-yellow-600 hover:bg-yellow-700">Past Due</Badge>;
      case 'canceled':
        return <Badge data-testid="badge-status-canceled" className="bg-red-600 hover:bg-red-700">Canceled</Badge>;
      default:
        return <Badge data-testid="badge-status-unknown" className="bg-gray-600 hover:bg-gray-700">Unknown</Badge>;
    }
  };

  return (
    <>
      <SEO
        title="Dashboard | EntryLab Signals"
        description="Manage your EntryLab premium signals subscription and Telegram access"
        path="/dashboard"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent" data-testid="text-dashboard-title">
                Subscription Dashboard
              </h1>
              <p className="text-muted-foreground" data-testid="text-dashboard-description">
                Check your subscription status and Telegram access
              </p>
            </div>

            <Card data-testid="card-check-subscription">
              <CardHeader>
                <CardTitle data-testid="text-check-title">Check Your Subscription</CardTitle>
                <CardDescription data-testid="text-check-description">
                  Enter your email to view your subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkSubscription()}
                    disabled={isChecking}
                    data-testid="input-email-dashboard"
                  />
                  <Button
                    onClick={checkSubscription}
                    disabled={isChecking}
                    data-testid="button-check-subscription"
                  >
                    {isChecking ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Checking...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Check
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {subscriptionData && subscriptionData.hasSubscription && (
              <Card data-testid="card-subscription-details" className="border-purple-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle data-testid="text-subscription-title">Subscription Details</CardTitle>
                    {getStatusBadge(subscriptionData.status)}
                  </div>
                  <CardDescription data-testid="text-subscription-email">
                    {subscriptionData.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {subscriptionData.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" data-testid="icon-status-active" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" data-testid="icon-status-inactive" />
                        )}
                        <div>
                          <p className="font-medium" data-testid="text-subscription-status-label">Subscription Status</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-subscription-status-value">
                            {subscriptionData.status === 'active' ? 'Your subscription is active' : 'Subscription not active'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {subscriptionData.currentPeriodEnd && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-purple-500" data-testid="icon-renewal" />
                          <div>
                            <p className="font-medium" data-testid="text-renewal-label">Next Renewal</p>
                            <p className="text-sm text-muted-foreground" data-testid="text-renewal-date">
                              {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {subscriptionData.telegramConnected ? (
                          <CheckCircle className="w-5 h-5 text-green-500" data-testid="icon-telegram-connected" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" data-testid="icon-telegram-not-connected" />
                        )}
                        <div>
                          <p className="font-medium" data-testid="text-telegram-label">Telegram Connection</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-telegram-status">
                            {subscriptionData.telegramConnected ? 'Connected' : 'Not connected yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {subscriptionData.status === 'active' && (
                    <div className="pt-4 border-t space-y-4">
                      <p className="text-sm text-muted-foreground" data-testid="text-telegram-instructions">
                        Check your email for the Telegram invite link. If you haven't received it, please contact support.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          asChild
                          data-testid="button-contact-support"
                        >
                          <a href="mailto:support@entrylab.io">
                            <Send className="w-4 h-4 mr-2" />
                            Contact Support
                          </a>
                        </Button>
                        <Button
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          asChild
                          data-testid="button-open-telegram"
                        >
                          <a href="https://t.me/+TbJsf9xRrNkwN2E0" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Telegram
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-need-help">
              <CardHeader>
                <CardTitle data-testid="text-help-title">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground" data-testid="text-help-description">
                  If you're experiencing issues with your subscription or Telegram access, our support team is here to help.
                </p>
                <Button
                  variant="outline"
                  asChild
                  data-testid="button-email-support"
                >
                  <a href="mailto:support@entrylab.io">
                    <Send className="w-4 h-4 mr-2" />
                    Email Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
