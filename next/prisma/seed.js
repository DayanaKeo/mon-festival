/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// helpers date
function addHours(date, h) {
    const d = new Date(date);
    d.setHours(d.getHours() + h);
    return d;
}
function addDays(date, d) {
    const x = new Date(date);
    x.setDate(x.getDate() + d);
    return x;
}

// valeurs utilitaires
const now = new Date();
const today18 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

async function clearAll() {
    // ordre = enfants -> parents (FK Cascade déjà en place, mais on sécurise)
    await prisma.jeton.deleteMany();
    await prisma.rappel.deleteMany();
    await prisma.favori.deleteMany();
    await prisma.evenementGenre.deleteMany();
    await prisma.evenementArtiste.deleteMany();
    await prisma.evenement.deleteMany();

    await prisma.artiste.deleteMany();
    await prisma.genre.deleteMany();

    await prisma.pointInteret.deleteMany();
    await prisma.lieu.deleteMany();

    await prisma.passwordResetToken.deleteMany();
    await prisma.verificationToken.deleteMany();

    await prisma.festival.deleteMany();
    await prisma.utilisateur.deleteMany();
}

async function main() {
    console.log('⛏  Reset des données…');
    await clearAll();

    console.log('🔐 Hash mots de passe…');
    const passAdmin = await bcrypt.hash('Admin123!', 10);
    const passAlice = await bcrypt.hash('Alice123!', 10);
    const passBob   = await bcrypt.hash('Bob123!', 10);
    const passDemo  = await bcrypt.hash('User123!', 10);

    console.log('👤 Utilisateurs…');
    const [admin, alice, bob, demo] = await Promise.all([
        prisma.utilisateur.create({
            data: {
                nom: 'Admin', prenom: 'Root',
                email: 'admin@aurora.test',
                mot_de_passe_hash: passAdmin,
                role: 'ADMIN',
                email_verifie: true
            }
        }),
        prisma.utilisateur.create({
            data: {
                nom: 'Alice', prenom: 'Durand',
                email: 'alice@aurora.test',
                mot_de_passe_hash: passAlice,
                role: 'UTILISATEUR',
                email_verifie: true
            }
        }),
        prisma.utilisateur.create({
            data: {
                nom: 'Bob', prenom: 'Martin',
                email: 'bob@aurora.test',
                mot_de_passe_hash: passBob,
                role: 'UTILISATEUR',
                email_verifie: false
            }
        }),
        prisma.utilisateur.create({
            data: {
                nom: 'Demo', prenom: 'User',
                email: 'demo@aurora.test',
                mot_de_passe_hash: passDemo,
                role: 'UTILISATEUR',
                email_verifie: true
            }
        }),
    ]);

    console.log('🎪 Festival…');
    const festival = await prisma.festival.create({
        data: {
            nom: 'Aurora Fest',
            description: 'Festival urbain, électro et découvertes live',
            branding: { theme: 'aurora-dark', accent: '#7c3aed' }
        }
    });

    console.log('🎚  Genres…');
    const genres = await prisma.$transaction([
        prisma.genre.create({ data: { nom: 'Electro' } }),
        prisma.genre.create({ data: { nom: 'Rock' } }),
        prisma.genre.create({ data: { nom: 'Hip-Hop' } }),
        prisma.genre.create({ data: { nom: 'Techno' } }),
        prisma.genre.create({ data: { nom: 'Pop' } }),
        prisma.genre.create({ data: { nom: 'Jazz' } }),
    ]);
    const [electro, rock, hiphop, techno, pop, jazz] = genres;

    console.log('📍 Lieux…');
    const [parcLumiere, halleNordik, quaiDesArts] = await Promise.all([
        prisma.lieu.create({
            data: {
                nom: 'Parc Lumière',
                adresse: '12 Rue des Sycomores',
                ville: 'Rouen',
                pays: 'France',
                latitude: '49.443000',
                longitude: '1.099000',
                description: 'Grand parc en centre-ville',
            }
        }),
        prisma.lieu.create({
            data: {
                nom: 'Halle Nordik',
                adresse: 'Quai Industriel 5',
                ville: 'Rouen',
                pays: 'France',
                latitude: '49.450500',
                longitude: '1.070800',
                description: 'Ancien entrepôt réhabilité en salle de concert'
            }
        }),
        prisma.lieu.create({
            data: {
                nom: 'Quai des Arts',
                adresse: 'Promenade des Docks',
                ville: 'Rouen',
                pays: 'France',
                latitude: '49.445900',
                longitude: '1.083000',
                description: 'Promenade au bord de Seine, installations éphémères'
            }
        })
    ]);

    console.log('🧭 Points d’intérêt…');
    const pois = await Promise.all([
        prisma.pointInteret.create({ data: { nom: 'Scène A', type: 'SCENE', lieu_id: parcLumiere.id, latitude: '49.443200', longitude: '1.099200' } }),
        prisma.pointInteret.create({ data: { nom: 'Scène B', type: 'SCENE', lieu_id: parcLumiere.id, latitude: '49.443500', longitude: '1.098800' } }),
        prisma.pointInteret.create({ data: { nom: 'Food Court', type: 'RESTAURATION', lieu_id: parcLumiere.id, latitude: '49.443400', longitude: '1.099300' } }),
        prisma.pointInteret.create({ data: { nom: 'Point Info', type: 'INFO', lieu_id: parcLumiere.id, latitude: '49.443500', longitude: '1.099500' } }),
        prisma.pointInteret.create({ data: { nom: 'Toilettes Nord', type: 'TOILETTES', lieu_id: parcLumiere.id, latitude: '49.443650', longitude: '1.099650' } }),
        prisma.pointInteret.create({ data: { nom: 'Entrée Principale', type: 'ENTREE', lieu_id: parcLumiere.id, latitude: '49.442900', longitude: '1.099100' } }),

        prisma.pointInteret.create({ data: { nom: 'Stand Merch', type: 'STAND', lieu_id: halleNordik.id, latitude: '49.450700', longitude: '1.070900' } }),
        prisma.pointInteret.create({ data: { nom: 'Scène Warehouse', type: 'SCENE', lieu_id: halleNordik.id, latitude: '49.450800', longitude: '1.071000' } }),

        prisma.pointInteret.create({ data: { nom: 'Scène Riverside', type: 'SCENE', lieu_id: quaiDesArts.id, latitude: '49.446100', longitude: '1.082800' } }),
    ]);

    // accès rapide par nom
    const poiByName = Object.fromEntries(pois.map(p => [p.nom, p]));

    console.log('🎤 Artistes…');
    const artists = await prisma.$transaction([
        prisma.artiste.create({ data: { nom: 'Nova Echo', style_principal: 'Electro', instagram: '@novaecho' } }),
        prisma.artiste.create({ data: { nom: 'Les Rives', style_principal: 'Rock', instagram: '@lesrives' } }),
        prisma.artiste.create({ data: { nom: 'MC Horizon', style_principal: 'Hip-Hop', instagram: '@mchorizon' } }),
        prisma.artiste.create({ data: { nom: 'Polar Lights', style_principal: 'Techno', instagram: '@polarlights' } }),
        prisma.artiste.create({ data: { nom: 'Kya', style_principal: 'Pop', instagram: '@kya.music' } }),
        prisma.artiste.create({ data: { nom: 'Blue Note Trio', style_principal: 'Jazz', instagram: '@bluenotetrio' } }),
        prisma.artiste.create({ data: { nom: 'Subwave', style_principal: 'Electro', instagram: '@subwave' } }),
        prisma.artiste.create({ data: { nom: 'Rude Stone', style_principal: 'Rock', instagram: '@rudestone' } }),
    ]);
    const [novaEcho, lesRives, mcHorizon, polarLights, kya, blueNoteTrio, subwave, rudeStone] = artists;

    console.log('📅 Événements…');
    // Quelques dates autour d’aujourd’hui pour une démo réaliste
    const day1 = today18;                 // aujourd'hui 18h
    const day1End = addHours(day1, 2);    // 20h
    const day1Late = addHours(day1, 4);   // 22h
    const day1LateEnd = addHours(day1, 5.5); // 23h30
    const day2 = addDays(day1, 1);
    const day2End = addHours(day2, 2);
    const day3 = addDays(day1, 2);
    const day3End = addHours(day3, 2);

    const events = [];

    // CONCERTS publiés
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Nova Echo Live',
            description: 'Set électro ambiance sunset',
            categorie: 'CONCERT',
            date_debut: day1,
            date_fin: day1End,
            statut: 'PUBLIE',
            capacite: 900,
            poi_id: poiByName['Scène A'].id,
            lieu_id: parcLumiere.id,
            artistes: { create: [{ artiste_id: novaEcho.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: electro.id }] }
        }
    }));

    events.push(await prisma.evenement.create({
        data: {
            titre: 'Rock au Parc',
            description: 'Les Rives en concert',
            categorie: 'CONCERT',
            date_debut: day1Late,
            date_fin: day1LateEnd,
            statut: 'PUBLIE',
            capacite: 1200,
            poi_id: poiByName['Scène A'].id,
            lieu_id: parcLumiere.id,
            artistes: { create: [{ artiste_id: lesRives.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: rock.id }] }
        }
    }));

    // ACTIVITÉ publiée
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Atelier Beatmaking',
            description: 'Initiation avec MC Horizon',
            categorie: 'ACTIVITE',
            date_debut: addHours(day1, 1),
            date_fin: addHours(day1, 2),
            statut: 'PUBLIE',
            capacite: 40,
            poi_id: poiByName['Point Info'].id,
            lieu_id: parcLumiere.id,
            artistes: { create: [{ artiste_id: mcHorizon.id, role_scene: 'Animateur' }] },
            genres: { create: [{ genre_id: hiphop.id }] }
        }
    }));

    // CONCERT publié (Warehouse)
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Polar Lights — Warehouse Set',
            description: 'Techno warehouse à la Halle Nordik',
            categorie: 'CONCERT',
            date_debut: day2,
            date_fin: day2End,
            statut: 'PUBLIE',
            capacite: 1500,
            poi_id: poiByName['Scène Warehouse'].id,
            lieu_id: halleNordik.id,
            artistes: { create: [{ artiste_id: polarLights.id, role_scene: 'DJ Set' }] },
            genres: { create: [{ genre_id: techno.id }, { genre_id: electro.id }] }
        }
    }));

    // CONFERENCE publiée
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Conférence : Musiques Urbaines & Scène Locale',
            description: 'Regards croisés entre artistes et programmateurs',
            categorie: 'CONFERENCE',
            date_debut: addHours(day2, 3),
            date_fin: addHours(day2, 5),
            statut: 'PUBLIE',
            capacite: 200,
            poi_id: poiByName['Scène Riverside'].id,
            lieu_id: quaiDesArts.id,
            artistes: { create: [{ artiste_id: mcHorizon.id, role_scene: 'Panel' }, { artiste_id: lesRives.id, role_scene: 'Panel' }] },
            genres: { create: [{ genre_id: hiphop.id }, { genre_id: rock.id }] }
        }
    }));

    // STAND publié
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Atelier Sérigraphie + Merch',
            description: 'Custom de t-shirts en direct',
            categorie: 'STAND',
            date_debut: day2,
            date_fin: addHours(day2, 6),
            statut: 'PUBLIE',
            capacite: 100,
            poi_id: poiByName['Stand Merch'].id,
            lieu_id: halleNordik.id,
            artistes: { create: [] },
            genres: { create: [{ genre_id: pop.id }] }
        }
    }));

    // BROUILLON (pas encore publié)
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Subwave Secret Set',
            description: 'Annonce surprise en préparation',
            categorie: 'CONCERT',
            date_debut: addDays(day3, 1),
            date_fin: addHours(addDays(day3, 1), 2),
            statut: 'BROUILLON',
            capacite: 700,
            poi_id: poiByName['Scène B'].id,
            lieu_id: parcLumiere.id,
            artistes: { create: [{ artiste_id: subwave.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: electro.id }] }
        }
    }));

    // REPORTÉ
    events.push(await prisma.evenement.create({
        data: {
            titre: 'Blue Note Trio — Jazz Riverside',
            description: 'Concert acoustique au bord de l’eau',
            categorie: 'CONCERT',
            date_debut: day3,
            date_fin: day3End,
            statut: 'REPORTE',
            capacite: 300,
            poi_id: poiByName['Scène Riverside'].id,
            lieu_id: quaiDesArts.id,
            artistes: { create: [{ artiste_id: blueNoteTrio.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: jazz.id }] }
        }
    }));

    console.log('⭐ Favoris…');
    await prisma.favori.createMany({
        data: [
            { utilisateur_id: demo.id,  evenement_id: events[0].id }, // demo → Nova Echo
            { utilisateur_id: alice.id, evenement_id: events[1].id }, // alice → Les Rives
            { utilisateur_id: bob.id,   evenement_id: events[3].id }, // bob → Polar Lights
        ],
        skipDuplicates: true
    });

    console.log('⏰ Rappels…');
    await prisma.rappel.createMany({
        data: [
            { utilisateur_id: demo.id,  evenement_id: events[0].id, delai_minutes: 30, actif: true },
            { utilisateur_id: alice.id, evenement_id: events[1].id, delai_minutes: 15, actif: true },
            { utilisateur_id: bob.id,   evenement_id: events[3].id, delai_minutes: 60, actif: false },
        ],
        skipDuplicates: true
    });

    console.log('🔑 Jetons (exemples)…');
    await prisma.jeton.createMany({
        data: [
            {
                utilisateur_id: bob.id,
                type: 'VERIFICATION_EMAIL',
                token_hash: 'verif_' + Math.random().toString(36).slice(2),
                expire_a: addDays(now, 2),
                utilise: false
            },
            {
                utilisateur_id: alice.id,
                type: 'REINITIALISATION_MDP',
                token_hash: 'reset_' + Math.random().toString(36).slice(2),
                expire_a: addHours(now, 6),
                utilise: false
            },
            {
                utilisateur_id: demo.id,
                type: 'ACTUALISATION_JWT',
                token_hash: 'refresh_' + Math.random().toString(36).slice(2),
                expire_a: addDays(now, 7),
                utilise: false
            },
        ]
    });

    console.log('📧 Tokens NextAuth (exemples)…');
    await prisma.verificationToken.create({
        data: {
            identifier: 'bob@aurora.test',
            token: 'verifytoken_' + Math.random().toString(36).slice(2),
            expires: addHours(now, 24),
        }
    });
    await prisma.passwordResetToken.create({
        data: {
            identifier: 'alice@aurora.test',
            token: 'resettoken_' + Math.random().toString(36).slice(2),
            expires: addHours(now, 2),
        }
    });

    console.log('✅ Seed OK.');
}

main()
    .then(async () => { await prisma.$disconnect(); process.exit(0); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
