-- Product Creation Script
-- Generated automatically from price update report unmatched items
-- Date: "2025-10-25 06:15:55.243508"

-- Note: This script creates products that were unmatched in the price update
-- All products are created with estimated costs (60% of selling price)
-- Products are assigned to appropriate categories based on their category field

BEGIN;


-- BEER products (Category ID: 1)

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Summit Lager', 
    1, 
    300.0, 
    180.0,
    'Summit Lager from Beer category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Summit Lager') 
    AND category_id = 1
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Balozi', 
    1, 
    300.0, 
    180.0,
    'Balozi from Beer category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Balozi') 
    AND category_id = 1
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Tusker Ndimu', 
    1, 
    300.0, 
    180.0,
    'Tusker Ndimu from Beer category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Tusker Ndimu') 
    AND category_id = 1
);

-- CIDERS products (Category ID: 2)

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Kingfisher', 
    2, 
    350.0, 
    210.0,
    'Kingfisher from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Kingfisher') 
    AND category_id = 2
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Manyatta', 
    2, 
    350.0, 
    210.0,
    'Manyatta from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Manyatta') 
    AND category_id = 2
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Desperado', 
    2, 
    350.0, 
    210.0,
    'Desperado from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Desperado') 
    AND category_id = 2
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'K O Cider', 
    2, 
    350.0, 
    210.0,
    'K O Cider from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('K O Cider') 
    AND category_id = 2
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Pineapple Punch', 
    2, 
    300.0, 
    180.0,
    'Pineapple Punch from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Pineapple Punch') 
    AND category_id = 2
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Hunters Dry', 
    2, 
    350.0, 
    210.0,
    'Hunters Dry from Ciders category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Hunters Dry') 
    AND category_id = 2
);

-- CANS products (Category ID: 25)

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Pineapple Punch Can', 
    25, 
    350.0, 
    210.0,
    'Pineapple Punch Can from Cans category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Pineapple Punch Can') 
    AND category_id = 25
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Alvaro Can', 
    25, 
    200.0, 
    120.0,
    'Alvaro Can from Cans category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Alvaro Can') 
    AND category_id = 25
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Snapp Can', 
    25, 
    350.0, 
    210.0,
    'Snapp Can from Cans category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Snapp Can') 
    AND category_id = 25
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Balozi Cans', 
    25, 
    350.0, 
    210.0,
    'Balozi Cans from Cans category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Balozi Cans') 
    AND category_id = 25
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Guarana', 
    25, 
    350.0, 
    210.0,
    'Guarana from Cans category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Guarana') 
    AND category_id = 25
);

-- WHISKEY products (Category ID: 3)

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Singleton 12Yrs', 
    3, 
    6500.0, 
    3900.0,
    'Singleton 12Yrs from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Singleton 12Yrs') 
    AND category_id = 3
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Singleton15Yrs', 
    3, 
    12500.0, 
    7500.0,
    'Singleton15Yrs from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Singleton15Yrs') 
    AND category_id = 3
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Glenlivet 12Yrs', 
    3, 
    9000.0, 
    5400.0,
    'Glenlivet 12Yrs from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Glenlivet 12Yrs') 
    AND category_id = 3
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Glenfiddich 12Yrs', 
    3, 
    12000.0, 
    7200.0,
    'Glenfiddich 12Yrs from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Glenfiddich 12Yrs') 
    AND category_id = 3
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Glenfiddich 15Yrs', 
    3, 
    12000.0, 
    7200.0,
    'Glenfiddich 15Yrs from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Glenfiddich 15Yrs') 
    AND category_id = 3
);

INSERT INTO products (
    name, 
    category_id, 
    price, 
    cost,
    description, 
    is_available, 
    is_active, 
    preparation_time,
    created_at, 
    updated_at
) 
SELECT 
    'Jameson 350Ml', 
    3, 
    2000.0, 
    1200.0,
    'Jameson 350Ml from Whiskey category',
    true, 
    true, 
    5,
    NOW(), 
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE UPPER(name) = UPPER('Jameson 350Ml') 
    AND category_id = 3
);

COMMIT;

-- Verification: Count products by category
SELECT 
    c.name as category_name,
    COUNT(p.id) as product_count,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price,
    AVG(p.price) as avg_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY c.display_order;
