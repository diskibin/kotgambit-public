-- The words the learner agreed to are kept with the payment: Robokassa asks to keep the history of agreements
ALTER TABLE "payments" ADD COLUMN "auto_renew_consent_text" TEXT;
