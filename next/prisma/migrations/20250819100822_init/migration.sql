-- CreateTable
CREATE TABLE `Utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `mot_de_passe_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'UTILISATEUR') NOT NULL DEFAULT 'UTILISATEUR',
    `email_verifie` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    INDEX `Utilisateur_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Festival` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `branding` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Festival_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lieu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `pays` VARCHAR(191) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `description` VARCHAR(191) NULL,

    INDEX `Lieu_ville_idx`(`ville`),
    INDEX `Lieu_pays_idx`(`pays`),
    INDEX `Lieu_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `Lieu_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PointInteret` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `type` ENUM('SCENE', 'STAND', 'INFO', 'TOILETTES', 'RESTAURATION', 'ENTREE', 'AUTRE') NOT NULL,
    `lieu_id` INTEGER NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PointInteret_lieu_id_idx`(`lieu_id`),
    INDEX `PointInteret_type_idx`(`type`),
    INDEX `PointInteret_latitude_longitude_idx`(`latitude`, `longitude`),
    INDEX `PointInteret_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artiste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL,
    `photo_url` VARCHAR(191) NULL,
    `site_web` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `x` VARCHAR(191) NULL,
    `facebook` VARCHAR(191) NULL,
    `style_principal` VARCHAR(191) NULL,
    `genres_secondaires` JSON NULL,

    INDEX `Artiste_nom_idx`(`nom`),
    UNIQUE INDEX `Artiste_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Genre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Genre_nom_key`(`nom`),
    INDEX `Genre_nom_idx`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evenement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `categorie` ENUM('CONCERT', 'CONFERENCE', 'STAND', 'ACTIVITE') NOT NULL,
    `date_debut` DATETIME(3) NOT NULL,
    `date_fin` DATETIME(3) NOT NULL,
    `statut` ENUM('BROUILLON', 'PUBLIE', 'REPORTE', 'ANNULE') NOT NULL DEFAULT 'PUBLIE',
    `capacite` INTEGER NULL,
    `poi_id` INTEGER NULL,
    `lieu_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Evenement_date_debut_idx`(`date_debut`),
    INDEX `Evenement_poi_id_date_debut_date_fin_idx`(`poi_id`, `date_debut`, `date_fin`),
    INDEX `Evenement_categorie_idx`(`categorie`),
    INDEX `Evenement_statut_idx`(`statut`),
    INDEX `Evenement_titre_idx`(`titre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvenementArtiste` (
    `evenement_id` INTEGER NOT NULL,
    `artiste_id` INTEGER NOT NULL,
    `role_scene` VARCHAR(191) NULL,

    INDEX `EvenementArtiste_artiste_id_idx`(`artiste_id`),
    PRIMARY KEY (`evenement_id`, `artiste_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvenementGenre` (
    `evenement_id` INTEGER NOT NULL,
    `genre_id` INTEGER NOT NULL,

    INDEX `EvenementGenre_genre_id_idx`(`genre_id`),
    PRIMARY KEY (`evenement_id`, `genre_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favori` (
    `utilisateur_id` INTEGER NOT NULL,
    `evenement_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favori_evenement_id_idx`(`evenement_id`),
    PRIMARY KEY (`utilisateur_id`, `evenement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rappel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `evenement_id` INTEGER NOT NULL,
    `delai_minutes` INTEGER NOT NULL,
    `date_rappel` DATETIME(3) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Rappel_date_rappel_idx`(`date_rappel`),
    INDEX `Rappel_evenement_id_idx`(`evenement_id`),
    UNIQUE INDEX `Rappel_utilisateur_id_evenement_id_delai_minutes_key`(`utilisateur_id`, `evenement_id`, `delai_minutes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jeton` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `type` ENUM('VERIFICATION_EMAIL', 'REINITIALISATION_MDP', 'ACTUALISATION_JWT') NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expire_a` DATETIME(3) NOT NULL,
    `utilise` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Jeton_token_hash_key`(`token_hash`),
    INDEX `Jeton_type_expire_a_idx`(`type`, `expire_a`),
    INDEX `Jeton_expire_a_idx`(`expire_a`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PointInteret` ADD CONSTRAINT `PointInteret_lieu_id_fkey` FOREIGN KEY (`lieu_id`) REFERENCES `Lieu`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evenement` ADD CONSTRAINT `Evenement_poi_id_fkey` FOREIGN KEY (`poi_id`) REFERENCES `PointInteret`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evenement` ADD CONSTRAINT `Evenement_lieu_id_fkey` FOREIGN KEY (`lieu_id`) REFERENCES `Lieu`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvenementArtiste` ADD CONSTRAINT `EvenementArtiste_evenement_id_fkey` FOREIGN KEY (`evenement_id`) REFERENCES `Evenement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvenementArtiste` ADD CONSTRAINT `EvenementArtiste_artiste_id_fkey` FOREIGN KEY (`artiste_id`) REFERENCES `Artiste`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvenementGenre` ADD CONSTRAINT `EvenementGenre_evenement_id_fkey` FOREIGN KEY (`evenement_id`) REFERENCES `Evenement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvenementGenre` ADD CONSTRAINT `EvenementGenre_genre_id_fkey` FOREIGN KEY (`genre_id`) REFERENCES `Genre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favori` ADD CONSTRAINT `Favori_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favori` ADD CONSTRAINT `Favori_evenement_id_fkey` FOREIGN KEY (`evenement_id`) REFERENCES `Evenement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rappel` ADD CONSTRAINT `Rappel_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rappel` ADD CONSTRAINT `Rappel_evenement_id_fkey` FOREIGN KEY (`evenement_id`) REFERENCES `Evenement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jeton` ADD CONSTRAINT `Jeton_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
