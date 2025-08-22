/*
  Warnings:

  - The primary key for the `VerificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `VerificationToken` table. All the data in the column will be lost.
  - Added the required column `token` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `VerificationToken_identifier_idx` ON `VerificationToken`;

-- DropIndex
DROP INDEX `VerificationToken_tokenHash_key` ON `VerificationToken`;

-- AlterTable
ALTER TABLE `VerificationToken` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `id`,
    DROP COLUMN `tokenHash`,
    ADD COLUMN `token` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`token`);
