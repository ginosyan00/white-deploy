# Product Attributes Migration

## Խնդիր
`product_attributes` աղյուսակը չի գոյություն ունի database-ում, ինչը առաջացնում է 500 Internal Server Error:

```
The table `public.product_attributes` does not exist in the current database.
```

## Լուծում

### Տարբերակ 1: Prisma db push (Արագ, Development-ի համար)

1. **Ստեղծեք `.env` ֆայլը root directory-ում** (եթե չունեք):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/whiteshop?schema=public"
   ```

2. **Աշխատեցրեք:**
   ```bash
   cd packages/db
   npm run db:push
   ```

### Տարբերակ 2: Prisma migrate (Production-ի համար)

1. **Ստեղծեք `.env` ֆայլը root directory-ում:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/whiteshop?schema=public"
   ```

2. **Աշխատեցրեք migration-ը:**
   ```bash
   cd packages/db
   npm run db:migrate
   ```

### Տարբերակ 3: SQL Migration (Ուղղակիորեն Database-ում)

Եթե ունեք database connection, կարող եք աշխատեցնել SQL migration-ը ուղղակիորեն:

**Migration file:** `packages/db/prisma/migrations/20251222195036_add_product_attributes/migration.sql`

Այս migration-ը:
- Ստեղծում է `product_attributes` աղյուսակը (եթե չկա)
- Ավելացնում է unique index-ը
- Ավելացնում է foreign key constraints-ները

## Ստուգում

Migration-ից հետո ստուգեք, որ աղյուսակը ստեղծվել է:

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'product_attributes';
```

## Նշում

Migration-ը օգտագործում է `CREATE TABLE IF NOT EXISTS` և `CREATE INDEX IF NOT EXISTS`, այնպես որ այն անվտանգ է աշխատեցնել նույնիսկ եթե աղյուսակը արդեն գոյություն ունի:



