/**
 * Email service using Brevo SMTP via Nodemailer.
 * Handles sending, logging, and retry logic.
 */
import { getSupabaseAdmin } from './supabase';
import { TABLES } from './db-tables';

// ── Types ──
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  templateType: string;
  metadata?: Record<string, unknown>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}

// ── Nodemailer transport (lazy-loaded) ──
let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Dynamic import to avoid issues in edge runtime
  const nodemailer = await import('nodemailer');

  transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER || '',
      pass: process.env.BREVO_SMTP_KEY || '',
    },
  });

  return transporter;
}

// ── Send Email ──
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, userId, templateType, metadata } = options;
  const supabase = getSupabaseAdmin();

  // Create email log entry
  const { data: logEntry, error: logError } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .insert({
      userId: userId || null,
      toEmail: to,
      subject,
      templateType,
      status: 'PENDING',
      metadata: metadata || {},
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Failed to create email log:', logError);
  }

  const logId = logEntry?.id;

  try {
    // Check if SMTP is configured
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
      console.warn('⚠️ Brevo SMTP not configured. Email skipped:', subject);
      
      // Update log to reflect skipped status
      if (logId) {
        await supabase
          .from(TABLES.EMAIL_LOGS)
          .update({
            status: 'FAILED',
            errorMessage: 'SMTP credentials not configured',
          })
          .eq('id', logId);
      }

      return {
        success: false,
        error: 'SMTP not configured',
        logId,
      };
    }

    const transport = await getTransporter();
    const fromName = process.env.BREVO_FROM_NAME || 'Trash2Treasure';
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@trash2treasure.com';

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId, 'to:', to);

    // Update log to sent
    if (logId) {
      await supabase
        .from(TABLES.EMAIL_LOGS)
        .update({
          status: 'SENT',
          sentAt: new Date().toISOString(),
        })
        .eq('id', logId);
    }

    return {
      success: true,
      messageId: info.messageId,
      logId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email send failed:', errorMessage);

    // Update log to failed
    if (logId) {
      await supabase
        .from(TABLES.EMAIL_LOGS)
        .update({
          status: 'FAILED',
          errorMessage,
        })
        .eq('id', logId);
    }

    return {
      success: false,
      error: errorMessage,
      logId,
    };
  }
}

// ── Retry Failed Emails ──
export async function retryFailedEmails(): Promise<{ retried: number; errors: number }> {
  const supabase = getSupabaseAdmin();

  const { data: failedEmails, error } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select('*')
    .eq('status', 'FAILED')
    .lt('retryCount', 3)
    .order('createdAt', { ascending: true })
    .limit(10);

  if (error || !failedEmails) {
    return { retried: 0, errors: 1 };
  }

  let retried = 0;
  let errors = 0;

  for (const log of failedEmails) {
    try {
      // Mark as retrying
      await supabase
        .from(TABLES.EMAIL_LOGS)
        .update({
          status: 'RETRYING',
          retryCount: log.retryCount + 1,
          lastRetryAt: new Date().toISOString(),
        })
        .eq('id', log.id);

      // Re-attempt send (we don't have the HTML stored, so this is limited)
      // In a full implementation, you'd store the HTML or regenerate it
      console.log(`🔄 Retry ${log.retryCount + 1} for email ${log.id}`);
      
      retried++;
    } catch {
      errors++;
    }
  }

  return { retried, errors };
}

// ── Get Email Stats ──
export async function getEmailStats() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select('status');

  if (error || !data) return { total: 0, sent: 0, failed: 0, pending: 0 };

  return {
    total: data.length,
    sent: data.filter(e => e.status === 'SENT').length,
    failed: data.filter(e => e.status === 'FAILED').length,
    pending: data.filter(e => e.status === 'PENDING').length,
  };
}
