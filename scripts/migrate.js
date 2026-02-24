const { Client } = require('pg')
const { createClient } = require('@supabase/supabase-js')

async function run() {
    // 1. Run SQL migrations via direct Postgres connection
    const client = new Client({
        host: 'db.gxvaauupjpguwljszciu.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'yuHPOQTa03snhrUu',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
    })

    await client.connect()
    console.log('Connected to Postgres')

    const statements = [
        // User profiles
        `CREATE TABLE IF NOT EXISTS public.user_profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      display_name text,
      stripe_customer_id text,
      subscription_status text DEFAULT 'free',
      subscription_price_id text,
      total_recording_seconds integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )`,
        `ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own profile' AND tablename = 'user_profiles') THEN
        CREATE POLICY "Users see own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
      END IF;
    END $$`,

        // Auto-create profile trigger
        `CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.user_profiles (id) VALUES (new.id);
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER`,
        `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
        `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user()`,

        // Books
        `CREATE TABLE IF NOT EXISTS public.books (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT 'My Story',
      status text DEFAULT 'active',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )`,
        `ALTER TABLE public.books ENABLE ROW LEVEL SECURITY`,

        // Book contributors
        `CREATE TABLE IF NOT EXISTS public.book_contributors (
      book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      PRIMARY KEY (book_id, user_id)
    )`,
        `ALTER TABLE public.book_contributors ENABLE ROW LEVEL SECURITY`,

        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Book members can access' AND tablename = 'books') THEN
        CREATE POLICY "Book members can access" ON public.books FOR ALL USING (
          owner_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.book_contributors WHERE book_id = id AND user_id = auth.uid())
        );
      END IF;
    END $$`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contributors can see membership' AND tablename = 'book_contributors') THEN
        CREATE POLICY "Contributors can see membership" ON public.book_contributors FOR ALL USING (
          user_id = auth.uid() OR
          EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND owner_id = auth.uid())
        );
      END IF;
    END $$`,

        // Chapters
        `CREATE TABLE IF NOT EXISTS public.chapters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
      author_id uuid REFERENCES auth.users(id),
      chapter_number integer NOT NULL,
      audio_path text,
      duration_seconds integer,
      transcript_original text,
      transcript_cleaned text,
      transcript_status text DEFAULT 'pending',
      created_at timestamptz DEFAULT now()
    )`,
        `ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Book members can access chapters' AND tablename = 'chapters') THEN
        CREATE POLICY "Book members can access chapters" ON public.chapters FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.books b WHERE b.id = book_id AND (
              b.owner_id = auth.uid() OR
              EXISTS (SELECT 1 FROM public.book_contributors bc WHERE bc.book_id = b.id AND bc.user_id = auth.uid())
            )
          )
        );
      END IF;
    END $$`,

        // Rewrites
        `CREATE TABLE IF NOT EXISTS public.rewrites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
      book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
      scope text NOT NULL,
      model_used text,
      content text NOT NULL,
      created_at timestamptz DEFAULT now()
    )`,
        `ALTER TABLE public.rewrites ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Book members can access rewrites' AND tablename = 'rewrites') THEN
        CREATE POLICY "Book members can access rewrites" ON public.rewrites FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.books b WHERE b.id = book_id AND (
              b.owner_id = auth.uid() OR
              EXISTS (SELECT 1 FROM public.book_contributors bc WHERE bc.book_id = b.id AND bc.user_id = auth.uid())
            )
          )
        );
      END IF;
    END $$`,

        // Illustrated PDFs
        `CREATE TABLE IF NOT EXISTS public.illustrated_books (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
      stripe_payment_intent_id text UNIQUE,
      status text DEFAULT 'pending_payment',
      pdf_path text,
      download_url text,
      download_url_expires_at timestamptz,
      created_at timestamptz DEFAULT now()
    )`,
        `ALTER TABLE public.illustrated_books ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Book owner can access illustrated books' AND tablename = 'illustrated_books') THEN
        CREATE POLICY "Book owner can access illustrated books" ON public.illustrated_books FOR ALL USING (
          EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND owner_id = auth.uid())
        );
      END IF;
    END $$`,

        // Gift access
        `CREATE TABLE IF NOT EXISTS public.gift_access (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
      email text NOT NULL,
      token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
      claimed_by uuid REFERENCES auth.users(id),
      created_at timestamptz DEFAULT now()
    )`,

        // Admin config
        `CREATE TABLE IF NOT EXISTS public.admin_config (
      id integer PRIMARY KEY DEFAULT 1,
      rewrite_model text DEFAULT 'claude-opus-4-5',
      plot_model text DEFAULT 'claude-opus-4-5',
      image_style text DEFAULT 'watercolor illustration, children''s book style',
      plot_tone text DEFAULT 'funny',
      plot_max_bullets integer DEFAULT 5,
      creativity_level numeric DEFAULT 0.9,
      updated_at timestamptz DEFAULT now()
    )`,
        `INSERT INTO public.admin_config (id) VALUES (1) ON CONFLICT DO NOTHING`,
        `ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read config' AND tablename = 'admin_config') THEN
        CREATE POLICY "Anyone can read config" ON public.admin_config FOR SELECT USING (true);
      END IF;
    END $$`,
    ]

    for (let i = 0; i < statements.length; i++) {
        try {
            await client.query(statements[i])
            process.stdout.write('.')
        } catch (err) {
            console.error(`\nStatement ${i} failed:`, err.message)
        }
    }
    console.log('\n✓ All SQL migrations complete')

    // Verify tables
    const res = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`)
    console.log('Tables:', res.rows.map(r => r.tablename).join(', '))

    await client.end()

    // 2. Create storage buckets via Supabase client
    console.log('\nCreating storage buckets...')
    const supabase = createClient(
        'https://gxvaauupjpguwljszciu.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dmFhdXVwanBndXdsanN6Y2l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg0NTM2OSwiZXhwIjoyMDg3NDIxMzY5fQ.wmy5Hum8ISk3BWZmMFDgVN0WMPFHO2REMguWLNA7u0M'
    )

    const { error: audioErr } = await supabase.storage.createBucket('audio', {
        public: false,
        fileSizeLimit: 52428800,
    })
    console.log('Audio bucket:', audioErr ? audioErr.message : '✓ Created')

    const { error: pdfErr } = await supabase.storage.createBucket('pdfs', {
        public: false,
        fileSizeLimit: 104857600,
    })
    console.log('PDFs bucket:', pdfErr ? pdfErr.message : '✓ Created')

    const { data: buckets } = await supabase.storage.listBuckets()
    console.log('All buckets:', buckets?.map(b => b.name).join(', '))

    console.log('\n✅ Setup complete!')
}

run().catch(console.error)
