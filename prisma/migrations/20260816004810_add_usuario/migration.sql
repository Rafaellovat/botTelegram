/*
  Warnings:

  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Cliente";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "username" TEXT,
    "languageCode" TEXT,
    "primeiraVez" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaVez" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telegramId_key" ON "Usuario"("telegramId");
