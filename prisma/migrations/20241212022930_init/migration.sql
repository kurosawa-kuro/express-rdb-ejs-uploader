/*
  Warnings:

  - You are about to drop the column `imagePath` on the `Micropost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Micropost" DROP COLUMN "imagePath",
ADD COLUMN     "imageUrl" TEXT;
