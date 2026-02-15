/**
 * Script to set up video storage bucket for Legacy Mode
 * Run with: npx tsx scripts/setup-video-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupVideoStorage() {
  console.log('🎬 Setting up legacy-videos storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'legacy-videos');

    if (bucketExists) {
      console.log('✅ Bucket "legacy-videos" already exists');
    } else {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('legacy-videos', {
        public: false,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png']
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        process.exit(1);
      }

      console.log('✅ Created bucket "legacy-videos"');
    }

    console.log('\n🔐 Setting up RLS policies...\n');

    // Note: RLS policies for storage need to be set up in the Supabase dashboard
    // or via SQL migrations. The SDK doesn't support creating storage policies.
    
    console.log('📝 RLS policies need to be applied via migration:');
    console.log('   Run: npx supabase migration up --db-url <your-db-url>');
    console.log('   File: supabase/migrations/20260214_create_legacy_videos_bucket.sql\n');

    console.log('✨ Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Apply the RLS policies migration');
    console.log('2. Test video upload in the Quest Builder');
    console.log('3. Test locked/unlocked video display in beneficiary view\n');

  } catch (err: any) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

setupVideoStorage();
