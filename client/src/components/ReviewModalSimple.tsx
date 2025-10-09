import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";

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

export function ReviewModalSimple({ 
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

  const hasRecaptchaKey = Boolean(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

  useEffect(() => {
    if (!isOpen) return;
    
    console.log("Modal opened - simple version", { brokerName, brokerId });
    
    // Load reCAPTCHA script if key is available
    if (hasRecaptchaKey && !window.grecaptcha) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setRecaptchaLoaded(true);
      document.body.appendChild(script);
    } else if (window.grecaptcha) {
      setRecaptchaLoaded(true);
    }
  }, [isOpen, hasRecaptchaKey, brokerName, brokerId]);

  useEffect(() => {
    if (step === 6 && recaptchaLoaded && hasRecaptchaKey && recaptchaRef.current && !recaptchaRef.current.hasChildNodes()) {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast({
        title: "Review Submitted!",
        description: "Thank you for sharing your experience. Your review will be published after approval.",
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
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Dark Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9998
        }}
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div 
        style={{
          position: 'fixed !important' as any,
          top: '5vh !important' as any,
          left: '50% !important' as any,
          marginLeft: '-250px !important' as any,
          zIndex: 999999,
          width: '500px',
          maxHeight: '90vh',
          backgroundColor: '#ff0000',
          border: '10px solid #ffff00',
          borderRadius: '8px',
          padding: '1.5rem',
          overflowY: 'auto',
          boxShadow: '0 0 100px rgba(255, 255, 0, 0.8)'
        }}
        data-testid="dialog-review"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img 
            src={brokerLogo} 
            alt={brokerName}
            className="w-12 h-12 object-contain rounded"
          />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Write a Review</h2>
            <p className="text-sm text-muted-foreground">
              Share your experience with {brokerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            data-testid="button-close-modal"
          >
            ×
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Rate Your Experience</h3>
              <p className="text-sm text-muted-foreground">How would you rate {brokerName}?</p>
              <div className="flex gap-2 justify-center py-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFormData({ ...formData, rating })}
                    className="transition-transform hover:scale-110"
                    data-testid={`star-rating-${rating}`}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        rating <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {formData.rating > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {formData.rating} {formData.rating === 1 ? "star" : "stars"}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Review Title</h3>
              <p className="text-sm text-muted-foreground">Summarize your experience in one line</p>
              <Input
                placeholder="e.g., Great broker with fast execution"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-review-title"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Your Review</h3>
              <p className="text-sm text-muted-foreground">Share your detailed experience (minimum 10 characters)</p>
              <Textarea
                placeholder="Tell us about your experience with trading, customer support, withdrawals, etc."
                value={formData.reviewText}
                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                rows={6}
                data-testid="textarea-review"
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.reviewText.length} characters
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Your Name</h3>
              <p className="text-sm text-muted-foreground">How should we display your name?</p>
              <Input
                placeholder="John D."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Email Address</h3>
              <p className="text-sm text-muted-foreground">We'll use this to notify you when your review is published</p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Almost Done!</h3>
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.newsletterOptin}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, newsletterOptin: checked as boolean })
                  }
                  data-testid="checkbox-newsletter"
                />
                <label className="text-sm text-muted-foreground">
                  Subscribe to our newsletter for forex market updates and broker news
                </label>
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

        {/* Navigation */}
        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
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
      </div>
    </>
  );

  // Use portal to render at body level, avoiding any parent CSS that breaks fixed positioning
  return createPortal(modalContent, document.body);
}
