-- Make the customer-uploads bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'customer-uploads';