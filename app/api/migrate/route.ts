import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: Request) {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260213_gamification.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    // Split into individual statements (rough split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
      if (error) {
        console.error('Statement failed:', statement.substring(0, 100))
        throw error
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration applied successfully',
      statements: statements.length 
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
