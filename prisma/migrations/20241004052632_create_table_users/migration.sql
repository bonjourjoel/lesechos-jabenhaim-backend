/*
  Warnings:

  - You are about to drop the column `passwordHashed2` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHashed` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHashed" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "comment" TEXT,
    "userType" TEXT NOT NULL
);
INSERT INTO "new_User" ("address", "comment", "id", "name", "userType", "username") SELECT "address", "comment", "id", "name", "userType", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
