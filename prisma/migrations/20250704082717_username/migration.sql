/*
  Warnings:

  - You are about to drop the column `email` on the `Usuario` table. All the data in the column will be lost.
  - The `rol` column on the `Usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'operador');

-- DropIndex
DROP INDEX "Usuario_email_key";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "email",
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "rol",
ADD COLUMN     "rol" "RolUsuario" NOT NULL DEFAULT 'admin';

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");
