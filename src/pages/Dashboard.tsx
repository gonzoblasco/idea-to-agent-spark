import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, TrendingUp, Clock, DollarSign, Plus } from 'lucide-react';
import { AgentCard } from '@/components/AgentCard';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalExecutions: 0,
    totalCost: 0,
    avgSatisfaction: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyAgents();
      fetchMetrics();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const fetchMyAgents = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('agents')
      .select(`
        *,
        agent_executions(count)
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setMyAgents(data);
    }
  };

  const fetchMetrics = async () => {
    if (!user) return;
    
    const { data: executions } = await supabase
      .from('agent_executions')
      .select('estimated_cost, satisfaction_rating')
      .eq('user_id', user.id);
    
    if (executions) {
      const totalExecutions = executions.length;
      const totalCost = executions.reduce((sum, e) => sum + (Number(e.estimated_cost) || 0), 0);
      const ratings = executions.filter(e => e.satisfaction_rating);
      const avgSatisfaction = ratings.length > 0
        ? ratings.reduce((sum, e) => sum + e.satisfaction_rating!, 0) / ratings.length
        : 0;
      
      setMetrics({ totalExecutions, totalCost, avgSatisfaction });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenido, {profile?.full_name || 'Usuario'}
          </h1>
          <p className="text-xl text-muted-foreground">
            Panel de control de tus agentes
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Ejecuciones
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalExecutions}</div>
              <p className="text-xs text-muted-foreground">
                Ejecuciones totales de tus agentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Costo Estimado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Costo acumulado en tokens de IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfacción Promedio
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.avgSatisfaction > 0 ? metrics.avgSatisfaction.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Calificación promedio de usuarios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Agents */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Mis Agentes</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Crear nuevo agente
            </Button>
          </div>

          {myAgents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  id={agent.id}
                  name={agent.name}
                  description={agent.description}
                  tags={agent.tags || []}
                  executionCount={agent.agent_executions?.[0]?.count || 0}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-4">
                Aún no has creado ningún agente
              </p>
              <Button>Crear mi primer agente</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
