-- Storefront product and branding images must be publicly readable.
-- The app stores stable object paths and resolves them with getPublicUrl().
update storage.buckets
set public = true
where id = 'store-media';
