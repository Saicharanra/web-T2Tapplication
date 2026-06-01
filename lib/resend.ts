import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_development";
export const resend = new Resend(resendApiKey);

export const EMAIL_FROM = process.env.EMAIL_FROM || "Trash2Treasure <onboarding@resend.dev>";
export const isResendConfigured = !!process.env.RESEND_API_KEY;
