import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function sendVerificationEmail(email: string, nom: string | undefined, token: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${encodeURIComponent(token)}`
    const html = `
  <div style="background:#0b0b14;padding:32px;font-family:Inter,system-ui,Arial,sans-serif;color:#fff">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.05);backdrop-filter:blur(8px);border-radius:16px;overflow:hidden">
      <tr><td style="padding:28px;background:linear-gradient(135deg,#c026d3,#7c3aed,#2563eb)"><h1 style="margin:0;font-size:22px">Aurora Fest</h1><p style="margin:6px 0 0;font-size:13px;opacity:.9">Confirme ton adresse e-mail</p></td></tr>
      <tr><td style="padding:24px 28px;background:#0f0f1a;color:#e5e7eb">
        <p style="margin:0 0 12px">Salut ${nom ?? ''},</p>
        <p style="margin:0 0 16px">Clique pour vérifier ton compte.</p>
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600">Vérifier mon e-mail</a>
        <p style="margin:18px 0 0;font-size:12px;opacity:.8">Si le bouton ne marche pas, copie ce lien :</p>
        <p style="word-break:break-all;font-size:12px;opacity:.8;margin:6px 0 0">${url}</p>
        <p style="margin:18px 0 0;font-size:12px;opacity:.8">Lien valable 24h.</p>
      </td></tr>
    </table>
  </div>`
    await transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject: 'Confirme ton adresse e-mail – Aurora Fest', html })
}
