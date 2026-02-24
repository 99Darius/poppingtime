import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@thepoppingtime.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thepoppingtime.com'

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:'Outfit',Helvetica,Arial,sans-serif;background-color:#f3f4f6;margin:0;padding:0;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="padding: 40px 20px;">
  <tr>
    <td align="center">
      <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:600px;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
        <tr>
          <td bgcolor="#4c1d95" style="padding:40px;text-align:center;">
            <p style="color:#d8b4fe;font-size:13px;letter-spacing:2px;margin:0 0 12px;text-transform:uppercase;font-weight:700;">POPPING TIME</p>
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;line-height:1.2;">${title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;color:#111827;">
            ${body}
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 40px 0;">
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="font-size:14px;color:#4b5563;margin:0;font-weight:500;">Popping Time · Building digital heirlooms<br>
                  <a href="${SITE_URL}" style="color:#6d28d9;text-decoration:none;font-weight:600;margin-top:4px;display:inline-block;">poppingtime.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function sendMagicLinkEmail(email: string, magicLink: string) {
  // IMPORTANT: We put the magic link as plain text too, so even without click tracking
  // the user can access it. We also need to ensure the link isn't proxied by Resend's
  // click tracking, which would consume the one-time token before the browser gets it.
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your magic link to Popping Time ✨',
    html: `<!DOCTYPE html>
<html>
<body style="font-family:'Outfit',Helvetica,Arial,sans-serif;background-color:#f3f4f6;margin:0;padding:0;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f4f6" style="padding: 40px 20px;">
  <tr>
    <td align="center">
      <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:560px;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
        <tr>
          <td bgcolor="#4c1d95" style="padding:32px 40px;text-align:left;">
            <p style="color:#d8b4fe;font-size:12px;letter-spacing:2px;margin:0 0 8px;font-weight:600;text-transform:uppercase;">POPPING TIME</p>
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Sign in to Popping Time ✨</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;color:#111827;text-align:left;">
            <p style="font-size:16px;line-height:1.7;font-weight:500;margin-top:0;">Click the button below to sign in. No password needed — it's magic! 🪄</p>
            
            <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
              <tr>
                <td align="center" bgcolor="#6d28d9" style="border-radius: 8px;">
                  <a href="${magicLink}" target="_blank" style="font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 16px 32px; display: inline-block; border-radius: 8px;">✨ Sign In to Popping Time</a>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#4b5563;margin-top:20px;line-height:1.6;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <p style="font-size:12px;color:#6b7280;margin-top:16px;word-break:break-all;">Or copy this link: <a href="${magicLink}" style="color:#6d28d9;">${magicLink}</a></p>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 32px 0;">
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
                </td>
              </tr>
              <tr>
                <td>
                  <p style="font-size:13px;color:#4b5563;margin:0;font-weight:500;">Popping Time · <a href="${SITE_URL}" style="color:#6d28d9;text-decoration:none;">poppingtime.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
    headers: {
      'X-Entity-Ref-ID': `magic-link-${Date.now()}`,
    },
  })
}

export async function sendNewChapterEmail(emails: string[], bookTitle: string, bookId: string, transcript: string) {
  // Truncate transcript for email preview if it's super long
  const preview = transcript.length > 500 ? transcript.substring(0, 500) + '...' : transcript;

  await resend.emails.send({
    from: FROM,
    to: emails,
    subject: `New chapter added to "${bookTitle}" 📖`,
    html: base(`A new chapter!`, `
      <p style="font-size:18px;line-height:1.6;font-weight:500;">A new chapter has just been recorded and transcribed for <strong>${bookTitle}</strong>.</p>
      
      <div style="background:#f3f4f6;padding:24px;border-radius:12px;margin:24px 0;border-left:4px solid #6d28d9;">
        <p style="font-size:16px;line-height:1.8;color:#1f2937;margin:0;font-style:italic;">"${preview}"</p>
      </div>

      <p style="font-size:18px;line-height:1.6;margin-bottom:24px;font-weight:500;">Jump in to listen to the audio and keep the adventure going.</p>
      
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 32px auto;">
        <tr>
          <td align="center" bgcolor="#6d28d9" style="border-radius: 8px;">
            <a href="${SITE_URL}/books/${bookId}" style="display:inline-block;color:#ffffff;padding:16px 36px;text-decoration:none;font-weight:600;font-size:18px;">Listen to the Story</a>
          </td>
        </tr>
      </table>
    `),
  })
}

export async function sendMilestoneEmail(email: string, bookTitle: string, minutes: number, userId: string) {
  const isHalfway = minutes === 7
  const subject = isHalfway
    ? `You've recorded ${minutes} minutes of "${bookTitle}"! 🎉`
    : `You've reached 15 minutes — time to unlock unlimited storytelling!`

  const body = isHalfway
    ? `<p style="font-size:16px;line-height:1.7;">You've recorded <strong>${minutes} minutes</strong> of <strong>${bookTitle}</strong>! Your story is really taking shape.</p><p>Keep going — the best chapters are yet to come!</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#7c5cbf" style="border-radius: 10px;">
      <a href="${SITE_URL}" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Continue Your Story</a>
      </td></tr></table>`
    : `<p style="font-size:16px;line-height:1.7;">You've hit your <strong>15-minute free limit</strong>! That's an amazing story so far.</p><p>Subscribe for just $1.99/month to keep recording unlimited chapters.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#7c5cbf" style="border-radius: 10px;">
      <a href="${SITE_URL}/subscribe" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Unlock Unlimited Storytelling</a>
      </td></tr></table>`

  await resend.emails.send({ from: FROM, to: email, subject, html: base(subject, body) })
}

