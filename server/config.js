export const config = {
  port: process.env.PORT || 3001,
  // This is the shared secret between the backend and the fake payment provider.
  // In a real application, you would generate this on the payment gateway dashboard
  // and load it into your environment variables.
  webhookSecret: process.env.WEBHOOK_SECRET || "super_secret_webhook_key_12345",
  // The port of the backend. Since webhook goes server-to-server,
  // we point the fake payment provider here.
  backendUrl: `http://localhost:3001`,
  // Delay in milliseconds to simulate payment processing before sending a webhook
  paymentProcessingDelay: 4000
};
