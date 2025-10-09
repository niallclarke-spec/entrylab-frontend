import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface BrokerCardProps {
  name: string;
  logo: string;
  verified: boolean;
  pros: string[];
  link: string;
}

export function BrokerCard({ name, logo, verified, pros, link }: BrokerCardProps) {
  return (
    <Card className="hover-elevate transition-all" data-testid={`card-broker-${name}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            <img src={logo} alt={name} loading="lazy" width="96" height="96" className="w-full h-full object-contain p-3" data-testid="img-broker-logo" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid="text-broker-name">{name}</h3>
            {verified && (
              <Badge variant="default" className="mt-1" data-testid="badge-verified">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">PROS:</p>
          <ul className="space-y-1">
            {pros.map((pro, index) => (
              <li key={index} className="text-sm text-muted-foreground" data-testid={`text-pro-${index}`}>
                {pro}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" data-testid="button-visit-broker">
          <a href={link} target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
