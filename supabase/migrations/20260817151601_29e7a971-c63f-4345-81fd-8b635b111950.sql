INSERT INTO public.product_images (product_id, store_id, url, position)
SELECT p.id, p.store_id, v.url, v.pos
FROM (VALUES
 ('33333333-3333-4333-8333-333333333333'::uuid,'/__l5e/assets-v1/0f51b29d-3af6-4cac-97ff-e2030fb1815c/demo-tote-2.jpg',1),
 ('33333333-3333-4333-8333-333333333333'::uuid,'/__l5e/assets-v1/896b9854-614c-4b58-ad35-0d49d384c4cd/demo-tote-3.jpg',2),
 ('33333333-3333-4333-8333-333333333331'::uuid,'/__l5e/assets-v1/967826a1-25f1-4a95-a34d-d470e0e95085/demo-candle-2.jpg',1)
) AS v(pid,url,pos)
JOIN public.products p ON p.id = v.pid
WHERE NOT EXISTS (SELECT 1 FROM public.product_images i WHERE i.url = v.url);