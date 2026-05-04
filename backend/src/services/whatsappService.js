const twilio = require('twilio');

/**
 * WhatsApp Notification Service (Twilio Sandbox)
 * ---------------------------------------------
 * - Single admin number
 * - Reusable
 * - No app bootstrap dependency
 * - Safe to import anywhere
 */

let client = null;

/**
 * Initialize Twilio client lazily
 * (prevents app crash if env vars missing during dev)
 */
function getClient() {
  if (!client) {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
    } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials missing');
    }

    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

/**
 * Send WhatsApp message to admin
 */
exports.sendWhatsAppAlert = async (message) => {
  const {
    TWILIO_WHATSAPP_FROM,
    ADMIN_WHATSAPP_NUMBER,
  } = process.env;

  if (!TWILIO_WHATSAPP_FROM || !ADMIN_WHATSAPP_NUMBER) {
    throw new Error('WhatsApp env vars missing');
  }

  const twilioClient = getClient();

  return twilioClient.messages.create({
    from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${ADMIN_WHATSAPP_NUMBER}`,
    body: message,
  });
};
