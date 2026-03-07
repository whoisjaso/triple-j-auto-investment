-- Triple J Auto Investment — Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor.

-- ============================================================
-- VEHICLES (6 realistic Houston BHPH inventory)
-- ============================================================

insert into vehicles (make, model, year, price, mileage, vin, status, description, image_url, slug, body_style, exterior_color, interior_color, transmission, drivetrain, engine, fuel_type) values

(
  'Toyota', 'Camry SE', 2019, 6995.00, 89432,
  '4T1B11HK5KU812345', 'Available',
  'Reliable and fuel-efficient sedan perfect for the daily commute. Well-maintained with clean title. Bluetooth, backup camera, and comfortable seating for the whole family. Come see it today!',
  '/images/vehicles/placeholder-1.jpg',
  '2019-toyota-camry-se',
  'Sedan', 'Silver', 'Black', 'Automatic', 'FWD', '2.5L 4-Cylinder', 'Gasoline'
),

(
  'Honda', 'CR-V EX', 2018, 7500.00, 102587,
  '2HKRW2H53JH654321', 'Available',
  'Spacious SUV with room for the whole familia. Sunroof, Apple CarPlay, and Honda reliability you can count on. Great condition inside and out. Financing available!',
  '/images/vehicles/placeholder-2.jpg',
  '2018-honda-cr-v-ex',
  'SUV', 'White', 'Gray', 'CVT', 'AWD', '1.5L Turbo 4-Cylinder', 'Gasoline'
),

(
  'Nissan', 'Altima S', 2020, 5800.00, 78915,
  '1N4BL4BV1LC234567', 'Available',
  'Low-mileage sedan with excellent gas mileage. Clean interior, cold A/C, and smooth ride. Perfect first car or family vehicle. Stop by for a test drive!',
  '/images/vehicles/placeholder-3.jpg',
  '2020-nissan-altima-s',
  'Sedan', 'Black', 'Black', 'CVT', 'FWD', '2.5L 4-Cylinder', 'Gasoline'
),

(
  'Ford', 'Explorer XLT', 2017, 6200.00, 118340,
  '1FM5K8D82HGA98765', 'Available',
  'Full-size SUV with three rows of seating — perfect for larger families. Powerful V6 engine, towing capability, and loaded with features. Well-maintained and ready to go.',
  '/images/vehicles/placeholder-4.jpg',
  '2017-ford-explorer-xlt',
  'SUV', 'Blue', 'Tan', 'Automatic', '4WD', '3.5L V6', 'Gasoline'
),

(
  'Chevrolet', 'Malibu LT', 2021, 7200.00, 64280,
  '1G1ZD5ST8MF345678', 'Available',
  'Nearly new sedan with low miles and a clean Carfax. Turbocharged engine, touchscreen infotainment, and advanced safety features. Excellent value at this price.',
  '/images/vehicles/placeholder-5.jpg',
  '2021-chevrolet-malibu-lt',
  'Sedan', 'Red', 'Black', 'CVT', 'FWD', '1.5L Turbo 4-Cylinder', 'Gasoline'
),

(
  'Hyundai', 'Tucson SEL', 2019, 5500.00, 95710,
  'KM8J33A45KU567890', 'Available',
  'Compact SUV with great fuel economy and a smooth ride. Heated seats, blind-spot monitoring, and plenty of cargo space. Affordable and reliable — come see it!',
  '/images/vehicles/placeholder-6.jpg',
  '2019-hyundai-tucson-sel',
  'SUV', 'Gray', 'Black', 'Automatic', 'FWD', '2.4L 4-Cylinder', 'Gasoline'
);

-- ============================================================
-- LEADS (3 sample leads)
-- ============================================================

insert into leads (name, email, phone, message, vehicle_id, source, status) values

(
  'Maria Garcia', 'maria.garcia@email.com', '832-555-0101',
  'Hi, I am interested in learning more about your financing options. My family needs a reliable vehicle.',
  null, 'financing_inquiry', 'New'
),

(
  'Carlos Rodriguez', null, '713-555-0202',
  'Is the 2019 Camry still available? I would like to come see it this weekend.',
  (select id from vehicles where slug = '2019-toyota-camry-se' limit 1),
  'vehicle_inquiry', 'Contacted'
),

(
  'Ana Martinez', 'ana.m@email.com', '281-555-0303',
  'I saw your listing on Facebook. Looking for a family SUV under $7000. What do you have available?',
  null, 'contact_form', 'New'
);
