-- Add individualCashDonations column to offerings table
ALTER TABLE offerings ADD COLUMN individualCashDonations TEXT;

-- Show updated table structure
PRAGMA table_info(offerings);