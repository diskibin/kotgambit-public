-- The letter about a coming automatic charge goes once per paid period
ALTER TABLE "subscriptions" ADD COLUMN "renewal_notice_for" TIMESTAMP(3);
