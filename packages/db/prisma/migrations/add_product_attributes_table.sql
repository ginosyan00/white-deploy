-- Add product_attributes table if it doesn't exist
-- This migration adds the missing product_attributes junction table

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_attributes_productId_attributeId_key" ON "product_attributes"("productId", "attributeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_attributes_productId_idx" ON "product_attributes"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_attributes_attributeId_idx" ON "product_attributes"("attributeId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_attributes_productId_fkey'
    ) THEN
        ALTER TABLE "product_attributes" 
        ADD CONSTRAINT "product_attributes_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES "products"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_attributes_attributeId_fkey'
    ) THEN
        ALTER TABLE "product_attributes" 
        ADD CONSTRAINT "product_attributes_attributeId_fkey" 
        FOREIGN KEY ("attributeId") 
        REFERENCES "attributes"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;



