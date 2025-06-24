-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    "categoriaPadreId" INTEGER,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE INDEX "Categoria_categoriaPadreId_idx" ON "Categoria"("categoriaPadreId");

-- CreateIndex
CREATE INDEX "Categoria_nombre_idx" ON "Categoria"("nombre");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_categoriaPadreId_fkey" FOREIGN KEY ("categoriaPadreId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
