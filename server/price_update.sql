-- Price Update Script
-- Generated from price list text file
-- Updates product prices based on current market rates

BEGIN;

-- Record original prices for reference
CREATE TEMP TABLE original_prices AS 
SELECT id, name, price as old_price 
FROM products 
WHERE name IN ('Tusker Lager','Tusker Malt','Tusker Lite','KB Lager','White Cap','White Cap','Guinness','Pilsner','Black Ice','Heineken','Heineken','Snapp Cider','Tusker Cider','Savanna Dry','Hunters Gold','White Cap','Guinness','Tusker Lager','Tusker Malt','Tusker Lite','Pilsner','Tusker Cider','Heineken','Black Ice','Johnnie Walker Black Label 750ml','Johnnie Walker Black Label 750ml','Johnnie Walker Black Label 750ml','Johnnie Walker Black Label 750ml','Johnnie Walker Red Label 750ml','Johnnie Walker Red Label 750ml','Johnnie Walker Red Label 750ml','Johnnie Walker Black Label 750ml','Johnnie Walker Black Label 750ml','Jameson 750ml','Grants 750ml','Famous Grouse 1L','Bond 7','Jack Daniels 750ml','Jack Daniels 750ml','Jack Daniels 750ml','Gilbeys Gin','Tanqueray London Dry','Camino Real Gold','Jose Cuervo Gold','Viceroy Brandy 750ml','Richot Brandy 750ml','Richot Brandy 750ml','Amarula','Amarula','Baileys Irish Cream','Southern Comfort','Smirnoff Vodka 750ml','Smirnoff Vodka 750ml','Drostdy Hof Red','Drostdy Hof White','Drostdy Hof White','Jose Cuervo Gold','Amarula','Drostdy Hof Red','Drostdy Hof White','Mandazi','Pancakes','Samosas','French Toast','French Toast','Chips','Chips','Chips','Chicken Curry','Chicken Curry','Chicken Curry','Chicken Curry','Chicken Curry','Vegetable Rice','Chicken Soup','Beef Burger','Chicken Burger','Chicken Burger','Chicken Burger','Drostdy Hof White','Famous Grouse 1L','Gilbeys Gin');

