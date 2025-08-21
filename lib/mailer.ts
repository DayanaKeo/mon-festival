// lib/mailer.ts
import nodemailer from "nodemailer";
import crypto from "crypto";

/* =============== Base URL & Secret =============== */
const ORIGIN = (
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const REMINDER_LINK_SECRET =
  process.env.REMINDER_LINK_SECRET || "dev-secret-change-me"; // ⚠️ change en prod !

type EventHref = `${string}/events/${string | number}`;

/* =============== Transporter =============== */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

/* =============== Helpers =============== */
function esc(s: string) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[c] as string));
}

function wrapAuroraShell(opts: {
  subtitle: string;
  bodyHtml: string;
  cta?: { url: string; label: string };
  rawLink?: string;
  footer?: string;
}) {
  const { subtitle, bodyHtml, cta, rawLink, footer } = opts;
  return `
  <div style="background:#0b0b14;padding:32px;font-family:Inter,system-ui,Arial,sans-serif;color:#fff">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.05);backdrop-filter:blur(8px);border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:28px;background:linear-gradient(135deg,#c026d3,#7c3aed,#2563eb);color:#fff">
          <h1 style="margin:0;font-size:22px">Aurora Fest</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">${esc(subtitle)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;background:#0f0f1a;color:#e5e7eb">
          ${bodyHtml}
          ${cta ? `
            <div style="margin-top:12px">
              <a href="${cta.url}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600">
                ${esc(cta.label)}
              </a>
            </div>
          ` : ""}

          ${rawLink ? `
            <p style="margin:18px 0 0;font-size:12px;opacity:.8">Si le bouton ne marche pas, copie ce lien :</p>
            <p style="word-break:break-all;font-size:12px;opacity:.8;margin:6px 0 0">${rawLink}</p>
          ` : ""}

          ${footer ? `
            <p style="margin:18px 0 0;font-size:12px;opacity:.8">${esc(footer)}</p>
          ` : ""}
        </td>
      </tr>
    </table>
  </div>`;
}

/* =============== Signature & Lien =============== */
function signReminder(eid: string | number, rid: string | number, uid: string | number, delai: number) {
  const data = `${eid}.${rid}.${uid}.${delai}`;
  return crypto.createHmac("sha256", REMINDER_LINK_SECRET).update(data).digest("hex").slice(0, 16);
}

function buildReminderLink(
  eid: number | string,
  rid: number | string,
  uid: number | string,
  delai: number
): EventHref {
  const sig = signReminder(eid, rid, uid, delai);
  const qs = new URLSearchParams({ r: String(rid), d: String(delai), u: String(uid), sig });
  return `${ORIGIN}/events/${eid}?${qs.toString()}` as EventHref;
}

/* =============== Emails — Rappels 60/30/15 =============== */
export async function sendReminderEmail(args: {
  to: string;
  nom?: string;
  titre: string;
  dateDebut: Date | string;
  delai: number;                 // 60 / 30 / 15
  eventId: number | string;
  rappelId: number | string;
  userId: number | string;
}) {
  const { to, nom, titre, dateDebut, delai, eventId, rappelId, userId } = args;

  const lien = buildReminderLink(eventId, rappelId, userId, delai);
  const when = new Date(dateDebut).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  const bodyHtml = `
    <p style="margin:0 0 14px">Salut ${esc(nom ?? "")},</p>
    <p style="margin:0 0 14px">« <strong>${esc(titre)}</strong> » commence dans <strong>${delai} min</strong>.</p>
    <p style="margin:0 0 14px">Début&nbsp;: <strong>${esc(when)}</strong></p>
  `;

  const html = wrapAuroraShell({
    subtitle: `Rappel ${delai} min avant l’événement`,
    bodyHtml,
    cta: { url: lien, label: "Voir l’événement" },
    rawLink: lien,
    footer: "Vous recevez cet e-mail car vous avez activé un rappel depuis la fiche de l’événement.",
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Rappel ${delai} min — ${titre}`,
    html,
  });
}

/* =============== Email — Confirmation d’activation =============== */

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

/**
 * Email envoyé au moment où l’utilisateur clique la cloche.
 * `created` doit contenir les rappels créés (id + delai). Le CTA pointe
 * vers le **prochain** rappel (le plus proche), et le texte liste tous les délais.
 */
export async function sendReminderActivatedEmail(args: {
  to: string;
  nom?: string;
  titre: string;
  dateDebut: Date | string;
  eventId: number | string;
  userId: number | string;
  created: Array<{ id: number | string; delai: number }>; // ex: [{id: 101, delai:60},{id:102, delai:30},{id:103, delai:15}]
}) {
  const { to, nom, titre, dateDebut, eventId, userId, created } = args;

  // Prochain rappel = délai le plus petit
  const sorted = [...created].sort((a, b) => a.delai - b.delai);
  const next = sorted[0]; // p.ex. 15 min
  const delaisTxt = sorted.map(x => x.delai).sort((a, b) => b - a).join(" / ");

  const lien = next ? buildReminderLink(eventId, next.id, userId, next.delai)
                    : (`${ORIGIN}/events/${eventId}` as EventHref);

  const when = new Date(dateDebut).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  const bodyHtml = `
    <p style="margin:0 0 14px">Salut ${esc(nom ?? "")},</p>
    <p style="margin:0 0 14px">Le rappel pour « <strong>${esc(titre)}</strong> » est activé.</p>
    <p style="margin:0 0 14px">Tu seras prévenu à <strong>${esc(delaisTxt)} min</strong> avant le début.</p>
    <p style="margin:0 0 14px">Début&nbsp;: <strong>${esc(when)}</strong></p>
  `;

  const html = wrapAuroraShell({
    subtitle: "Rappel activé",
    bodyHtml,
    cta: { url: lien, label: "Voir l’événement" },
    rawLink: lien,
    footer: "Astuce : autorise les notifications navigateur pour être alerté même si l’onglet est en arrière-plan.",
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Rappel activé — ${titre}`,
    html,
  });
}

/* =============== (ex) Email reset au même design =============== */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${ORIGIN}/reset?token=${encodeURIComponent(token)}`;
  const html = `
  <div style="background:#0b0b14;padding:32px;font-family:Inter,system-ui,Arial,sans-serif;color:#fff">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.05);backdrop-filter:blur(8px);border-radius:16px;overflow:hidden">
      <tr>
        <td style="padding:28px;background:linear-gradient(135deg,#c026d3,#7c3aed,#2563eb);color:#fff">
          <h1 style="margin:0;font-size:22px">Aurora Fest</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">Réinitialise ton mot de passe</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;background:#0f0f1a;color:#e5e7eb">
          <p style="margin:0 0 14px">Tu as demandé une réinitialisation de mot de passe.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600">Choisir un nouveau mot de passe</a>
          <p style="margin:18px 0 0;font-size:12px;opacity:.8">Ou copie ce lien :</p>
          <p style="word-break:break-all;font-size:12px;opacity:.8;margin:6px 0 0">${resetUrl}</p>
          <p style="margin:18px 0 0;font-size:12px;opacity:.8">Lien valable 1h.</p>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Réinitialisation du mot de passe – Aurora Fest",
    html,
  });
}
