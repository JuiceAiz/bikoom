-- Remove the previous public business-location copy from seeded products and
-- homepage banners without changing delivery destinations customers submit.
update public.products
set
  name = case slug
    when 'starlink-installation-service' then 'Starlink Installation Service'
    else name
  end,
  description = case slug
    when 'executive-office-desk' then
      'Spacious executive desk with three drawers and cable cut-out. Warm walnut finish, sturdy metal frame. Delivery arranged on WhatsApp.'
    when '3-seater-dining-table-set' then
      'Solid wood dining table with three chairs, polished finish. Seats 4–6 comfortably. Made to order.'
    when 'starlink-installation-service' then
      'Professional mounting, alignment and activation by the Bikoom team. Includes site assessment, pole/roof mounting and speed testing. Message us on WhatsApp to confirm service availability.'
    when 'photocopying-a4-per-page' then
      'Clear, jam-free photocopying — bulk and double-sided discounts available. Message us on WhatsApp to confirm availability and place your order. Price per page.'
    when 'spiral-binding-lamination' then
      'Spiral binding for projects and reports, plus lamination for cards and certificates. Price starts from — chat us for a quote on your job.'
    when 'laptop-servicing-virus-removal' then
      'Full diagnostic, operating-system cleanup, virus/malware removal and thermal paste replacement. Message us to ask about service arrangements.'
    when '1000va-ups' then
      'Protects your laptop, router and TV from outages and surges. Battery tested and ready.'
    when 'cctv-4channel-2camera-kit' then
      '4-channel DVR with 2 HD cameras, mobile viewing setup included. Installation available on request.'
    else description
  end
where slug in (
  'executive-office-desk',
  '3-seater-dining-table-set',
  'starlink-installation-service',
  'photocopying-a4-per-page',
  'spiral-binding-lamination',
  'laptop-servicing-virus-removal',
  '1000va-ups',
  'cctv-4channel-2camera-kit'
)
and (
  name ilike '%Ogoja%'
  or name ilike '%Cross River%'
  or description ilike '%Ogoja%'
  or description ilike '%Cross River%'
);

update public.banners
set
  title = case
    when title = 'Office Equipment & More in Ogoja' then 'Office Equipments & More'
    when title = 'Photocopying & Printing — Ogoja Only' then 'Photocopying & Printing'
    else title
  end,
  subtitle = case
    when title = 'Starlink Installation, Done Right' then
      'Kits, mounting and activation by the Bikoom team. Message us on WhatsApp to confirm service availability.'
    when title = 'Photocopying & Printing — Ogoja Only' then
      'Projects, reports, lamination and spiral binding. Message us on WhatsApp to confirm availability.'
    else subtitle
  end
where title ilike '%Ogoja%'
   or subtitle ilike '%Ogoja%'
   or subtitle ilike '%Cross River%';
