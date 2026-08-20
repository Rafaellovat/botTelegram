/*
  Warnings:

  - You are about to drop the column `firstName` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `languageCode` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `apelido` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Lembrete" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "dataHora" DATETIME,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Lembrete_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "apelido" TEXT NOT NULL,
    "dataNascimento" DATETIME,
    "primeiraVez" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaVez" DATETIME NOT NULL
);
INSERT INTO "new_Usuario" ("id", "primeiraVez", "telegramId", "ultimaVez", "username") SELECT "id", "primeiraVez", "telegramId", "ultimaVez", "username" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_telegramId_key" ON "Usuario"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
