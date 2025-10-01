-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'creator', 'client');
CREATE TYPE agent_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE category_type AS ENUM ('profession', 'need');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'client' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type category_type NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(name, type)
);

-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status agent_status DEFAULT 'draft' NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  parent_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Agent configuration
  input_schema JSONB,
  output_schema JSONB,
  workflow_steps JSONB,
  tools JSONB,
  
  -- LLM configuration
  llm_provider TEXT DEFAULT 'google/gemini-2.5-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  top_p DECIMAL(3,2) DEFAULT 0.9,
  max_tokens INTEGER DEFAULT 1000,
  
  -- Metadata
  system_prompt TEXT,
  language TEXT DEFAULT 'es',
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agent_categories junction table
CREATE TABLE agent_categories (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, category_id)
);

-- Create agent_executions table for metrics
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  estimated_cost DECIMAL(10,4),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agent_customizations table (for client-specific configs)
CREATE TABLE agent_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  custom_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(agent_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for collections
CREATE POLICY "Anyone can view public collections"
  ON collections FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Creators can manage own collections"
  ON collections FOR ALL
  USING (creator_id = auth.uid());

-- RLS Policies for agents
CREATE POLICY "Anyone can view published agents"
  ON agents FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid());

CREATE POLICY "Creators can manage own agents"
  ON agents FOR ALL
  USING (creator_id = auth.uid());

-- RLS Policies for agent_categories
CREATE POLICY "Anyone can view agent categories"
  ON agent_categories FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage agent categories"
  ON agent_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_categories.agent_id
      AND agents.creator_id = auth.uid()
    )
  );

-- RLS Policies for agent_executions
CREATE POLICY "Users can view own executions"
  ON agent_executions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_executions.agent_id
    AND agents.creator_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create executions"
  ON agent_executions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own executions"
  ON agent_executions FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for agent_customizations
CREATE POLICY "Users can view own customizations"
  ON agent_customizations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own customizations"
  ON agent_customizations FOR ALL
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_creator ON agents(creator_id);
CREATE INDEX idx_agents_collection ON agents(collection_id);
CREATE INDEX idx_collections_creator ON collections(creator_id);
CREATE INDEX idx_executions_agent ON agent_executions(agent_id);
CREATE INDEX idx_executions_user ON agent_executions(user_id);
CREATE INDEX idx_executions_created ON agent_executions(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customizations_updated_at BEFORE UPDATE ON agent_customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert demo categories
INSERT INTO categories (name, type, description, icon) VALUES
  ('Cocinero', 'profession', 'Agentes especializados en gastronomía y cocina', 'ChefHat'),
  ('Ventas', 'profession', 'Agentes para optimizar procesos de venta', 'TrendingUp'),
  ('Marketing', 'profession', 'Agentes para estrategias de marketing', 'Megaphone'),
  ('Desarrollo', 'profession', 'Agentes para programación y desarrollo', 'Code'),
  ('Plan de Negocios', 'need', 'Crear planes de negocios completos', 'FileText'),
  ('Análisis de Datos', 'need', 'Análisis y visualización de datos', 'BarChart'),
  ('Atención al Cliente', 'need', 'Mejorar la experiencia del cliente', 'Users'),
  ('Automatización', 'need', 'Automatizar tareas repetitivas', 'Zap');