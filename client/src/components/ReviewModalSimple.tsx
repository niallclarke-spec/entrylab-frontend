import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, X, Loader2 } from "lucide-react";
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
}

export function ReviewModalSimple({ 
  isOpen, 
  onClose, 
  brokerName, 
  brokerLogo, 
  brokerId,
  itemType 
}: ReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  
  // Auto-fill with test data in development
  const isDev = import.meta.env.DEV;
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: isDev ? 5 : 0,
    title: isDev ? "Excellent trading experience" : "",
    reviewText: isDev ? "I've been trading with this broker for 6 months and the experience has been fantastic. Fast execution, tight spreads, and excellent customer support." : "",
    name: isDev ? "John Trader" : "",
    email: isDev ? "test@example.com" : "",
  });

  const hasRecaptchaKey = Boolean(recaptchaSiteKey);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset error state when modal opens
    setRecaptchaError(null);
    
    // Fetch reCAPTCHA site key from backend
    fetch('/api/recaptcha/site-key')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load security verification');
        }
        return res.json();
      })
      .then(data => {
        console.log("Review modal opened", { 
          brokerName, 
          brokerId, 
          siteKey: data.siteKey 
        });
        setRecaptchaSiteKey(data.siteKey);
        setRecaptchaError(null);
      })
      .catch(err => {
        console.error("Failed to fetch reCAPTCHA site key:", err);
        const errorMsg = "Security verification unavailable. Please try again later.";
        setRecaptchaError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      });
    
    // Load reCAPTCHA script
    if (!window.grecaptcha) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setRecaptchaLoaded(true);
      document.body.appendChild(script);
    } else {
      setRecaptchaLoaded(true);
    }
  }, [isOpen, brokerName, brokerId, toast]);

  useEffect(() => {
    if (!isDev && recaptchaLoaded && hasRecaptchaKey && recaptchaSiteKey && recaptchaRef.current && !recaptchaRef.current.hasChildNodes()) {
      window.grecaptcha.render(recaptchaRef.current, {
        sitekey: recaptchaSiteKey,
      });
    }
  }, [recaptchaLoaded, hasRecaptchaKey, recaptchaSiteKey, isDev]);

  const handleStarClick = (selectedRating: number) => {
    setFormData(prev => ({ ...prev, rating: selectedRating }));
  };

  const handleClose = () => {
    setFormData({
      rating: isDev ? 5 : 0,
      title: isDev ? "Excellent trading experience" : "",
      reviewText: isDev ? "I've been trading with this broker for 6 months and the experience has been fantastic. Fast execution, tight spreads, and excellent customer support." : "",
      name: isDev ? "John Trader" : "",
      email: isDev ? "test@example.com" : "",
    });
    onClose();
  };

  const handleSubmit = async () => {
    // Validate form
    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a review title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.reviewText.trim()) {
      toast({
        title: "Review required",
        description: "Please enter your review",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Valid email required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let recaptchaToken = '';
      
      // Get reCAPTCHA token in production only
      if (!isDev) {
        if (hasRecaptchaKey && window.grecaptcha) {
          try {
            recaptchaToken = window.grecaptcha.getResponse();
            if (!recaptchaToken) {
              throw new Error("Please complete the reCAPTCHA verification");
            }
          } catch (e) {
            console.error("reCAPTCHA error:", e);
            throw new Error("reCAPTCHA verification failed. Please try again.");
          }
        } else if (!hasRecaptchaKey) {
          // In production, reCAPTCHA is required
          throw new Error("Security verification is required. Please refresh and try again.");
        }
      }

      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brokerName,
          brokerId,
          itemType,
          rating: formData.rating,
          title: formData.title,
          reviewText: formData.reviewText,
          name: formData.name,
          email: formData.email,
          recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review");
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your review. It will be published after moderation.",
      });

      handleClose();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFormValid = formData.rating > 0 && 
                      formData.title.trim() && 
                      formData.reviewText.trim() && 
                      formData.name.trim() && 
                      formData.email.trim().includes('@');

  const isSubmitDisabled = !isFormValid || isSubmitting || (!isDev && recaptchaError);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brokerLogo && (
              <img 
                src={brokerLogo} 
                alt={brokerName} 
                className="w-12 h-12 object-contain rounded"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">Leave a Review</h2>
              <p className="text-sm text-muted-foreground">{brokerName}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Overall Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="transition-transform hover:scale-110"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Review Title *</label>
            <Input
              placeholder="Summarize your experience"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-review-title"
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review *</label>
            <Textarea
              placeholder="Share your experience with this broker..."
              value={formData.reviewText}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
              rows={6}
              data-testid="textarea-review-text"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name *</label>
            <Input
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              data-testid="input-name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Email *</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              data-testid="input-email"
            />
            <p className="text-xs text-muted-foreground">Your email will not be published</p>
          </div>

          {/* reCAPTCHA - Only in production */}
          {!isDev && hasRecaptchaKey && (
            <div className="space-y-2">
              <div ref={recaptchaRef} data-testid="recaptcha-container"></div>
              {recaptchaError && (
                <p className="text-sm text-destructive">{recaptchaError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            data-testid="button-submit-review"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render to modal-root or body
  const modalRoot = document.getElementById('modal-root');
  return createPortal(modalContent, modalRoot || document.body);
}
