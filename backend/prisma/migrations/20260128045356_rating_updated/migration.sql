/*
  Warnings:

  - You are about to drop the column `isApproved` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `isModerated` on the `Rating` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "isApproved",
DROP COLUMN "isModerated";
