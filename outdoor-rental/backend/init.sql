BEGIN;

CREATE TABLE public.users (
    id serial PRIMARY KEY,
    first_name varchar(50) NOT NULL,
    last_name varchar(50) NOT NULL,
    phone varchar(20) NOT NULL,
    email varchar(100),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.equipment_categories (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    description text
);

CREATE TABLE public.equipment_items (
    id serial PRIMARY KEY,
    category_id integer REFERENCES public.equipment_categories(id),
    model_name varchar(150) NOT NULL,
    serial_number varchar(50) UNIQUE,
    size varchar(20),
    status varchar(30) DEFAULT 'доступний',
    hourly_rate numeric(10,2)
);

CREATE TABLE public.rentals (
    id serial PRIMARY KEY,
    user_id integer REFERENCES public.users(id),
    start_time timestamp NOT NULL,
    end_time timestamp,
    total_price numeric(10,2),
    status varchar(30) DEFAULT 'активна'
);

CREATE TABLE public.rental_items (
    id serial PRIMARY KEY,
    rental_id integer REFERENCES public.rentals(id),
    equipment_id integer REFERENCES public.equipment_items(id),
    wear_condition_returned varchar(100)
);

CREATE TABLE public.safety_inspections (
    id serial PRIMARY KEY,
    equipment_id integer REFERENCES public.equipment_items(id),
    inspected_at timestamp DEFAULT CURRENT_TIMESTAMP,
    inspector_name varchar(100),
    is_safe boolean DEFAULT true,
    notes text
);

CREATE VIEW public.active_rentals_view AS
 SELECT u.last_name, u.first_name, ei.model_name, r.start_time
   FROM public.users u, public.rentals r, public.rental_items ri, public.equipment_items ei
  WHERE u.id = r.user_id AND r.id = ri.rental_id AND ri.equipment_id = ei.id AND r.status = 'активна';

INSERT INTO public.equipment_categories (id, name, description) VALUES
(1, 'Скельники', 'Взуття для скелелазіння (різні колодки та розміри)'),
(2, 'Страхувальні системи', 'Нижні альтанки для спортивного лазіння та альпінізму'),
(3, 'Каски', 'Захист голови для скелелазіння та гірських походів'),
(4, 'Килимки', 'Каремати та надувні/самонадувні килимки для сну'),
(5, 'Спальники', 'Спальні мішки (пух та синтетика)'),
(6, 'Пальники', 'Інтегровані системи приготування їжі (Jetboil тощо)');

INSERT INTO public.equipment_items (id, category_id, model_name, serial_number, size, status, hourly_rate) VALUES
(1, 1, 'La Sportiva Tarantula', 'SHO-TAR-001', 'EU 40', 'доступний', 40.00),
(2, 1, 'La Sportiva Tarantula', 'SHO-TAR-002', 'EU 41.5', 'доступний', 40.00),
(3, 1, 'La Sportiva Tarantula', 'SHO-TAR-003', 'EU 42', 'в оренді', 40.00),
(4, 1, 'La Sportiva Tarantula', 'SHO-TAR-004', 'EU 43.5', 'доступний', 40.00),
(5, 1, 'La Sportiva Tarantula', 'SHO-TAR-005', 'EU 44', 'доступний', 40.00),
(6, 1, 'La Sportiva Miura VS', 'SHO-MIU-001', 'EU 40.5', 'доступний', 60.00),
(7, 1, 'La Sportiva Miura VS', 'SHO-MIU-002', 'EU 42', 'в оренді', 60.00),
(8, 1, 'La Sportiva Miura VS', 'SHO-MIU-003', 'EU 43.5', 'доступний', 60.00),
(9, 1, 'La Sportiva Miura VS', 'SHO-MIU-004', 'EU 44', 'доступний', 60.00),
(10, 2, 'Ocún WeBee', 'HAR-OCN-001', 'S', 'доступний', 35.00),
(11, 2, 'Ocún WeBee', 'HAR-OCN-002', 'M', 'доступний', 35.00),
(12, 2, 'Ocún WeBee', 'HAR-OCN-003', 'L', 'в оренді', 35.00),
(13, 2, 'Singing Rock Ray', 'HAR-SNG-001', 'M', 'доступний', 30.00),
(14, 2, 'Singing Rock Ray', 'HAR-SNG-002', 'L', 'доступний', 30.00),
(15, 2, 'Travel Extreme', 'HAR-TEX-001', 'S', 'на ТО', 25.00),
(16, 2, 'Travel Extreme', 'HAR-TEX-002', 'M', 'доступний', 25.00),
(17, 2, 'Travel Extreme', 'HAR-TEX-003', 'L', 'доступний', 25.00),
(18, 3, 'Petzl Boreo White', 'HELM-PTZ-001', 'M/L', 'доступний', 25.00),
(19, 3, 'Petzl Boreo Orange', 'HELM-PTZ-002', 'M/L', 'в оренді', 25.00),
(20, 3, 'Petzl Boreo Blue', 'HELM-PTZ-003', 'S/M', 'доступний', 25.00),
(21, 3, 'Petzl Meteor', 'HELM-PTZ-004', 'M/L', 'доступний', 35.00),
(22, 4, 'Exped Flexmat LW', 'MAT-EXP-001', 'Large', 'доступний', 20.00),
(23, 4, 'Exped Flexmat LW', 'MAT-EXP-002', 'Large', 'в оренді', 20.00),
(24, 4, 'Exped Flexmat LW', 'MAT-EXP-003', 'Large', 'доступний', 20.00),
(25, 4, 'Skif Outdoor Specialist', 'MAT-SKF-001', 'Regular', 'доступний', 15.00),
(26, 4, 'Skif Outdoor Specialist', 'MAT-SKF-002', 'Regular', 'доступний', 15.00),
(27, 4, 'Skif Outdoor Specialist', 'MAT-SKF-003', 'Regular', 'доступний', 15.00),
(28, 5, 'Naturehike Down ULG400', 'SLP-NAT-001', 'L', 'доступний', 50.00),
(29, 5, 'Naturehike Down ULG400', 'SLP-NAT-002', 'L', 'доступний', 50.00),
(30, 5, 'Naturehike Down ULG800', 'SLP-NAT-003', 'M', 'доступний', 70.00),
(31, 5, 'Naturehike Down ULG800', 'SLP-NAT-004', 'L', 'доступний', 70.00),
(32, 6, 'Fire-Maple Star X2', 'STV-FMP-001', '1L', 'доступний', 30.00),
(33, 6, 'Fire-Maple Star X2', 'STV-FMP-002', '1L', 'доступний', 30.00),
(34, 6, 'Fire-Maple Star X2', 'STV-FMP-003', '1L', 'доступний', 30.00);

INSERT INTO public.users (id, first_name, last_name, phone, email, created_at) VALUES
(1, 'Роман', 'Чуб', '+380991112233', 'roman.ch@example.com', '2026-09-22 21:33:25.049703'),
(2, 'В''ячеслав', 'Полежайко', '+380671112233', 'slava.climb@example.com', '2026-09-22 21:33:25.049703'),
(3, 'Владислав', 'Собко', '+380631112233', 'v.sobko@example.com', '2026-09-22 21:33:25.049703'),
(4, 'Владислав', 'Рибалка', '+380501112233', 'v.rybalka@example.com', '2026-09-22 21:33:25.049703'),
(5, 'Ольга', 'Коваленко', '+380971112233', 'olya.k@example.com', '2026-09-22 21:33:25.049703');

INSERT INTO public.rentals (id, user_id, start_time, end_time, total_price, status) VALUES
(1, 1, '2026-09-20 10:00:00', '2026-09-22 18:00:00', 450.00, 'завершена'),
(2, 2, '2026-09-22 14:00:00', NULL, NULL, 'активна'),
(3, 3, '2026-09-18 09:00:00', '2026-09-20 20:00:00', 320.00, 'завершена');

INSERT INTO public.rental_items (id, rental_id, equipment_id, wear_condition_returned) VALUES
(1, 1, 23, 'без пошкоджень'),
(2, 1, 29, 'без пошкоджень'),
(3, 1, 33, 'потребує чистки'),
(4, 2, 7, NULL),
(5, 2, 12, NULL);

INSERT INTO public.safety_inspections (id, equipment_id, inspected_at, inspector_name, is_safe, notes) VALUES
(1, 15, '2026-09-22 21:33:25.049703', 'Головний інструктор', false, 'Потертість на страховочному кільці, потребує списання або детальної перевірки');

SELECT setval('public.equipment_categories_id_seq', (SELECT MAX(id) FROM public.equipment_categories));
SELECT setval('public.equipment_items_id_seq', (SELECT MAX(id) FROM public.equipment_items));
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));
SELECT setval('public.rentals_id_seq', (SELECT MAX(id) FROM public.rentals));
SELECT setval('public.rental_items_id_seq', (SELECT MAX(id) FROM public.rental_items));
SELECT setval('public.safety_inspections_id_seq', (SELECT MAX(id) FROM public.safety_inspections));

COMMIT;
