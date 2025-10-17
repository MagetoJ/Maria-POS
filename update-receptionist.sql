-- Update receptionist user with new password hash
-- Password: lokeshen (will be hashed by bcrypt with cost 10)
-- Hash for 'lokeshen': $2b$10$6ZzN8bU8/gw9nQRJ8Y7oLur0x4BQVKR9nYKe0qYLDC5nW5N.UwVYO

UPDATE staff 
SET password = '$2b$10$6ZzN8bU8/gw9nQRJ8Y7oLur0x4BQVKR9nYKe0qYLDC5nW5N.UwVYO', 
    is_active = true
WHERE username = 'receptionist';

-- If receptionist doesn't exist, insert new user
INSERT INTO staff (employee_id, name, role, pin, username, password, is_active, created_at, updated_at)
SELECT 'EMP_REC001', 'Jane Receptionist', 'receptionist', '7777', 'receptionist', '$2b$10$6ZzN8bU8/gw9nQRJ8Y7oLur0x4BQVKR9nYKe0qYLDC5nW5N.UwVYO', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE username = 'receptionist');