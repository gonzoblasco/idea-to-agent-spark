import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';
import { AgentCard } from '@/components/AgentCard';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-bg.jpg';

export default function Home() {
  const [featuredAgents, setFeaturedAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeaturedAgents = async () => {
      const { data } = await supabase
        .from('agents')
        .select(`
          *,
          agent_executions(count)
        `)
        .eq('status', 'published')
        .limit(6);
      
      if (data) {
        setFeaturedAgents(data);
      }
    };

    fetchFeaturedAgents();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-5" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Plataforma de Agentes Inteligentes
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Agentes IA listos para
              <span className="block mt-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                impulsar tu negocio
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Catálogo completo de agentes inteligentes organizados por profesión y necesidad. 
              Personaliza en minutos y comienza a optimizar tus procesos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg h-14 px-8 gap-2 shadow-lg hover:shadow-xl transition-all" asChild>
                <Link to="/explore">
                  Explorar agentes
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                <Link to="/auth">Crear cuenta gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Implementación Rápida</h3>
              <p className="text-muted-foreground">
                Personaliza 3-5 campos y tu agente estará listo para usar en minutos
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Biblioteca Completa</h3>
              <p className="text-muted-foreground">
                Agentes especializados para cada profesión y necesidad empresarial
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Control Total</h3>
              <p className="text-muted-foreground">
                Métricas de uso, control de costos y análisis de satisfacción integrados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Agents */}
      {featuredAgents.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Agentes Destacados</h2>
              <p className="text-xl text-muted-foreground">
                Los agentes más utilizados por nuestra comunidad
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAgents.map((agent) => (
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

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link to="/explore">Ver todos los agentes</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">¿Listo para comenzar?</h2>
            <p className="text-xl text-muted-foreground">
              Únete a cientos de empresas que ya están optimizando sus procesos con agentes inteligentes
            </p>
            <Button size="lg" className="text-lg h-14 px-8" asChild>
              <Link to="/auth">Crear mi primer agente</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
