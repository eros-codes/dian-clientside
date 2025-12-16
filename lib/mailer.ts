// Mailer removed — no-op implementations to ensure builds don't attempt network calls.
export async function sendMail(_to: string, _subject: string, _text: string, _html?: string) {
  // intentionally no-op
  return { success: false, message: "mailer removed" };
}

export async function sendVerificationEmail(_to: string, _code: string) {
  return { success: false, message: "mailer removed" };
}

export async function sendWelcomeEmail(_to: string, _name: string) {
  return { success: false, message: "mailer removed" };
}
