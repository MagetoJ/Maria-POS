-- Menu Update Script
-- Generated from products export PDF

-- Clear existing data (be careful in production!)
DELETE FROM products WHERE id > 0;
DELETE FROM categories WHERE id > 0;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert categories
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (1, 'Beer', 'Premium beers and lagers', true, 1, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (2, 'Ciders', 'Refreshing apple ciders', true, 2, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (3, 'Whiskey', 'Fine whiskeys and scotch', true, 3, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (4, 'Gin', 'Premium gins', true, 4, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (5, 'Vodka', 'Premium vodkas', true, 5, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (6, 'Rum', 'Premium rums', true, 6, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (7, 'Brandy', 'Fine brandies', true, 7, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (8, 'Tequila', 'Premium tequilas', true, 8, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (9, 'Wines', 'Fine wines', true, 9, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (10, 'Liqueurs', 'Specialty liqueurs', true, 10, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (11, 'Soft Drinks', 'Non-alcoholic beverages', true, 11, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (12, 'Juices', 'Fresh fruit juices', true, 12, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (13, 'Energy Drinks', 'Energy and sports drinks', true, 13, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (14, 'Main Dishes', 'Hearty meals', true, 14, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (15, 'Grilled Meats', 'Choma specialties', true, 15, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (16, 'Fish', 'Fresh fish preparations', true, 16, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (17, 'Chicken', 'Chicken specialties', true, 17, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (18, 'Pork', 'Pork dishes', true, 18, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (19, 'Vegetarian', 'Vegetable dishes', true, 19, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (20, 'Snacks', 'Light bites and appetizers', true, 20, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (21, 'Breakfast', 'Morning specialties', true, 21, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (22, 'Soups', 'Hot soups', true, 22, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (23, 'Burgers', 'Gourmet burgers', true, 23, NOW(), NOW());
INSERT INTO categories (id, name, description, is_active, display_order, created_at, updated_at) 
VALUES (24, 'Services', 'Additional services', true, 24, NOW(), NOW());

-- Insert products
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (1, 1, 'Tusker Lager', 'Kenya''s premium lager beer', 250, 200, true, true, '/images/products/beer/tusker-lager.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (2, 1, 'Tusker Malt', 'Rich malty beer with full body', 280, 220, true, true, '/images/products/beer/tusker-malt.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (3, 1, 'Tusker Lite', 'Light refreshing beer', 250, 200, true, true, '/images/products/beer/tusker-lite.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (4, 1, 'KB Lager', 'Classic Kenyan lager', 230, 180, true, true, '/images/products/beer/kb-lager.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (5, 1, 'White Cap', 'Smooth premium lager', 250, 200, true, true, '/images/products/beer/white-cap.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (6, 1, 'Guinness', 'World famous stout', 300, 240, true, true, '/images/products/beer/guinness.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (7, 1, 'Pilsner', 'Crisp pilsner beer', 250, 200, true, true, '/images/products/beer/pilsner.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (8, 1, 'Heineken', 'Premium international lager', 350, 280, true, true, '/images/products/beer/heineken.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (9, 1, 'Black Ice', 'Strong premium beer', 280, 220, true, true, '/images/products/beer/black-ice.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (10, 2, 'Tusker Cider', 'Apple cider with local twist', 280, 220, true, true, '/images/products/ciders/tusker-cider.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (11, 2, 'Snapp Cider', 'Crisp apple cider', 300, 240, true, true, '/images/products/ciders/snapp-cider.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (12, 2, 'Hunters Gold', 'Premium golden cider', 320, 250, true, true, '/images/products/ciders/hunters-gold.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (13, 2, 'Savanna Dry', 'Dry apple cider', 300, 240, true, true, '/images/products/ciders/savanna-dry.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (14, 3, 'Johnnie Walker Black Label 750ml', 'Premium Scotch whisky', 4500, 3600, true, true, '/images/products/whiskey/johnnie-walker-black-label-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (15, 3, 'Johnnie Walker Red Label 750ml', 'Classic blended Scotch', 3200, 2500, true, true, '/images/products/whiskey/johnnie-walker-red-label-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (16, 3, 'Jack Daniels 750ml', 'Tennessee whiskey', 5000, 4000, true, true, '/images/products/whiskey/jack-daniels-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (17, 3, 'Jameson 750ml', 'Irish whiskey', 4200, 3400, true, true, '/images/products/whiskey/jameson-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (18, 3, 'Grants 750ml', 'Blended Scotch whisky', 2800, 2200, true, true, '/images/products/whiskey/grants-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (19, 3, 'Famous Grouse 1L', 'Premium blended whisky', 3500, 2800, true, true, '/images/products/whiskey/famous-grouse-1l.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (20, 3, 'Hunters Choice 750ml', 'Local premium whisky', 1800, 1400, true, true, '/images/products/whiskey/hunters-choice-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (21, 3, 'Bond 7', 'Smooth blended whisky', 2200, 1800, true, true, '/images/products/whiskey/bond-7.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (22, 4, 'Tanqueray London Dry', 'Premium London dry gin', 4000, 3200, true, true, '/images/products/gin/tanqueray-london-dry.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (23, 4, 'Bombay Sapphire', 'Premium gin with botanicals', 4500, 3600, true, true, '/images/products/gin/bombay-sapphire.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (24, 4, 'Gilbeys Gin', 'Classic dry gin', 1800, 1400, true, true, '/images/products/gin/gilbeys-gin.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (25, 5, 'Smirnoff Vodka 750ml', 'Premium vodka', 2800, 2200, true, true, '/images/products/vodka/smirnoff-vodka-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (26, 5, 'Absolut Vodka', 'Swedish premium vodka', 4200, 3400, true, true, '/images/products/vodka/absolut-vodka.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (27, 5, 'Chrome Vodka', 'Local premium vodka', 1600, 1300, true, true, '/images/products/vodka/chrome-vodka.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (28, 6, 'Captain Morgan', 'Spiced rum', 3200, 2500, true, true, '/images/products/rum/captain-morgan.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (29, 6, 'Bacardi White', 'White rum', 3500, 2800, true, true, '/images/products/rum/bacardi-white.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (30, 7, 'Viceroy Brandy 750ml', 'Premium brandy', 2200, 1800, true, true, '/images/products/brandy/viceroy-brandy-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (31, 7, 'Richot Brandy 750ml', 'Local brandy', 1800, 1400, true, true, '/images/products/brandy/richot-brandy-750ml.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (32, 8, 'Jose Cuervo Gold', 'Premium gold tequila', 4800, 3800, true, true, '/images/products/tequila/jose-cuervo-gold.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (33, 8, 'Camino Real Gold', 'Mexican gold tequila', 3500, 2800, true, true, '/images/products/tequila/camino-real-gold.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (34, 9, 'Drostdy Hof Red', 'South African red wine', 1800, 1400, true, true, '/images/products/wines/drostdy-hof-red.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (35, 9, 'Drostdy Hof White', 'South African white wine', 1800, 1400, true, true, '/images/products/wines/drostdy-hof-white.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (36, 9, 'Cellar Cask Red', 'Premium red wine', 2200, 1800, true, true, '/images/products/wines/cellar-cask-red.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (37, 9, '4th Street Sweet Red', 'Sweet red wine', 800, 600, true, true, '/images/products/wines/4th-street-sweet-red.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (38, 10, 'Baileys Irish Cream', 'Creamy liqueur', 4500, 3600, true, true, '/images/products/liqueurs/baileys-irish-cream.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (39, 10, 'Amarula', 'African cream liqueur', 3800, 3000, true, true, '/images/products/liqueurs/amarula.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (40, 10, 'Southern Comfort', 'American liqueur', 4000, 3200, true, true, '/images/products/liqueurs/southern-comfort.jpg', 2, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (41, 11, 'Coca Cola 300ml', 'Classic cola', 80, 60, true, true, '/images/products/soft-drinks/coca-cola-300ml.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (42, 11, 'Fanta Orange 300ml', 'Orange soda', 80, 60, true, true, '/images/products/soft-drinks/fanta-orange-300ml.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (43, 11, 'Sprite 300ml', 'Lemon-lime soda', 80, 60, true, true, '/images/products/soft-drinks/sprite-300ml.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (44, 11, 'Pepsi 300ml', 'Cola drink', 80, 60, true, true, '/images/products/soft-drinks/pepsi-300ml.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (45, 11, 'Water 500ml', 'Bottled water', 50, 35, true, true, '/images/products/soft-drinks/water-500ml.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (46, 12, 'Minute Maid Orange', 'Orange juice', 120, 90, true, true, '/images/products/juices/minute-maid-orange.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (47, 12, 'Minute Maid Apple', 'Apple juice', 120, 90, true, true, '/images/products/juices/minute-maid-apple.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (48, 12, 'Del Monte Pineapple', 'Pineapple juice', 150, 120, true, true, '/images/products/juices/del-monte-pineapple.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (49, 12, 'Fresh Passion Juice', 'Freshly squeezed passion fruit juice', 200, 150, true, true, '/images/products/juices/fresh-passion-juice.jpg', 5, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (50, 13, 'Red Bull', 'Energy drink', 250, 200, true, true, '/images/products/energy-drinks/red-bull.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (51, 13, 'Monster Energy', 'Energy drink', 280, 220, true, true, '/images/products/energy-drinks/monster-energy.jpg', 1, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (52, 14, 'Beef Stew & Rice', 'Traditional beef stew served with rice', 600, 400, true, true, '/images/products/main-dishes/beef-stew-and-rice.jpg', 25, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (53, 14, 'Chicken Stew & Ugali', 'Chicken stew with ugali', 650, 450, true, true, '/images/products/main-dishes/chicken-stew-and-ugali.jpg', 30, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (54, 14, 'Pilau Rice', 'Spiced rice with meat', 500, 350, true, true, '/images/products/main-dishes/pilau-rice.jpg', 35, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (55, 14, 'Biryani', 'Aromatic rice with meat and spices', 800, 550, true, true, '/images/products/main-dishes/biryani.jpg', 40, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (56, 14, 'Githeri', 'Mixed beans and maize', 350, 250, true, true, '/images/products/main-dishes/githeri.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (57, 15, 'Nyama Choma - Goat', 'Grilled goat meat', 800, 600, true, true, '/images/products/grilled-meats/nyama-choma---goat.jpg', 45, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (58, 15, 'Nyama Choma - Beef', 'Grilled beef', 700, 500, true, true, '/images/products/grilled-meats/nyama-choma---beef.jpg', 40, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (59, 15, 'Grilled Chicken Quarter', 'Quarter chicken grilled', 450, 300, true, true, '/images/products/grilled-meats/grilled-chicken-quarter.jpg', 25, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (60, 15, 'Grilled Chicken Half', 'Half chicken grilled', 800, 550, true, true, '/images/products/grilled-meats/grilled-chicken-half.jpg', 30, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (61, 15, 'Mutura', 'Traditional blood sausage', 300, 200, true, true, '/images/products/grilled-meats/mutura.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (62, 15, 'Kware', 'Grilled beef tripe', 250, 180, true, true, '/images/products/grilled-meats/kware.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (63, 16, 'Tilapia Fish', 'Fresh tilapia fish', 600, 400, true, true, '/images/products/fish/tilapia-fish.jpg', 25, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (64, 16, 'Fish & Chips', 'Fried fish with chips', 550, 380, true, true, '/images/products/fish/fish-and-chips.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (65, 16, 'Fish Stew', 'Fish in rich tomato stew', 500, 350, true, true, '/images/products/fish/fish-stew.jpg', 30, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (66, 17, 'Fried Chicken', 'Crispy fried chicken', 400, 280, true, true, '/images/products/chicken/fried-chicken.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (67, 17, 'Chicken Curry', 'Chicken in curry sauce', 650, 450, true, true, '/images/products/chicken/chicken-curry.jpg', 35, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (68, 17, 'Chicken Wings', 'Spicy chicken wings', 350, 250, true, true, '/images/products/chicken/chicken-wings.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (69, 18, 'Pork Ribs', 'Barbecued pork ribs', 750, 550, true, true, '/images/products/pork/pork-ribs.jpg', 45, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (70, 18, 'Pork Chops', 'Grilled pork chops', 650, 450, true, true, '/images/products/pork/pork-chops.jpg', 30, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (71, 19, 'Vegetable Rice', 'Rice with mixed vegetables', 300, 200, true, true, '/images/products/vegetarian/vegetable-rice.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (72, 19, 'Spinach & Ugali', 'Spinach served with ugali', 250, 170, true, true, '/images/products/vegetarian/spinach-and-ugali.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (73, 19, 'Cabbage & Ugali', 'Cabbage served with ugali', 200, 140, true, true, '/images/products/vegetarian/cabbage-and-ugali.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (74, 20, 'Samosas', 'Crispy pastries with filling', 100, 70, true, true, '/images/products/snacks/samosas.jpg', 10, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (75, 20, 'Chapati', 'Soft flatbread', 50, 35, true, true, '/images/products/snacks/chapati.jpg', 8, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (76, 20, 'Mandazi', 'Sweet fried dough', 30, 20, true, true, '/images/products/snacks/mandazi.jpg', 5, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (77, 20, 'Chips', 'French fries', 200, 140, true, true, '/images/products/snacks/chips.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (78, 20, 'Smokies', 'Smoked sausages', 150, 100, true, true, '/images/products/snacks/smokies.jpg', 10, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (79, 21, 'English Breakfast', 'Full English breakfast', 450, 300, true, true, '/images/products/breakfast/english-breakfast.jpg', 20, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (80, 21, 'Pancakes', 'Fluffy pancakes', 300, 200, true, true, '/images/products/breakfast/pancakes.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (81, 21, 'French Toast', 'Golden french toast', 250, 170, true, true, '/images/products/breakfast/french-toast.jpg', 12, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (82, 22, 'Chicken Soup', 'Hot chicken soup', 200, 140, true, true, '/images/products/soups/chicken-soup.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (83, 22, 'Vegetable Soup', 'Mixed vegetable soup', 150, 100, true, true, '/images/products/soups/vegetable-soup.jpg', 12, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (84, 23, 'Beef Burger', 'Juicy beef burger', 400, 280, true, true, '/images/products/burgers/beef-burger.jpg', 15, NOW(), NOW());
INSERT INTO products (id, category_id, name, description, price, cost, is_available, is_active, image_url, preparation_time, created_at, updated_at) 
VALUES (85, 23, 'Chicken Burger', 'Grilled chicken burger', 350, 250, true, true, '/images/products/burgers/chicken-burger.jpg', 15, NOW(), NOW());

-- Update sequences to correct values
ALTER SEQUENCE categories_id_seq RESTART WITH 25;
ALTER SEQUENCE products_id_seq RESTART WITH 86;

-- Verify counts
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM products;
