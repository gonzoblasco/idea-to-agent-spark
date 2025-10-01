import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  executionCount?: number;
}

export const AgentCard = ({ id, name, description, tags = [], executionCount = 0 }: AgentCardProps) => {
  return (
    <Link to={`/agent/${id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            {executionCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {executionCount}
              </Badge>
            )}
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
