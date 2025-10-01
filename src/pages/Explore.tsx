import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentCard } from '@/components/AgentCard';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Explore() {
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryType, setCategoryType] = useState<'all' | 'profession' | 'need'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [selectedCategory, categoryType, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    
    let query = supabase
      .from('agents')
      .select(`
        *,
        agent_categories(category_id),
        agent_executions(count)
      `)
      .eq('status', 'published');

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    
    if (data) {
      let filteredData = data;
      
      if (selectedCategory !== 'all') {
        filteredData = data.filter(agent => 
          agent.agent_categories?.some((ac: any) => ac.category_id === selectedCategory)
        );
      }
      
      if (categoryType !== 'all') {
        const categoryIds = categories
          .filter(c => c.type === categoryType)
          .map(c => c.id);
        
        filteredData = filteredData.filter(agent =>
          agent.agent_categories?.some((ac: any) => categoryIds.includes(ac.category_id))
        );
      }
      
      setAgents(filteredData);
    }
    
    setLoading(false);
  };

  const professionCategories = categories.filter(c => c.type === 'profession');
  const needCategories = categories.filter(c => c.type === 'need');

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explora nuestro catálogo
          </h1>
          <p className="text-xl text-muted-foreground">
            Encuentra el agente perfecto para tu necesidad
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={categoryType} onValueChange={(v: any) => setCategoryType(v)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="profession">Por profesión</SelectItem>
                <SelectItem value="need">Por necesidad</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {(categoryType === 'all' || categoryType === 'profession') && professionCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Profesiones</div>
                    {professionCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </>
                )}
                {(categoryType === 'all' || categoryType === 'need') && needCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Necesidades</div>
                    {needCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {loading ? 'Cargando...' : `${agents.length} agentes encontrados`}
          </p>
          {(selectedCategory !== 'all' || categoryType !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategory('all');
                setCategoryType('all');
                setSearchQuery('');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
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

        {!loading && agents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              No se encontraron agentes con los filtros seleccionados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
