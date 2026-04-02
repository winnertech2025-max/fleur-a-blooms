
-- Create enum for moods
CREATE TYPE public.flower_mood AS ENUM ('romantic', 'joyful', 'calm', 'grateful', 'sympathetic', 'celebratory');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Flowers table
CREATE TABLE public.flowers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    price_per_stem NUMERIC(10,2) NOT NULL DEFAULT 0,
    mood flower_mood NOT NULL,
    description TEXT,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flowers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flowers" ON public.flowers FOR SELECT USING (true);
CREATE POLICY "Admins can insert flowers" ON public.flowers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update flowers" ON public.flowers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete flowers" ON public.flowers FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mood flower_mood NOT NULL,
    recipient_type TEXT NOT NULL,
    budget NUMERIC(10,2) NOT NULL,
    user_description TEXT,
    selected_flower_ids UUID[] DEFAULT '{}',
    generated_image_url TEXT,
    qr_code_data TEXT,
    ingredients TEXT[],
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders by id" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Roles policies
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_flowers_updated_at BEFORE UPDATE ON public.flowers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('flowers', 'flowers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('bouquets', 'bouquets', true);

CREATE POLICY "Anyone can view flower images" ON storage.objects FOR SELECT USING (bucket_id = 'flowers');
CREATE POLICY "Admins can upload flower images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update flower images" ON storage.objects FOR UPDATE USING (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete flower images" ON storage.objects FOR DELETE USING (bucket_id = 'flowers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view bouquet images" ON storage.objects FOR SELECT USING (bucket_id = 'bouquets');
CREATE POLICY "Anyone can upload bouquet images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bouquets');