-- Update: Tusker Lager (Match type: exact)
-- Price: KES 250 → KES 300.0 (+20.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Lager';

-- Update: Tusker Malt (Match type: exact)
-- Price: KES 280 → KES 300.0 (+7.1%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Malt';

-- Update: Tusker Lite (Match type: exact)
-- Price: KES 250 → KES 300.0 (+20.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Lite';

-- Update: KB Lager (Match type: exact)
-- Price: KES 230 → KES 300.0 (+30.4%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'KB Lager';

-- Update: White Cap (Match type: exact)
-- Price: KES 250 → KES 300.0 (+20.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'White Cap';

-- Update: White Cap (Match type: contains)
-- Price: KES 250 → KES 300.0 (+20.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'White Cap';

-- Update: Guinness (Match type: exact)
-- Price: KES 300 → KES 300.0 (+0.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Guinness';

-- Update: Pilsner (Match type: exact)
-- Price: KES 250 → KES 300.0 (+20.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Pilsner';

-- Update: Black Ice (Match type: exact)
-- Price: KES 280 → KES 300.0 (+7.1%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Black Ice';

-- Update: Heineken (Match type: exact)
-- Price: KES 350 → KES 350.0 (+0.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Heineken';

-- Update: Heineken (Match type: contains)
-- Price: KES 350 → KES 350.0 (+0.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Heineken';

-- Update: Snapp Cider (Match type: contains)
-- Price: KES 300 → KES 300.0 (+0.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Snapp Cider';

-- Update: Tusker Cider (Match type: exact)
-- Price: KES 280 → KES 300.0 (+7.1%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Cider';

-- Update: Savanna Dry (Match type: exact)
-- Price: KES 300 → KES 350.0 (+16.7%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Savanna Dry';

-- Update: Hunters Gold (Match type: exact)
-- Price: KES 320 → KES 350.0 (+9.4%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Hunters Gold';

-- Update: White Cap (Match type: contains)
-- Price: KES 250 → KES 350.0 (+40.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'White Cap';

-- Update: Guinness (Match type: contains)
-- Price: KES 300 → KES 350.0 (+16.7%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Guinness';

-- Update: Tusker Lager (Match type: contains)
-- Price: KES 250 → KES 350.0 (+40.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Lager';

-- Update: Tusker Malt (Match type: contains)
-- Price: KES 280 → KES 350.0 (+25.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Malt';

-- Update: Tusker Lite (Match type: contains)
-- Price: KES 250 → KES 350.0 (+40.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Lite';

-- Update: Pilsner (Match type: contains)
-- Price: KES 250 → KES 350.0 (+40.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Pilsner';

-- Update: Tusker Cider (Match type: contains)
-- Price: KES 280 → KES 350.0 (+25.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Tusker Cider';

-- Update: Heineken (Match type: contains)
-- Price: KES 350 → KES 350.0 (+0.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Heineken';

-- Update: Black Ice (Match type: contains)
-- Price: KES 280 → KES 350.0 (+25.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Black Ice';

-- Update: Johnnie Walker Black Label 750ml (Match type: words)
-- Price: KES 4500 → KES 8000.0 (+77.8%)
UPDATE products 
SET price = 8000.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Johnnie Walker Black Label 750ml (Match type: exact)
-- Price: KES 4500 → KES 5500.0 (+22.2%)
UPDATE products 
SET price = 5500.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Johnnie Walker Black Label 750ml (Match type: words)
-- Price: KES 4500 → KES 6300.0 (+40.0%)
UPDATE products 
SET price = 6300.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Johnnie Walker Black Label 750ml (Match type: words)
-- Price: KES 4500 → KES 2700.0 (-40.0%)
UPDATE products 
SET price = 2700.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Johnnie Walker Red Label 750ml (Match type: exact)
-- Price: KES 3200 → KES 3300.0 (+3.1%)
UPDATE products 
SET price = 3300.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Red Label 750ml';

-- Update: Johnnie Walker Red Label 750ml (Match type: words)
-- Price: KES 3200 → KES 4300.0 (+34.4%)
UPDATE products 
SET price = 4300.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Red Label 750ml';

-- Update: Johnnie Walker Red Label 750ml (Match type: words)
-- Price: KES 3200 → KES 1800.0 (-43.8%)
UPDATE products 
SET price = 1800.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Red Label 750ml';

-- Update: Johnnie Walker Black Label 750ml (Match type: words)
-- Price: KES 4500 → KES 9800.0 (+117.8%)
UPDATE products 
SET price = 9800.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Johnnie Walker Black Label 750ml (Match type: words)
-- Price: KES 4500 → KES 9000.0 (+100.0%)
UPDATE products 
SET price = 9000.0, 
    updated_at = NOW() 
WHERE name = 'Johnnie Walker Black Label 750ml';

-- Update: Jameson 750ml (Match type: exact)
-- Price: KES 4200 → KES 3500.0 (-16.7%)
UPDATE products 
SET price = 3500.0, 
    updated_at = NOW() 
WHERE name = 'Jameson 750ml';

-- Update: Grants 750ml (Match type: exact)
-- Price: KES 2800 → KES 3500.0 (+25.0%)
UPDATE products 
SET price = 3500.0, 
    updated_at = NOW() 
WHERE name = 'Grants 750ml';

-- Update: Famous Grouse 1L (Match type: exact)
-- Price: KES 3500 → KES 4000.0 (+14.3%)
UPDATE products 
SET price = 4000.0, 
    updated_at = NOW() 
WHERE name = 'Famous Grouse 1L';

-- Update: Bond 7 (Match type: contains)
-- Price: KES 2200 → KES 2500.0 (+13.6%)
UPDATE products 
SET price = 2500.0, 
    updated_at = NOW() 
WHERE name = 'Bond 7';

-- Update: Jack Daniels 750ml (Match type: exact)
-- Price: KES 5000 → KES 6000.0 (+20.0%)
UPDATE products 
SET price = 6000.0, 
    updated_at = NOW() 
WHERE name = 'Jack Daniels 750ml';

-- Update: Jack Daniels 750ml (Match type: words)
-- Price: KES 5000 → KES 7000.0 (+40.0%)
UPDATE products 
SET price = 7000.0, 
    updated_at = NOW() 
WHERE name = 'Jack Daniels 750ml';

-- Update: Jack Daniels 750ml (Match type: words)
-- Price: KES 5000 → KES 3000.0 (-40.0%)
UPDATE products 
SET price = 3000.0, 
    updated_at = NOW() 
WHERE name = 'Jack Daniels 750ml';

-- Update: Gilbeys Gin (Match type: words)
-- Price: KES 1800 → KES 2200.0 (+22.2%)
UPDATE products 
SET price = 2200.0, 
    updated_at = NOW() 
WHERE name = 'Gilbeys Gin';

-- Update: Tanqueray London Dry (Match type: contains)
-- Price: KES 4000 → KES 7000.0 (+75.0%)
UPDATE products 
SET price = 7000.0, 
    updated_at = NOW() 
WHERE name = 'Tanqueray London Dry';

-- Update: Camino Real Gold (Match type: contains)
-- Price: KES 3500 → KES 4000.0 (+14.3%)
UPDATE products 
SET price = 4000.0, 
    updated_at = NOW() 
WHERE name = 'Camino Real Gold';

-- Update: Jose Cuervo Gold (Match type: contains)
-- Price: KES 4800 → KES 4000.0 (-16.7%)
UPDATE products 
SET price = 4000.0, 
    updated_at = NOW() 
WHERE name = 'Jose Cuervo Gold';

-- Update: Viceroy Brandy 750ml (Match type: words)
-- Price: KES 2200 → KES 1500.0 (-31.8%)
UPDATE products 
SET price = 1500.0, 
    updated_at = NOW() 
WHERE name = 'Viceroy Brandy 750ml';

-- Update: Richot Brandy 750ml (Match type: words)
-- Price: KES 1800 → KES 2200.0 (+22.2%)
UPDATE products 
SET price = 2200.0, 
    updated_at = NOW() 
WHERE name = 'Richot Brandy 750ml';

-- Update: Richot Brandy 750ml (Match type: words)
-- Price: KES 1800 → KES 1500.0 (-16.7%)
UPDATE products 
SET price = 1500.0, 
    updated_at = NOW() 
WHERE name = 'Richot Brandy 750ml';

-- Update: Amarula (Match type: contains)
-- Price: KES 3800 → KES 3000.0 (-21.1%)
UPDATE products 
SET price = 3000.0, 
    updated_at = NOW() 
WHERE name = 'Amarula';

-- Update: Amarula (Match type: contains)
-- Price: KES 3800 → KES 1800.0 (-52.6%)
UPDATE products 
SET price = 1800.0, 
    updated_at = NOW() 
WHERE name = 'Amarula';

-- Update: Baileys Irish Cream (Match type: words)
-- Price: KES 4500 → KES 4200.0 (-6.7%)
UPDATE products 
SET price = 4200.0, 
    updated_at = NOW() 
WHERE name = 'Baileys Irish Cream';

-- Update: Southern Comfort (Match type: exact)
-- Price: KES 4000 → KES 4000.0 (+0.0%)
UPDATE products 
SET price = 4000.0, 
    updated_at = NOW() 
WHERE name = 'Southern Comfort';

-- Update: Smirnoff Vodka 750ml (Match type: words)
-- Price: KES 2800 → KES 3500.0 (+25.0%)
UPDATE products 
SET price = 3500.0, 
    updated_at = NOW() 
WHERE name = 'Smirnoff Vodka 750ml';

-- Update: Smirnoff Vodka 750ml (Match type: exact)
-- Price: KES 2800 → KES 2200.0 (-21.4%)
UPDATE products 
SET price = 2200.0, 
    updated_at = NOW() 
WHERE name = 'Smirnoff Vodka 750ml';

-- Update: Drostdy Hof Red (Match type: exact)
-- Price: KES 1800 → KES 2000.0 (+11.1%)
UPDATE products 
SET price = 2000.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof Red';

-- Update: Drostdy Hof White (Match type: exact)
-- Price: KES 1800 → KES 2000.0 (+11.1%)
UPDATE products 
SET price = 2000.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof White';

-- Update: Drostdy Hof White (Match type: contains)
-- Price: KES 1800 → KES 2500.0 (+38.9%)
UPDATE products 
SET price = 2500.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof White';

-- Update: Jose Cuervo Gold (Match type: contains)
-- Price: KES 4800 → KES 4500.0 (-6.2%)
UPDATE products 
SET price = 4500.0, 
    updated_at = NOW() 
WHERE name = 'Jose Cuervo Gold';

-- Update: Amarula (Match type: contains)
-- Price: KES 3800 → KES 3500.0 (-7.9%)
UPDATE products 
SET price = 3500.0, 
    updated_at = NOW() 
WHERE name = 'Amarula';

-- Update: Drostdy Hof Red (Match type: contains)
-- Price: KES 1800 → KES 2500.0 (+38.9%)
UPDATE products 
SET price = 2500.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof Red';

-- Update: Drostdy Hof White (Match type: contains)
-- Price: KES 1800 → KES 2500.0 (+38.9%)
UPDATE products 
SET price = 2500.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof White';

-- Update: Mandazi (Match type: contains)
-- Price: KES 30 → KES 20.0 (-33.3%)
UPDATE products 
SET price = 20.0, 
    updated_at = NOW() 
WHERE name = 'Mandazi';

-- Update: Pancakes (Match type: contains)
-- Price: KES 300 → KES 150.0 (-50.0%)
UPDATE products 
SET price = 150.0, 
    updated_at = NOW() 
WHERE name = 'Pancakes';

-- Update: Samosas (Match type: contains)
-- Price: KES 100 → KES 100.0 (+0.0%)
UPDATE products 
SET price = 100.0, 
    updated_at = NOW() 
WHERE name = 'Samosas';

-- Update: French Toast (Match type: contains)
-- Price: KES 250 → KES 100.0 (-60.0%)
UPDATE products 
SET price = 100.0, 
    updated_at = NOW() 
WHERE name = 'French Toast';

-- Update: French Toast (Match type: exact)
-- Price: KES 250 → KES 200.0 (-20.0%)
UPDATE products 
SET price = 200.0, 
    updated_at = NOW() 
WHERE name = 'French Toast';

-- Update: Chips (Match type: exact)
-- Price: KES 200 → KES 300.0 (+50.0%)
UPDATE products 
SET price = 300.0, 
    updated_at = NOW() 
WHERE name = 'Chips';

-- Update: Chips (Match type: contains)
-- Price: KES 200 → KES 350.0 (+75.0%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Chips';

-- Update: Chips (Match type: contains)
-- Price: KES 200 → KES 600.0 (+200.0%)
UPDATE products 
SET price = 600.0, 
    updated_at = NOW() 
WHERE name = 'Chips';

-- Update: Chicken Curry (Match type: exact)
-- Price: KES 650 → KES 650.0 (+0.0%)
UPDATE products 
SET price = 650.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Curry';

-- Update: Chicken Curry (Match type: contains)
-- Price: KES 650 → KES 650.0 (+0.0%)
UPDATE products 
SET price = 650.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Curry';

-- Update: Chicken Curry (Match type: contains)
-- Price: KES 650 → KES 1300.0 (+100.0%)
UPDATE products 
SET price = 1300.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Curry';

-- Update: Chicken Curry (Match type: contains)
-- Price: KES 650 → KES 1950.0 (+200.0%)
UPDATE products 
SET price = 1950.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Curry';

-- Update: Chicken Curry (Match type: contains)
-- Price: KES 650 → KES 2600.0 (+300.0%)
UPDATE products 
SET price = 2600.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Curry';

-- Update: Vegetable Rice (Match type: contains)
-- Price: KES 300 → KES 350.0 (+16.7%)
UPDATE products 
SET price = 350.0, 
    updated_at = NOW() 
WHERE name = 'Vegetable Rice';

-- Update: Chicken Soup (Match type: words)
-- Price: KES 200 → KES 200.0 (+0.0%)
UPDATE products 
SET price = 200.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Soup';

-- Update: Beef Burger (Match type: exact)
-- Price: KES 400 → KES 600.0 (+50.0%)
UPDATE products 
SET price = 600.0, 
    updated_at = NOW() 
WHERE name = 'Beef Burger';

-- Update: Chicken Burger (Match type: exact)
-- Price: KES 350 → KES 600.0 (+71.4%)
UPDATE products 
SET price = 600.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Burger';

-- Update: Chicken Burger (Match type: contains)
-- Price: KES 350 → KES 450.0 (+28.6%)
UPDATE products 
SET price = 450.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Burger';

-- Update: Chicken Burger (Match type: contains)
-- Price: KES 350 → KES 900.0 (+157.1%)
UPDATE products 
SET price = 900.0, 
    updated_at = NOW() 
WHERE name = 'Chicken Burger';

-- Update: Drostdy Hof White (Match type: contains)
-- Price: KES 1800 → KES 2500.0 (+38.9%)
UPDATE products 
SET price = 2500.0, 
    updated_at = NOW() 
WHERE name = 'Drostdy Hof White';

-- Update: Famous Grouse 1L (Match type: words)
-- Price: KES 3500 → KES 3500.0 (+0.0%)
UPDATE products 
SET price = 3500.0, 
    updated_at = NOW() 
WHERE name = 'Famous Grouse 1L';

-- Update: Gilbeys Gin (Match type: contains)
-- Price: KES 1800 → KES 200.0 (-88.9%)
UPDATE products 
SET price = 200.0, 
    updated_at = NOW() 
WHERE name = 'Gilbeys Gin';

-- Show updated prices
SELECT 
    p.id,
    p.name,
    op.old_price,
    p.price as new_price,
    ROUND(((p.price - op.old_price) / op.old_price * 100)::numeric, 1) as price_change_percent
FROM products p
JOIN original_prices op ON p.id = op.id
ORDER BY price_change_percent DESC;

COMMIT;

-- Final verification
SELECT COUNT(*) as updated_products FROM products WHERE updated_at > NOW() - INTERVAL '1 minute';
