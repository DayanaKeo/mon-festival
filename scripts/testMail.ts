import 'dotenv/config'
import nodemailer from 'nodemailer'

async function main() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 2525),
        secure: false,
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    })

    await transporter.verify() // sanity-check
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: 'test@example.com',
        subject: 'Hello Mailtrap',
        html: '<h1>Ceci est un test Mailtrap 🎉</h1>',
    })
    console.log('OK ->', info.messageId)
}

main().catch((e) => {
    console.error('Mail error:', e)
    process.exit(1)
})
