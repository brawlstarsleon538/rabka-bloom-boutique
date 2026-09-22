import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import nodemailer from "nodemailer";

const contactSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki").max(120),
  email: z.string().email("Podaj poprawny adres e-mail").max(160),
  message: z.string().min(5, "Wiadomość musi mieć co najmniej 5 znaków").max(4000),
});

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  recipient: string;
  created_at: Date;
};

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { db } = await import("@/db/client.server");
    const sql = await db();

    // Ensure contact_messages table exists in PostgreSQL
    await sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL,
        message text NOT NULL,
        recipient text NOT NULL DEFAULT 'sivik.flowers@gmail.com',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    // Save message to DB
    await sql`
      INSERT INTO contact_messages (name, email, message, recipient)
      VALUES (${data.name}, ${data.email}, ${data.message}, 'sivik.flowers@gmail.com')
    `;

    const recipientEmail = "sivik.flowers@gmail.com";
    let emailSent = false;

    // 1. Attempt Nodemailer SMTP if credentials are configured
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || recipientEmail;
    const smtpPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    if (smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"SiViK Flowers" <${smtpUser}>`,
          to: recipientEmail,
          replyTo: data.email,
          subject: `Nowa wiadomość od ${data.name} (SiViK Flowers)`,
          text: `Od: ${data.name} <${data.email}>\n\nWiadomość:\n${data.message}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #8b263e;">Nowa wiadomość ze strony SiViK Flowers</h2>
              <p><strong>Imię:</strong> ${data.name}</p>
              <p><strong>E-mail klienta:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p><strong>Treść wiadomości:</strong></p>
              <p style="white-space: pre-wrap; background: #fdfbf7; padding: 15px; border-radius: 6px;">${data.message}</p>
            </div>
          `,
        });

        emailSent = true;
        console.log(`[SMTP SUCCESS] E-mail physically delivered to ${recipientEmail}!`);
      } catch (err) {
        console.error(`[SMTP ERROR]`, err);
      }
    }

    // 2. Automatic cloud dispatch to Google email via FormSubmit API
    if (!emailSent) {
      try {
        const resp = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            message: data.message,
            _subject: `Nowa wiadomość ze strony SiViK Flowers od ${data.name}`,
            _replyto: data.email,
            _template: "table",
          }),
        });

        if (resp.ok) {
          emailSent = true;
          console.log(`[FORMSUBMIT SUCCESS] E-mail automatically sent to ${recipientEmail}!`);
        } else {
          console.warn(`[FORMSUBMIT WARNING] HTTP status: ${resp.status}`);
        }
      } catch (err) {
        console.error(`[FORMSUBMIT ERROR]`, err);
      }
    }

    return {
      ok: true as const,
      emailSent,
      recipient: recipientEmail,
      message: "Wiadomość została wysłana automatycznie na adres sivik.flowers@gmail.com!",
    };
  });

export const listContactMessages = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactMessageRow[]> => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();

    await sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL,
        message text NOT NULL,
        recipient text NOT NULL DEFAULT 'sivik.flowers@gmail.com',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    const rows = await sql<ContactMessageRow[]>`
      SELECT id, name, email, message, recipient, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `;
    return [...rows];
  },
);
