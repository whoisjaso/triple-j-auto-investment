-- Migration 09b: Seed default message templates
-- All templates start as is_approved=false, auto_send=false (admin must review first)

-- LEAD NURTURE TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'lead_nurture_sms_2h', 'en',
 'Hi {customer_name}, this is Triple J Auto Investment. We tried reaching you about the {vehicle_year} {vehicle_make} {vehicle_model}. Text us back or call (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 1),

('lead_nurture', 'voice', 'lead_nurture_divine_24h', 'en',
 'Follow-up call for {customer_name} about {vehicle_year} {vehicle_make} {vehicle_model} priced at {vehicle_price}.',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price'], 2),

('lead_nurture', 'sms', 'lead_nurture_sms_48h', 'en',
 'Still thinking about the {vehicle_year} {vehicle_make} {vehicle_model}? It''s still available at ${vehicle_price}. View it here: {vehicle_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price', 'vehicle_url'], 3),

('lead_nurture', 'email', 'lead_nurture_email_72h', 'en',
 'Hi {customer_name}, the {vehicle_year} {vehicle_make} {vehicle_model} you inquired about is still available. Estimated monthly payment: ${monthly_payment}/mo with $500 down. We also have similar vehicles you might like. Visit us at triplejautoinvestment.com/inventory',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'monthly_payment'], 4),

('lead_nurture', 'sms', 'lead_nurture_sms_7d', 'en',
 '{customer_name}, last chance — the {vehicle_year} {vehicle_make} {vehicle_model} has had {inquiry_count} other inquiries this week. Call (832) 400-9760 before it''s gone!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'inquiry_count'], 5),

('lead_nurture', 'sms', 'lead_nurture_cold_14d', 'en',
 '', ARRAY[]::TEXT[], 6)  -- Empty body = system action only (mark cold, no message sent)
ON CONFLICT (template_key, language) DO NOTHING;

-- LEAD NURTURE TEMPLATES (Spanish)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'lead_nurture_sms_2h', 'es',
 'Hola {customer_name}, somos Triple J Auto Investment. Intentamos comunicarnos sobre el {vehicle_year} {vehicle_make} {vehicle_model}. Responda o llame al (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 1),

('lead_nurture', 'sms', 'lead_nurture_sms_48h', 'es',
 'Todavia pensando en el {vehicle_year} {vehicle_make} {vehicle_model}? Sigue disponible a ${vehicle_price}. Velo aqui: {vehicle_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_price', 'vehicle_url'], 3),

('lead_nurture', 'sms', 'lead_nurture_sms_7d', 'es',
 '{customer_name}, ultima oportunidad — el {vehicle_year} {vehicle_make} {vehicle_model} ha tenido {inquiry_count} consultas esta semana. Llame al (832) 400-9760!',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'inquiry_count'], 5)
ON CONFLICT (template_key, language) DO NOTHING;

-- REGISTRATION TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('registration', 'sms', 'reg_stage_documents_collected', 'en',
 'Hi {customer_name}, we''ve received your documents for the {vehicle_year} {vehicle_make} {vehicle_model}. We''re preparing your DMV submission. Track progress: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'tracker_url'], 1),

('registration', 'sms', 'reg_stage_submitted_to_dmv', 'en',
 'Great news {customer_name}! Your registration for the {vehicle_year} {vehicle_make} {vehicle_model} has been submitted to the DMV. Track progress: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'tracker_url'], 2),

('registration', 'sms', 'reg_stage_sticker_ready', 'en',
 'Your registration sticker is ready for pickup, {customer_name}! Call us at (832) 400-9760 to schedule pickup for your {vehicle_year} {vehicle_make} {vehicle_model}.',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model'], 5),

('registration', 'sms', 'reg_doc_reminder', 'en',
 'Hi {customer_name}, we still need the following documents to start your registration: {missing_docs}. Upload here: {portal_url}',
 ARRAY['customer_name', 'missing_docs', 'portal_url'], 7),

('registration', 'sms', 'reg_weekly_update', 'en',
 'Hi {customer_name}, your {vehicle_year} {vehicle_make} {vehicle_model} registration update: {stage_label} (Stage {stage_number} of 6). Track anytime: {tracker_url}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'stage_label', 'stage_number', 'tracker_url'], 8)
ON CONFLICT (template_key, language) DO NOTHING;

-- RENTAL TEMPLATES (English)
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('rental', 'sms', 'rental_booking_confirm', 'en',
 'Booking confirmed! {customer_name}, your {vehicle_year} {vehicle_make} {vehicle_model} rental is set for {start_date} to {end_date}. Booking #: {booking_id}. Questions? Call (832) 400-9760',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'start_date', 'end_date', 'booking_id'], 1),

('rental', 'sms', 'rental_return_reminder', 'en',
 'Reminder: Your rental of the {vehicle_year} {vehicle_make} {vehicle_model} is due back tomorrow ({return_date}). Please return to 8774 Almeda Genoa Rd. Booking #: {booking_id}',
 ARRAY['customer_name', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'return_date', 'booking_id'], 2),

('rental', 'sms', 'rental_overdue', 'en',
 '{customer_name}, your rental (Booking #{booking_id}) was due back on {return_date}. Late fees of ${daily_rate}/day are being applied. Please return the vehicle or call (832) 400-9760 immediately.',
 ARRAY['customer_name', 'booking_id', 'return_date', 'daily_rate'], 3),

('rental', 'sms', 'rental_payment_reminder', 'en',
 'Hi {customer_name}, you have an outstanding balance of ${balance} for rental booking #{booking_id}. Please call (832) 400-9760 to arrange payment.',
 ARRAY['customer_name', 'balance', 'booking_id'], 4)
ON CONFLICT (template_key, language) DO NOTHING;

-- VISIT SCHEDULING TEMPLATES
INSERT INTO message_templates (category, channel, template_key, language, body, variables, sort_order) VALUES
('lead_nurture', 'sms', 'visit_confirmation', 'en',
 'See you soon, {customer_name}! Your visit to Triple J Auto Investment is confirmed. Address: 8774 Almeda Genoa Rd, Houston TX 77075. Call if anything changes: (832) 400-9760',
 ARRAY['customer_name'], 10),

('lead_nurture', 'sms', 'visit_reminder_1h', 'en',
 'Reminder: Your visit to Triple J Auto Investment is in about 1 hour! 8774 Almeda Genoa Rd, Houston TX 77075. See you soon, {customer_name}!',
 ARRAY['customer_name'], 11),

('lead_nurture', 'sms', 'visit_followup', 'en',
 'Thanks for visiting Triple J, {customer_name}! Have questions about any vehicle you saw? Text us anytime or call (832) 400-9760.',
 ARRAY['customer_name'], 12)
ON CONFLICT (template_key, language) DO NOTHING;
