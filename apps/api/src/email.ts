const resendApiUrl = "https://api.resend.com/emails";

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("El correo transaccional no está configurado.");

  const safeResetUrl = escapeHtml(input.resetUrl);
  const response = await fetch(resendApiUrl, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "localito/0.1.0"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
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
        input.resetUrl,
        "",
        "El enlace vence en 30 minutos y solo puede utilizarse una vez.",
        "Si no solicitaste este cambio, ignora este correo."
      ].join("\n"),
      tags: [{ name: "category", value: "password_reset" }]
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Resend rechazó el correo (${response.status})${details ? `: ${details.slice(0, 300)}` : ""}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