export async function sendBookEndedEmail(email: string, bookTitle: string, bookId: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `"${bookTitle}" is complete — create your illustrated book! 🎨`,
    html: base('Your story is complete! 🎨', `
      <p style="font-size:16px;line-height:1.7;"><strong>${bookTitle}</strong> is finished! You've created something truly special.</p>
      <p>Turn your story into a beautiful illustrated book — AI-generated art, professional layout, and a QR code keepsake. Just $9.90.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#7c5cbf" style="border-radius: 10px;">
        <a href="${SITE_URL}/books/${bookId}/illustrate" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Create Illustrated Book →</a>
      </td></tr></table>
    `),
  })
}

export async function sendIllustratedBookReadyEmail(email: string, bookTitle: string, downloadUrl: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your illustrated book is ready to download! ✨`,
    html: base('Your illustrated book is ready! ✨', `
      <p style="font-size:16px;line-height:1.7;">Your illustrated version of <strong>${bookTitle}</strong> is ready!</p>
      <p>Download your beautiful children's book — AI-illustrated, professionally laid out, and yours to keep forever.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#f59e0b" style="border-radius: 10px;">
        <a href="${downloadUrl}" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Download Your Book →</a>
      </td></tr></table>
      <p style="font-size:13px;color:#9a8ab0;">This link is valid for 7 days.</p>
    `),
  })
}

export async function sendContributorInviteEmail(
  email: string,
  inviterName: string,
  bookTitle: string,
  bookId: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} invited you to co-author "${bookTitle}"`,
    html: base(`You've been invited to co-author a story! 📚`, `
      <p style="font-size:16px;line-height:1.7;"><strong>${inviterName}</strong> has invited you to record chapters for <strong>${bookTitle}</strong>.</p>
      <p>Sign in to add your voice to this story — no app download needed.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#7c5cbf" style="border-radius: 10px;">
        <a href="${SITE_URL}/login?next=/books/${bookId}" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Join the Story →</a>
      </td></tr></table>
    `),
  })
}

export async function sendGiftEmail(email: string, senderName: string, bookTitle: string, token: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} shared a story with you 🎁`,
    html: base(`A story, just for you 🎁`, `
      <p style="font-size:16px;line-height:1.7;"><strong>${senderName}</strong> has shared their story <strong>${bookTitle}</strong> with you as a gift.</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;"><tr><td align="center" bgcolor="#7c5cbf" style="border-radius: 10px;">
        <a href="${SITE_URL}/gift/${token}" style="display:inline-block;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:600;">Read the Story →</a>
      </td></tr></table>
      <p style="font-size:13px;color:#9a8ab0;">Want to create your own? It's free to start.</p>
    `),
  })
}

export async function sendWelcomeEmail(email: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to Popping Time! 🌙`,
    html: base('Welcome to Popping Time ✨', `
      <p style="font-size:20px;line-height:1.5;font-weight:700;color:#111827;text-align:center;margin-bottom:24px;">Welcome aboard! We're so glad you're here.</p>
      
      <p style="font-size:18px;line-height:1.7;text-align:center;color:#374151;margin-bottom:32px;font-weight:500;">Tonight, when the lights go down and the stories come alive, you'll have a beautiful way to keep them forever.</p>
      
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:32px;margin:32px 0;">
        <div style="display:flex;align-items:flex-start;margin-bottom:24px;">
          <span style="font-size:24px;margin-right:16px;">🎙</span>
          <div>
            <p style="font-size:18px;font-weight:700;margin:0 0 4px;color:#111827;">Step 1: Record</p>
            <p style="font-size:16px;color:#4b5563;margin:0;line-height:1.5;">Hit record and start telling your bedtime story.</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;margin-bottom:24px;">
          <span style="font-size:24px;margin-right:16px;">📝</span>
          <div>
            <p style="font-size:18px;font-weight:700;margin:0 0 4px;color:#111827;">Step 2: Transcribe</p>
            <p style="font-size:16px;color:#4b5563;margin:0;line-height:1.5;">Our custom AI cleanly converts your voice to text.</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;margin-bottom:24px;">
          <span style="font-size:24px;margin-right:16px;">📖</span>
          <div>
            <p style="font-size:18px;font-weight:700;margin:0 0 4px;color:#111827;">Step 3: Build</p>
            <p style="font-size:16px;color:#4b5563;margin:0;line-height:1.5;">Add more chapters, night after night.</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;">
          <span style="font-size:24px;margin-right:16px;">🎨</span>
          <div>
            <p style="font-size:18px;font-weight:700;margin:0 0 4px;color:#111827;">Step 4: Publish</p>
            <p style="font-size:16px;color:#4b5563;margin:0;line-height:1.5;">Turn the finished story into an illustrated book.</p>
          </div>
        </div>
      </div>
      
      <table border="0" cellspacing="0" cellpadding="0" style="margin: 40px auto 0;">
        <tr>
          <td align="center" bgcolor="#6d28d9" style="border-radius: 8px;">
            <a href="${SITE_URL}/books/new" style="display:inline-block;color:#ffffff;padding:16px 40px;text-decoration:none;font-weight:600;font-size:18px;">✨ Start Your First Story</a>
          </td>
        </tr>
      </table>
      
      <p style="font-size:15px;color:#6b7280;margin-top:40px;text-align:center;font-weight:500;">Questions? Just reply to this email.</p>
    `),
  })
}

