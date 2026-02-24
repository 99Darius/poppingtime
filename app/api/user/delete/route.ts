import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const serviceClient = await createServiceClient()

        // Supabase admin deleteUser completely removes the user from auth.users
        // If ON DELETE CASCADE is set up on user_profiles, books, etc., those will be removed as well.
        const { error } = await serviceClient.auth.admin.deleteUser(user.id)

        if (error) {
            throw error
        }

        // Sign the user out locally as well by clearing cookies (handled by client redirect after this)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Account deletion failed:', error)
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }
}
