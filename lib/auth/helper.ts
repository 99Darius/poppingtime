import { User } from '@supabase/supabase-js'

export function getPrimaryAccountId(user: User | null | undefined): string {
    if (!user) return ''
    return user.user_metadata?.primary_account_id || user.id
}
