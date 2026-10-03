-- ============================================================
-- Bikoom Store — demo seed data
-- Run AFTER schema.sql in the Supabase SQL editor.
-- Prices are realistic Nigerian demo figures (NGN) and can be
-- edited or deleted later from the admin dashboard.
-- Safe to re-run: existing demo rows are skipped by slug.
-- ============================================================

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order)
values
  ('Laptops',    'laptops',    'New, foreign-used and refurbished laptops', 1),
  ('Phones',     'phones',     'Smartphones from entry-level to flagship', 2),
  ('Furniture',  'furniture',  'Office and home furniture', 3),
  ('Starlink',   'starlink',   'Starlink kits, installation and accessories', 4),
  ('Services',   'services',   'Photocopying, printing, setup and repair services', 5),
  ('Other',      'other',      'Accessories, networking gear and more', 6)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
insert into public.products
  (category_id, name, slug, description, price, show_price, is_available, is_featured, image_url, images)
select
  c.id, p.name, p.slug, p.description, p.price, p.show_price,
  p.is_available, p.is_featured, null, '{}'
from (values
  -- ===== Laptops =====
  ('laptops', 'HP EliteBook 840 G8', 'hp-elitebook-840-g8',
   'Intel Core i5-11th Gen, 16GB RAM, 512GB SSD, 14" FHD display. Clean foreign-used unit with no faults, ideal for students and professionals. Comes with charger.',
   785000.00, true, true, true),

  ('laptops', 'Lenovo ThinkPad X1 Carbon Gen 9', 'lenovo-thinkpad-x1-carbon-gen-9',
   'Intel Core i7-11th Gen, 16GB RAM, 512GB SSD, 14" HDR display. Premium business ultrabook, lightweight carbon-fibre build. Foreign-used, grade A.',
   1150000.00, true, true, true),

  ('laptops', 'Dell Latitude 5420', 'dell-latitude-5420',
   'Intel Core i5-11th Gen, 8GB RAM, 256GB SSD, 14" FHD. Reliable workhorse for office and school work. Foreign-used with original charger.',
   620000.00, true, true, false),

  ('laptops', 'Apple MacBook Air M1 (2020)', 'apple-macbook-air-m1-2020',
   'Apple M1 chip, 8GB RAM, 256GB SSD, 13.3" Retina display. Silent fanless design, all-day battery. Foreign-used, excellent condition.',
   980000.00, true, true, true),

  ('laptops', 'HP ProBook 450 G8', 'hp-probook-450-g8',
   'Intel Core i5-11th Gen, 8GB RAM, 512GB SSD, 15.6" FHD. Full-size business laptop with numeric keypad. Chat for today''s price and bundle deals.',
   null, false, true, false),

  ('laptops', 'Toshiba Satellite C660 (Spares/Repair)', 'toshiba-satellite-c660',
   'Core i3, 4GB RAM, 500GB HDD. Good for parts or light school use. Sold as-is — contact us to inspect before buying.',
   165000.00, true, false, false),

  -- ===== Phones =====
  ('phones', 'Samsung Galaxy A15 4GB/128GB', 'samsung-galaxy-a15',
   '6.5" Super AMOLED display, 5000mAh battery, 50MP camera. Brand new, sealed with 1-year warranty. Dual SIM.',
   265000.00, true, true, false),

  ('phones', 'Samsung Galaxy S23 8GB/256GB', 'samsung-galaxy-s23',
   '6.1" Dynamic AMOLED 2X, Snapdragon 8 Gen 2, 50MP triple camera. Foreign-used grade A, battery health 90%+. Clean IMEI.',
   720000.00, true, true, true),

  ('phones', 'iPhone 13 128GB', 'iphone-13-128gb',
   '6.1" Super Retina XDR, A15 Bionic, dual 12MP cameras. Foreign-used (UK used), battery health 85%+, unlocked and tested.',
   690000.00, true, true, true),

  ('phones', 'Tecno Spark 20 8GB/256GB', 'tecno-spark-20',
   '6.6" 90Hz display, 5000mAh battery, 50MP camera. Brand new, sealed. Great value for everyday use.',
   185000.00, true, true, false),

  ('phones', 'Infinix Note 30 8GB/256GB', 'infinix-note-30',
   '6.78" 120Hz display, 5000mAh with 45W fast charge, 108MP camera. Brand new, sealed. Restocking soon.',
   215000.00, true, false, false),

  ('phones', 'itel A70 3GB/128GB', 'itel-a70',
   '6.6" display, 5000mAh battery, face unlock. Brand new, sealed. Perfect entry-level phone.',
   95000.00, true, true, false),

  -- ===== Furniture =====
  ('furniture', 'Executive Office Desk with Drawers', 'executive-office-desk',
   'Spacious executive desk with three drawers and cable cut-out. Warm walnut finish, sturdy metal frame. Delivery within Ogoja arranged on WhatsApp.',
   320000.00, true, true, false),

  ('furniture', 'Ergonomic Mesh Office Chair', 'ergonomic-mesh-office-chair',
   'Adjustable height, lumbar support, breathable mesh back, flip-up armrests. Supports long working hours comfortably.',
   165000.00, true, true, true),

  ('furniture', '4-Seater Fabric Sofa Set', '4-seater-fabric-sofa-set',
   'Premium fabric 4-seater with two-seater companion. Choice of colour and fabric — chat with us for current prices and lead time.',
   null, false, true, false),

  ('furniture', '3-Seater Wooden Dining Table Set', '3-seater-dining-table-set',
   'Solid wood dining table with three chairs, polished finish. Seats 4–6 comfortably. Made to order in Ogoja.',
   480000.00, true, true, false),

  ('furniture', 'TV Console / Centre Table', 'tv-console-centre-table',
   'Modern low-profile TV console with two shelves for decoders and accessories. Fits TVs up to 55".',
   120000.00, true, true, false),

  -- ===== Starlink =====
  ('starlink', 'Starlink Standard Kit (Hardware)', 'starlink-standard-kit',
   'Original Starlink standard kit with dish, mount, cable and router. One-time hardware purchase — monthly subscription is separate. We deliver and set it up for you.',
   499000.00, true, true, true),

  ('starlink', 'Starlink Installation Service — Ogoja & Cross River', 'starlink-installation-service',
   'Professional mounting, alignment and activation by the Bikoom team. Includes site assessment, pole/roof mounting and speed testing. Available in Ogoja and across Cross River.',
   45000.00, true, true, true),

  ('starlink', 'Starlink Roof Mounting Pole & Brackets', 'starlink-mounting-pole',
   'Weatherproof galvanised pole with roof brackets and guy wires, for clear-sky Starlink placement. Installation available on request.',
   65000.00, true, true, false),

  -- ===== Services =====
  ('services', 'Photocopying (A4, per page)', 'photocopying-a4-per-page',
   'Clear, jam-free photocopying — bulk and double-sided discounts available. Ogoja only: walk into our shop or send documents on WhatsApp to place your order. Price per page.',
   50.00, true, true, false),

  ('services', 'Spiral Binding & Lamination', 'spiral-binding-lamination',
   'Spiral binding for projects and reports, plus lamination for cards and certificates. Ogoja only. Price starts from — chat us for a quote on your job.',
   2500.00, true, true, false),

  ('services', 'Laptop Servicing & Virus Removal', 'laptop-servicing-virus-removal',
   'Full diagnostic, operating-system cleanup, virus/malware removal and thermal paste replacement. Free diagnosis when you leave your laptop with us in Ogoja.',
   25000.00, true, true, false),

  ('services', 'Home/Office Wi-Fi Setup', 'wifi-setup-service',
   'Router configuration, mesh/extender placement and device setup for homes and offices. We make every corner of your space connected.',
   30000.00, true, true, false),

  -- ===== Other =====
  ('other', 'TP-Link Archer C6 Dual-Band Router', 'tp-link-archer-c6',
   'AC1200 dual-band Wi-Fi router, 4 LAN ports, app management. Perfect for small homes and offices.',
   45000.00, true, true, false),

  ('other', '1000VA UPS (Uninterruptible Power Supply)', '1000va-ups',
   'Protects your laptop, router and TV from outages and surges. Battery tested and ready. Great for Ogoja power conditions.',
   55000.00, true, true, false),

  ('other', 'CCTV DVR 4-Channel + 2 Cameras Kit', 'cctv-4channel-2camera-kit',
   '4-channel DVR with 2 HD cameras, mobile viewing setup included. Installation available within Ogoja.',
   null, false, true, false)
) as p(category_slug, name, slug, description, price, show_price, is_available, is_featured)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Homepage banners
-- ------------------------------------------------------------
insert into public.banners (title, subtitle, image_url, link_url, is_active, sort_order)
select b.title, b.subtitle, null, b.link_url, true, b.sort_order
from (values
  ('Laptops & Phones in Ogoja',
   'Quality devices, honest prices and after-sale support. Every order is confirmed with you on WhatsApp.',
   '/shop', 1),

  ('Starlink Installation, Done Right',
   'Kits, mounting and activation by the Bikoom team — anywhere in Ogoja and across Cross River.',
   '/category/starlink', 2),

  ('Photocopying & Printing — Ogoja Only',
   'Projects, reports, lamination and spiral binding. Send your documents on WhatsApp and pick up same day.',
   '/category/services', 3)
) as b(title, subtitle, link_url, sort_order)
on conflict do nothing;

-- ------------------------------------------------------------
-- (After your first Google sign-in) Promote yourself to admin:
--   select public.promote_admin('your-gmail@gmail.com');
-- ------------------------------------------------------------
