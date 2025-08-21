const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const adminPass = await bcrypt.hash('Admin123!', 10)
    const userPass = await bcrypt.hash('User123!', 10)

    await prisma.festival.upsert({
        where: { id: 1 },
        update: {},
        create: { nom: 'Aurora Fest', description: 'Festival urbain et électro', branding: { theme: 'sobre' } }
    })

    const [rock, electro, hiphop] = await Promise.all([
        prisma.genre.upsert({ where: { nom: 'Rock' }, update: {}, create: { nom: 'Rock' } }),
        prisma.genre.upsert({ where: { nom: 'Electro' }, update: {}, create: { nom: 'Electro' } }),
        prisma.genre.upsert({ where: { nom: 'Hip-Hop' }, update: {}, create: { nom: 'Hip-Hop' } })
    ])

    const [admin, demo] = await Promise.all([
        prisma.utilisateur.upsert({
            where: { email: 'admin@aurora.test' },
            update: {},
            create: { nom: 'Admin', email: 'admin@aurora.test', mot_de_passe_hash: adminPass, role: 'ADMIN', email_verifie: true }
        }),
        prisma.utilisateur.upsert({
            where: { email: 'demo@aurora.test' },
            update: {},
            create: { nom: 'Demo', email: 'demo@aurora.test', mot_de_passe_hash: userPass, role: 'UTILISATEUR', email_verifie: true }
        })
    ])

    const lieu = await prisma.lieu.upsert({
        where: { id: 1 },
        update: {},
        create: {
            nom: 'Parc Lumière',
            ville: 'Rouen',
            pays: 'France',
            latitude: 49.443,
            longitude: 1.099,
            description: 'Grand parc en centre-ville'
        }
    })

    const [sceneA, resto, info] = await Promise.all([
        prisma.pointInteret.create({ data: { nom: 'Scène A', type: 'SCENE', lieu_id: lieu.id, latitude: 49.4432, longitude: 1.0992 } }),
        prisma.pointInteret.create({ data: { nom: 'Restauration', type: 'RESTAURATION', lieu_id: lieu.id, latitude: 49.4434, longitude: 1.0993 } }),
        prisma.pointInteret.create({ data: { nom: 'Point Info', type: 'INFO', lieu_id: lieu.id, latitude: 49.4435, longitude: 1.0995 } })
    ])

    const [art1, art2, art3] = await Promise.all([
        prisma.artiste.upsert({
            where: { nom: 'Nova Echo' },
            update: {},
            create: { nom: 'Nova Echo', style_principal: 'Electro', instagram: '@novaecho' }
        }),
        prisma.artiste.upsert({
            where: { nom: 'Les Rives' },
            update: {},
            create: { nom: 'Les Rives', style_principal: 'Rock', instagram: '@lesrives' }
        }),
        prisma.artiste.upsert({
            where: { nom: 'MC Horizon' },
            update: {},
            create: { nom: 'MC Horizon', style_principal: 'Hip-Hop', instagram: '@mchorizon' }
        })
    ])

    const now = new Date()
    const day1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0)
    const day1End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0)
    const day1Late = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0)
    const day1LateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0)

    const concert1 = await prisma.evenement.create({
        data: {
            titre: 'Nova Echo Live',
            description: 'Set électro ambiance sunset',
            categorie: 'CONCERT',
            date_debut: day1,
            date_fin: day1End,
            statut: 'PUBLIE',
            capacite: 800,
            poi_id: sceneA.id,
            lieu_id: lieu.id,
            artistes: { create: [{ artiste_id: art1.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: electro.id }] }
        }
    })

    const concert2 = await prisma.evenement.create({
        data: {
            titre: 'Rock au Parc',
            description: 'Les Rives en concert',
            categorie: 'CONCERT',
            date_debut: day1Late,
            date_fin: day1LateEnd,
            statut: 'PUBLIE',
            capacite: 1200,
            poi_id: sceneA.id,
            lieu_id: lieu.id,
            artistes: { create: [{ artiste_id: art2.id, role_scene: 'Live' }] },
            genres: { create: [{ genre_id: rock.id }] }
        }
    })

    await prisma.evenement.create({
        data: {
            titre: 'Atelier Beatmaking',
            description: 'Initiation avec MC Horizon',
            categorie: 'ACTIVITE',
            date_debut: new Date(day1.getTime() + 60 * 60 * 1000),
            date_fin: new Date(day1.getTime() + 2 * 60 * 60 * 1000),
            statut: 'PUBLIE',
            capacite: 40,
            poi_id: info.id,
            lieu_id: lieu.id,
            artistes: { create: [{ artiste_id: art3.id, role_scene: 'Animateur' }] },
            genres: { create: [{ genre_id: hiphop.id }] }
        }
    })

    await prisma.favori.create({ data: { utilisateur_id: demo.id, evenement_id: concert1.id } })
    await prisma.favori.create({ data: { utilisateur_id: demo.id, evenement_id: concert2.id } })
}

main()
    .then(async () => {
        await prisma.$disconnect()
        process.exit(0)
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
