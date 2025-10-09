import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerName: string;
  brokerLogo: string;
  brokerId: string;
  itemType: "broker" | "prop-firm";
}

interface ReviewFormData {
  rating: number;
  title: string;
  reviewText: string;
  name: string;
  email: string;
  newsletterOptin: boolean;
}

export function ReviewModal({ 
  isOpen, 
  onClose, 
  brokerName, 
  brokerLogo, 
  brokerId,
  itemType 
}: ReviewModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: "",
    reviewText: "",
    name: "",
    email: "",
    newsletterOptin: false,
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  const hasRecaptchaKey = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Only load reCAPTCHA script if modal is open and site key is configured
    if (!isOpen || !hasRecaptchaKey) return;
    
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setRecaptchaLoaded(true);
      document.head.appendChild(script);
    } else {
      setRecaptchaLoaded(true);
    }
  }, [isOpen, hasRecaptchaKey]);

  useEffect(() => {
    // Render reCAPTCHA when on step 6, script is loaded, and key is available
    if (!hasRecaptchaKey) return;
    
    if (step === 6 && recaptchaLoaded && recaptchaRef.current && !recaptchaRef.current.hasChildNodes()) {
      window.grecaptcha.render(recaptchaRef.current, {
        sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      });
    }
  }, [step, recaptchaLoaded, hasRecaptchaKey]);

  const totalSteps = 6;
  const canGoNext = () => {
    switch (step) {
      case 1:
        return formData.rating > 0;
      case 2:
        return formData.title.trim().length > 0;
      case 3:
        return formData.reviewText.trim().length > 10;
      case 4:
        return formData.name.trim().length > 0;
      case 5:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      let recaptchaToken = '';
      
      // Only verify reCAPTCHA if it's configured
      if (hasRecaptchaKey && window.grecaptcha) {
        recaptchaToken = window.grecaptcha.getResponse();
        
        if (!recaptchaToken) {
          toast({
            title: "Please verify you're human",
            description: "Complete the reCAPTCHA challenge to continue.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          brokerId,
          itemType,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. We'll review it shortly.",
      });

      onClose();
      setStep(1);
      setFormData({
        rating: 0,
        title: "",
        reviewText: "",
        name: "",
        email: "",
        newsletterOptin: false,
      });
      
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        data-testid="dialog-review"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={brokerLogo} 
              alt={brokerName}
              className="h-8 w-auto object-contain"
              data-testid="img-broker-logo"
            />
            <DialogTitle data-testid="text-dialog-title">Review {brokerName}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Submit your review of {brokerName} in {totalSteps} simple steps
          </DialogDescription>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
                data-testid={`progress-step-${i + 1}`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="relative min-h-[280px]">
          <div>
              {step === 1 && (
                <div className="space-y-4" data-testid="step-rating">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">How would you rate {brokerName}?</h3>
                    <p className="text-sm text-muted-foreground">Rate from 1 to 10</p>
                  </div>
                  <div className="flex gap-2 justify-center py-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFormData({ ...formData, rating: i + 1 })}
                        onMouseEnter={() => setHoveredRating(i + 1)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                        data-testid={`button-rating-${i + 1}`}
                      >
                        <Star
                          className={`h-8 w-8 ${
                            (hoveredRating || formData.rating) > i
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {formData.rating > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      You rated: {formData.rating}/10
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4" data-testid="step-title">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Give your review a title</h3>
                    <p className="text-sm text-muted-foreground">Summarize your experience</p>
                  </div>
                  <Input
                    placeholder="e.g., Great platform with low spreads"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-4"
                    maxLength={100}
                    data-testid="input-review-title"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/100
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4" data-testid="step-review">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tell us about your experience</h3>
                    <p className="text-sm text-muted-foreground">Share the details</p>
                  </div>
                  <Textarea
                    placeholder="What did you like or dislike? How was the service, platform, and overall experience?"
                    value={formData.reviewText}
                    onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                    className="mt-4 min-h-[150px]"
                    maxLength={1000}
                    data-testid="textarea-review"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.reviewText.length}/1000 characters (minimum 10)
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4" data-testid="step-name">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What's your name?</h3>
                    <p className="text-sm text-muted-foreground">This will be shown with your review</p>
                  </div>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-4"
                    data-testid="input-reviewer-name"
                  />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4" data-testid="step-email">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Your email address</h3>
                    <p className="text-sm text-muted-foreground">We'll never share this publicly</p>
                  </div>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-4"
                    data-testid="input-reviewer-email"
                  />
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6" data-testid="step-newsletter">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">One last thing!</h3>
                    <p className="text-sm text-muted-foreground">Stay updated with the latest offers</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="newsletter"
                        checked={formData.newsletterOptin}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, newsletterOptin: checked as boolean })
                        }
                        data-testid="checkbox-newsletter"
                      />
                      <label htmlFor="newsletter" className="text-sm leading-relaxed cursor-pointer">
                        Yes, send me updates on prop firms, exclusive discount codes, and broker bonuses
                      </label>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      ✓ Your review will be published after approval<br />
                      ✓ You can unsubscribe from emails anytime<br />
                      ✓ Your email stays private
                    </p>
                  </div>
                  {hasRecaptchaKey && (
                    <div className="flex justify-center">
                      <div ref={recaptchaRef} data-testid="recaptcha-widget"></div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              data-testid="button-next"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-submit-review"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
