const { Client } = require('pg')

async function run() {
    const client = new Client({
        host: 'db.gxvaauupjpguwljszciu.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'yuHPOQTa03snhrUu',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
    })
    await client.connect()
    
    try {
        await client.query(`ALTER TABLE public.user_profiles ADD COLUMN primary_account_id uuid REFERENCES auth.users(id)`)
        console.log('Added primary_account_id to user_profiles')
    } catch (e) {
        console.log('Could not add column:', e.message)
    }

    await client.end()
}
run()
