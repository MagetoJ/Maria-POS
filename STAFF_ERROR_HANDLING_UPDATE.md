# Staff Management Error Handling Update

## Issue Summary
The staff controller was attempting to use an `email` column in the `staff` table that didn't exist in the database schema, causing all staff management operations to fail with:
```
error: column "email" of relation "staff" does not exist
```

## Root Cause
- The migration file `20251225000000_add_email_to_staff.js` exists but was never successfully applied to the database
- Database migration system had issues with other migrations (20251105000000_fix_inventory_features.js) that left the database in an inconsistent state
- The staff controller unconditionally tried to select/return the `email` column, causing database errors

## Solution Implemented

### 1. **Improved Staff Controller (staffController.ts)**
Updated all staff management functions to handle missing database columns gracefully:

#### `getStaff()`
- First tries to select all columns including email
- If email column doesn't exist, automatically falls back to querying without it
- Provides detailed error messages in development mode

#### `getStaffById()`
- Same fallback logic as `getStaff()`
- Gracefully handles missing email column

#### `createStaff()`
- Only includes email in insert data if provided
- Tries inserting with email first
- Falls back to inserting without email if column doesn't exist
- Added detailed error handling for duplicate key violations
- Provides user-friendly error messages

#### `updateStaff()`
- Properly handles email in returning clause
- Falls back to excluding email from returning if column doesn't exist
- Better error messages for duplicate key violations

#### `deleteStaff()`
- Improved error reporting with development mode details

#### `getWaiters()`
- Consistent error handling implementation

### 2. **Key Improvements**

#### Error Handling Strategy
- **Graceful Degradation**: System continues to work even if email column is missing
- **Dual-Mode Queries**: Each function tries full query first, then falls back if needed
- **Development Mode Support**: Detailed error messages in development, sanitized in production
- **Better Error Messages**: Specific error messages for duplicate keys and other common errors

#### Features
```typescript
// Example: Automatic column existence checking
try {
  // Try with email column
  const staff = await db('staff')
    .select('id', 'email', 'name', ...)
} catch (columnErr: any) {
  // If email column doesn't exist, retry without it
  if (columnErr.message?.includes('email') && columnErr.message?.includes('does not exist')) {
    const staff = await db('staff')
      .select('id', 'name', ...) // email excluded
  }
}
```

## Migration Status

### Current State
- Database migrations have dependency issues that prevent clean rollback
- Tables have circular foreign key constraints
- Knex migration lock may be stuck

### Next Steps to Fully Resolve

#### Option 1: Manual Migration Execution (Recommended)
```bash
# Navigate to server directory
cd server

# Apply pending migrations (including email column)
npm run migrate:dev
```

#### Option 2: Database Reset (if migrations continue to fail)
```bash
# Only if stuck in an unrecoverable state
npm run db:reset:dev
```

#### Option 3: Manual SQL Execution
Run directly against PostgreSQL:
```sql
-- Check if email column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name='staff' AND column_name='email';

-- If it doesn't exist, add it
ALTER TABLE staff ADD COLUMN email TEXT;
CREATE INDEX idx_staff_email ON staff(email);
```

## Testing

### Test Creating Staff Without Email Column
```bash
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "name": "Test User",
    "role": "waiter",
    "password": "SecurePass123"
  }'
```

Expected Result: Staff member created successfully even if email column doesn't exist

### Test Creating Staff With Email (Once Email Column Exists)
```bash
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "name": "Test User 2",
    "role": "waiter",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

## Files Modified
- `/server/src/controllers/staffController.ts` - Enhanced error handling and fallback logic

## Benefits
✅ System remains functional even during schema migration issues
✅ Better error messages for debugging
✅ Graceful degradation when database schema is incomplete
✅ Preparation for eventual email column addition
✅ Improved code maintainability with consistent error handling patterns

## Notes for Future Development
1. Once migrations are successfully applied and email column exists, the fallback logic will automatically detect and use it
2. The dual-query pattern is temporary—once email column is confirmed present, it can be simplified
3. Consider adding database schema version tracking to handle similar issues in the future