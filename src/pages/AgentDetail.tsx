import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Sparkles, Settings, Play, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    const { data } = await supabase
      .from('agents')
      .select(`
        *,
        creator:profiles!agents_creator_id_fkey(full_name),
        collection:collections(name),
        agent_categories(category:categories(name, type))
      `)
      .eq('id', id)
      .single();

    if (data) {
      setAgent(data);
    }
    setLoading(false);
  };

  const handleClone = () => {
    toast.success('Función de clonado próximamente');
  };

  const handleCustomize = () => {
    toast.info('Personalización próximamente');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <p>Cargando agente...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Agente no encontrado</p>
          <Button asChild>
            <Link to="/explore">Volver al catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/explore">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al catálogo
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{agent.name}</h1>
                  <p className="text-lg text-muted-foreground">{agent.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {agent.tags?.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{tag}</Badge>
                ))}
              </div>

              <div className="flex gap-2 text-sm text-muted-foreground">
                {agent.creator && (
                  <span>Creado por <span className="font-medium">{agent.creator.full_name}</span></span>
                )}
                {agent.collection && (
                  <>
                    <span>•</span>
                    <span>Colección: <span className="font-medium">{agent.collection.name}</span></span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Configuration Details */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Agente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Modelo LLM</h3>
                  <Badge variant="outline">{agent.llm_provider}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Temperatura</h3>
                    <p className="text-muted-foreground">{agent.temperature}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Top-P</h3>
                    <p className="text-muted-foreground">{agent.top_p}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Max Tokens</h3>
                    <p className="text-muted-foreground">{agent.max_tokens}</p>
                  </div>
                </div>

                {agent.system_prompt && (
                  <div>
                    <h3 className="font-semibold mb-2">Prompt del Sistema</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg font-mono">
                      {agent.system_prompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            {agent.workflow_steps && (
              <Card>
                <CardHeader>
                  <CardTitle>Flujo de Trabajo</CardTitle>
                  <CardDescription>
                    Pasos que ejecuta este agente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(agent.workflow_steps) && agent.workflow_steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium">{step.name || `Paso ${idx + 1}`}</p>
                          <p className="text-sm text-muted-foreground">{step.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" onClick={handleCustomize}>
                  <Settings className="w-4 h-4" />
                  Personalizar
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handleClone}>
                  <Copy className="w-4 h-4" />
                  Clonar agente
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Play className="w-4 h-4" />
                  Probar ahora
                </Button>
              </CardContent>
            </Card>

            {/* Categories */}
            {agent.agent_categories && agent.agent_categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agent.agent_categories.map((ac: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="mr-2">
                        {ac.category.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Especificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idioma</span>
                  <span className="font-medium">{agent.language === 'es' ? 'Español' : agent.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versión</span>
                  <span className="font-medium">v{agent.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant={agent.status === 'published' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
