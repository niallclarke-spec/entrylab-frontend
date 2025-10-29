import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface ProsConsCardProps {
  pros: string[];
  cons: string[];
}

export function ProsConsCard({ pros, cons }: ProsConsCardProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 my-8" data-testid="card-pros-cons">
      {/* Pros Card */}
      <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Pros</h3>
        </div>
        <ul className="space-y-3">
          {pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90 leading-relaxed">{pro}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Cons Card */}
      <Card className="p-6 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Cons</h3>
        </div>
        <ul className="space-y-3">
          {cons.map((con, index) => (
            <li key={index} className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90 leading-relaxed">{con}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
