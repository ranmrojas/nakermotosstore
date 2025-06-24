-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Categoria_activa_idx" ON "Categoria"("activa");
