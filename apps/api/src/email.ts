import nodemailer from "nodemailer";

const resendApiUrl = "https://api.resend.com/emails";

export type TransactionalEmailProvider = "resend" | "gmail";

export function resolveTransactionalEmailProvider(
  environment: Record<string, string | undefined> = process.env
): TransactionalEmailProvider | null {
  const requestedProvider = environment.EMAIL_PROVIDER?.trim().toLowerCase();
  const resendConfigured = Boolean(environment.RESEND_API_KEY?.trim() && environment.EMAIL_FROM?.trim());
  const gmailUser = environment.GMAIL_USER?.trim() ?? "";
  const gmailPassword = environment.GMAIL_APP_PASSWORD?.replace(/\s/g, "") ?? "";
  const gmailConfigured = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmailUser) && gmailPassword.length >= 16;

  if (requestedProvider === "resend") return resendConfigured ? "resend" : null;
  if (requestedProvider === "gmail") return gmailConfigured ? "gmail" : null;
  if (requestedProvider) return null;

  if (resendConfigured) return "resend";
  if (gmailConfigured) return "gmail";
  return null;
}

export function isTransactionalEmailConfigured() {
  return resolveTransactionalEmailProvider() !== null;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  idempotencyKey: string;
}) {
  const provider = resolveTransactionalEmailProvider();
  if (!provider) throw new Error("El correo transaccional no está configurado.");

  const message = passwordResetMessage(input.resetUrl);
  if (provider === "gmail") {
    await sendWithGmail(input.to, message);
    return;
  }

  await sendWithResend(input.to, input.idempotencyKey, message);
}

type PasswordResetMessage = { subject: string; html: string; text: string };

async function sendWithGmail(to: string, message: PasswordResetMessage) {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) throw new Error("Gmail SMTP no está configurado.");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM?.trim() || `Localito <${user}>`,
      to,
      ...message,
      disableFileAccess: true,
      disableUrlAccess: true
    });
  } finally {
    transporter.close();
  }
}

async function sendWithResend(to: string, idempotencyKey: string, message: PasswordResetMessage) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("El correo transaccional no está configurado.");

  const response = await fetch(resendApiUrl, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "localito/0.1.0"
    },
    body: JSON.stringify({
      from,
      to: [to],
      ...message,
      tags: [{ name: "category", value: "password_reset" }]
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Resend rechazó el correo (${response.status})${details ? `: ${details.slice(0, 300)}` : ""}`);
  }
}

function passwordResetMessage(resetUrl: string): PasswordResetMessage {
  const safeResetUrl = escapeHtml(resetUrl);
  return {
    subject: "Restablece tu contraseña de Localito",
    html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.6">
          <h1 style="font-size:24px;margin-bottom:12px">Restablece tu contraseña</h1>
          <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta Localito.</p>
          <p style="margin:28px 0">
            <a href="${safeResetUrl}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700">
              Crear nueva contraseña
            </a>
          </p>
          <p>El enlace vence en 30 minutos y solo puede utilizarse una vez.</p>
          <p style="color:#64748b;font-size:14px">Si no solicitaste este cambio, ignora este correo. Tu contraseña seguirá siendo la misma.</p>
        </div>`,
    text: [
      "Restablece tu contraseña de Localito",
      "",
      "Abre este enlace para crear una nueva contraseña:",
      resetUrl,
      "",
      "El enlace vence en 30 minutos y solo puede utilizarse una vez.",
      "Si no solicitaste este cambio, ignora este correo."
    ].join("\n")
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
