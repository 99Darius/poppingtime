const { createClient } = require('@supabase/supabase-js')

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase.storage.from('pdfs').list('b64fb00d-5b08-4458-8d83-21fcf115af49')
    console.log("Files:", data?.length)
    if (data) {
        data.forEach(f => console.log(f.name, Math.round(f.metadata?.size / 1024 / 1024), "MB"))
    }
}
run()
