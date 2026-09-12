// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed pour Agro Véto Services...')

  // 1. Création de l'administrateur par défaut
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agrovetoservices.cg'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Avs2026!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Direction AVS Congo',
      phone: '+242 06 967 75 67',
      role: 'ADMIN',
    },
  })
  console.log(`✅ Administrateur créé : ${admin.email}`)

  // 2. Création des catégories
  const categoriesData = [
    {
      name: "Poussins & Volailles",
      slug: "poussins-volailles",
      description: "Souches vigoureuses à haut rendement chair et ponte (Cobb 500, Lohmann Brown).",
      icon: "Target",
    },
    {
      name: "Provenderie & Nutrition Animale",
      slug: "provenderie-nutrition",
      description: "Aliments complets formulés localement et contrôlés au laboratoire bromatologique.",
      icon: "Package",
    },
    {
      name: "Santé Animale & Vétérinaire",
      slug: "sante-veterinaire",
      description: "Vaccins, antibiotiques, vermifuges, vitamines et matériel de soin pour cheptel.",
      icon: "Award",
    },
    {
      name: "Hygiène & Biosécurité",
      slug: "hygiene-biosecurite",
      description: "Désinfectants virucides pour bâtiments d'élevage, détergents pro et savons noirs.",
      icon: "Sparkles",
    },
    {
      name: "Matériel & Équipements d'Élevage",
      slug: "materiel-elevage",
      description: "Mangeoires, abreuvoirs automatiques, radiants, miroufs et balances de pesée.",
      icon: "ShieldCheck",
    },
  ]

  const categories = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    categories[cat.slug] = created
    console.log(`✅ Catégorie créée : ${created.name}`)
  }

  // 3. Catalogue des produits AVS réels
  const productsData = [
    {
      title: "Poussins Cobb 500 (Chair)",
      slug: "poussins-cobb-500",
      description: "Poussins d'un jour chair à croissance ultra-rapide. Vaccinés dès l'écloserie contre Marek et Newcastle. Viabilité garantie > 98%. Suivi technique offert.",
      price: 650,
      stock: 5000,
      inStock: true,
      unit: "unité (carton de 100)",
      image: "/images/products/poussins-cobb500.jpg",
      badge: "Arrivage Hebdo",
      rating: 4.9,
      features: ["Croissance rapide (2kg en 38 jours)", "Faible indice de consommation", "Vaccinés Marek + Newcastle", "Assistance technique offerte"],
      categoryId: categories["poussins-volailles"].id,
    },
    {
      title: "Poussins Lohmann Brown (Pondeuses)",
      slug: "poussins-lohmann-brown",
      description: "Poussins femelles sexées à 99%, excellente persistance de ponte avec coquille brune solide. Potentiel jusqu'à 320 œufs par an en climat tropical.",
      price: 1100,
      stock: 3000,
      inStock: true,
      unit: "unité (carton de 100)",
      image: "/images/products/pondeuses-lohmann.jpg",
      badge: "Haute Ponte",
      rating: 4.8,
      features: ["Sexées à 99% femelles", "310 à 320 œufs par poule/an", "Forte résistance aux maladies", "Démarrage facile"],
      categoryId: categories["poussins-volailles"].id,
    },
    {
      title: "Aliment Démarrage Poulet de Chair (21% Protéines)",
      slug: "aliment-demarrage-chair-21",
      description: "Formule bromatologique haute énergie avec 21% de protéines brutes, acides aminés digestibles et anticoccidien. Indispensable pour J1 à J14.",
      price: 19800,
      stock: 450,
      inStock: true,
      unit: "sac de 50 kg",
      image: "/images/products/aliment-demarrage.jpg",
      badge: "Top Vente",
      rating: 5.0,
      features: ["21% protéines certifiées", "Enrichi en vitamines A, D3, E", "Excellente digestibilité", "Contrôlé en laboratoire"],
      categoryId: categories["provenderie-nutrition"].id,
    },
    {
      title: "Aliment Finition Poulet de Chair",
      slug: "aliment-finition-chair",
      description: "Aliment complet favorisant un gain moyen quotidien maximal et une viande ferme et goûteuse. Adapté pour J29 à l'abattage.",
      price: 18500,
      stock: 600,
      inStock: true,
      unit: "sac de 50 kg",
      image: "/images/products/aliment-finition.jpg",
      badge: "Croissance",
      rating: 4.9,
      features: ["Gain de poids accéléré", "Chair ferme sans excès de gras", "Minéraux équilibrés", "Formulation locale testée"],
      categoryId: categories["provenderie-nutrition"].id,
    },
    {
      title: "Désinfectant Virucide d'Élevage VetoCide",
      slug: "desinfectant-virucide-vetocide",
      description: "Puissant désinfectant à large spectre homologué pour le vide sanitaire des poulaillers, la désinfection des sols, mangeoires et pédiluves. Élimine virus, bactéries et champignons.",
      price: 12500,
      stock: 120,
      inStock: true,
      unit: "bidon de 5L",
      image: "/images/products/desinfectant-5l.jpg",
      badge: "Biosécurité",
      rating: 4.9,
      features: ["Actif en présence de matières organiques", "Virucide, bactéricide, fongicide", "Biodégradable", "Concentré 1% à diluer"],
      categoryId: categories["hygiene-biosecurite"].id,
    },
    {
      title: "Savon Noir Liquide d'Atelier & Élevage",
      slug: "savon-noir-liquide-elevage",
      description: "Savon noir 100% végétal saponifié à froid à Pointe-Noire à base d'huiles locales. Nettoyage écologique en profondeur des surfaces, matériel et abattoirs.",
      price: 4500,
      stock: 250,
      inStock: true,
      unit: "flacon de 1L",
      image: "/images/savon-artisanal.jpg",
      badge: "Production Locale",
      rating: 4.8,
      features: ["100% naturel saponifié à froid", "Dégraissant surpuissant", "Sans produits chimiques toxiques", "Fabriqué au Congo"],
      categoryId: categories["hygiene-biosecurite"].id,
    },
    {
      title: "Abreuvoir Automatique Cloche 12L",
      slug: "abreuvoir-automatique-cloche-12l",
      description: "Abreuvoir automatique suspendu anti-renversement pour 80 à 100 poulets. Réduit le gaspillage d'eau et maintient la litière parfaitement sèche.",
      price: 8500,
      stock: 80,
      inStock: true,
      unit: "unité",
      image: "/images/products/mangeoire-poules.jpg",
      badge: "Matériel Pro",
      rating: 4.7,
      features: ["Robuste en plastique haute densité", "Clapet de régulation précis", "Facile à nettoyer", "Suspendu réglable en hauteur"],
      categoryId: categories["materiel-elevage"].id,
    },
  ]

  for (const prod of productsData) {
    const created = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: prod,
      create: prod,
    })
    console.log(`✅ Produit créé : ${created.title} (${created.price} FCFA)`)
  }

  // 4. Formations de la Ferme-École AVS
  const formationsData = [
    {
      title: "Santé Animale & Prophylaxie Vétérinaire en Élevage",
      slug: "sante-animale-prophylaxie-veterinaire",
      category: "Santé Animale",
      duration: "4 Jours (24h) - Clinique & Terrain",
      price: "70 000 FCFA",
      priceAmount: 70000,
      target: "Éleveurs, techniciens vétérinaires, régisseurs de cheptels",
      nextSession: "Sessions bimensuelles",
      modulesCovered: [
        "Reconnaissance des pathologies courantes (virales, bactériennes, parasitaires)",
        "Protocoles vaccinaux et calendrier de prophylaxie rigoureux",
        "Administration des soins et gestion de la pharmacie vétérinaire d'élevage",
        "Mesures de biosécurité, désinfection et vide sanitaire",
        "Autopsie aviaire de base et prélèvements diagnostiques",
      ],
      description: "Formation pratique et terrain pour maîtriser les soins vétérinaires d'urgence, la prévention des épidémies et la conduite sanitaire des cheptels.",
      image: "/images/products/kit-prophylaxie.jpg",
      order: 1,
      featured: true,
      isActive: true,
    },
    {
      title: "Conduite d'Élevage Moderne & Rentabilité (Aviculture & Porciculture)",
      slug: "conduite-elevage-moderne-rentabilite",
      category: "Conduite d'Élevage",
      duration: "5 Jours (30h) - Immersion Ferme-École",
      price: "75 000 FCFA",
      priceAmount: 75000,
      target: "Porteurs de projets agropastoraux, éleveurs de chair et ponte",
      nextSession: "Prochaine session hebdomadaire",
      modulesCovered: [
        "Bâtiments d'élevage tropicaux : ventilation, litière et densité",
        "Démarrage réussi des poussins d'un jour (Cobb 500 & Lohmann)",
        "Techniques d'alimentation, abreuvement et ratio coût/croissance",
        "Conduite de l'élevage porcin : reproduction, engraissement, hygiène",
        "Gestion économique, suivi des bandes et calcul des marges brutes",
      ],
      description: "Immersion complète en ferme-école pour rentabiliser vos bandes de volailles et votre cheptel porcin avec un taux de survie maximal.",
      image: "/images/products/poussins-cobb500.jpg",
      order: 2,
      featured: true,
      isActive: true,
    },
    {
      title: "Hygiène Alimentaire & Bonnes Pratiques Sanitaires (BPH / BPF)",
      slug: "hygiene-alimentaire-bonnes-pratiques-bph-bpf",
      category: "Hygiène Alimentaire",
      duration: "3 Jours (18h) - Certifiant",
      price: "90 000 FCFA",
      priceAmount: 90000,
      target: "Professionnels des métiers de bouche, cantines, traiteurs, transformateurs",
      nextSession: "Sessions bimensuelles",
      modulesCovered: [
        "Microbiologie alimentaire et maîtrise des contaminations croisées",
        "La marche en avant et l'organisation rationnelle des espaces de préparation",
        "Plans de nettoyage, désinfection et lutte contre les nuisibles (3D)",
        "Respect de la chaîne du froid et gestion des températures réglementaires",
        "Contrôle à réception des denrées et traçabilité interne",
      ],
      description: "Normes d'hygiène et méthodes de contrôle indispensables pour se conformer aux exigences sanitaires et protéger les consommateurs.",
      image: "/images/qhse-laboratoire.jpg",
      order: 3,
      featured: false,
      isActive: true,
    },
    {
      title: "Méthode HACCP & Sécurité Sanitaire des Aliments (Norme ISO 22000)",
      slug: "methode-haccp-securite-sanitaire-iso22000",
      category: "HACCP & Qualité",
      duration: "4 Jours (24h) - Certifiant",
      price: "120 000 FCFA",
      priceAmount: 120000,
      target: "Responsables qualité, chefs de production agroalimentaire, auditeurs",
      nextSession: "Sessions mensuelles",
      modulesCovered: [
        "Les 7 principes et 12 étapes d'application de la démarche HACCP",
        "Analyse des dangers (biologiques, chimiques, physiques, allergènes)",
        "Détermination des Points Critiques de Contrôle (CCP) et seuils critiques",
        "Procédures de surveillance continue et actions correctives immédiates",
        "Constitution du Plan de Maîtrise Sanitaire (PMS) et préparation aux audits",
      ],
      description: "Apprenez à concevoir, déployer et auditer un Plan de Maîtrise Sanitaire conforme aux standards internationaux.",
      image: "/images/qhse-laboratoire.jpg",
      order: 4,
      featured: true,
      isActive: true,
    },
    {
      title: "Sécurité au Travail & Prévention des Risques Professionnels (QHSE)",
      slug: "securite-travail-prevention-risques-qhse",
      category: "Sécurité au Travail",
      duration: "3 Jours (18h) - Certificat délivré",
      price: "150 000 FCFA",
      priceAmount: 150000,
      target: "Responsables HSE, délégués du personnel, superviseurs industriels",
      nextSession: "Sessions mensuelles",
      modulesCovered: [
        "Évaluation des risques professionnels et Document Unique (DUERP)",
        "Prévention des accidents, chutes, risques chimiques et gestes et postures",
        "Équipements de Protection Individuelle (EPI) et consignation",
        "Gestion des situations d'urgence, incendie et évacuation",
        "Culture sécurité et sensibilisation participative des équipes de terrain",
      ],
      description: "Formation certifiante aux standards ISO 45001 pour réduire les accidents et professionnaliser la sécurité sur vos sites industriels et agricoles.",
      image: "/images/qhse-laboratoire.jpg",
      order: 5,
      featured: false,
      isActive: true,
    },
    {
      title: "Fabrication de Détergents & Produits d'Entretien Professionnels",
      slug: "fabrication-detergents-produits-entretien",
      category: "Fabrication Détergents",
      duration: "4 Jours (24h) - 100% Atelier Pratique",
      price: "65 000 FCFA",
      priceAmount: 65000,
      target: "Entrepreneurs, groupements d'artisans, agents d'hygiène et collectivités",
      nextSession: "Sessions mensuelles",
      modulesCovered: [
        "Chimie appliquée : tensioactifs, régulateurs de pH et conservateurs",
        "Formulation de savons liquides, liquides vaisselle et désinfectants de sol",
        "Fabrication d'eau de Javel stabilisée et détergents ménagers multi-usages",
        "Mesures de sécurité de manipulation des réactifs chimiques",
        "Conditionnement, étiquetage réglementaire et calcul du coût de revient",
      ],
      description: "Apprentissage 100% pratique en laboratoire pour formuler et commercialiser des détergents et savons de haute qualité.",
      image: "/images/products/desinfectant-5l.jpg",
      order: 6,
      featured: true,
      isActive: true,
    },
    {
      title: "Cosmétique Naturelle, Savonnerie Artisanale & Valorisation Locale",
      slug: "cosmetique-naturelle-savonnerie-artisanale",
      category: "Cosmétique & Artisanat",
      duration: "4 Jours (24h) - 100% Atelier Pratique",
      price: "60 000 FCFA",
      priceAmount: 60000,
      target: "Créateurs de marques, coopératives féminines, porteurs de projets",
      nextSession: "Sessions mensuelles",
      modulesCovered: [
        "Procédé de saponification à froid (SAF) et calcul des indices de soude",
        "Surgraissage aux beurres et huiles végétales locales (karité, palmiste, coco)",
        "Formulation de baumes, crèmes et soins cosmétiques corporels",
        "Bonnes Pratiques de Fabrication (BPF cosmétiques / ISO 22716)",
        "Emballage écoresponsable, conservation saine et stratégie de vente",
      ],
      description: "Valorisez les huiles végétales congolaises et lancez votre gamme de savons et cosmétiques naturels surgras.",
      image: "/images/savon-artisanal.jpg",
      order: 7,
      featured: true,
      isActive: true,
    },
    {
      title: "Formations Professionnelles Sur-Mesure & Ingénierie de Compétences",
      slug: "formations-professionnelles-sur-mesure",
      category: "Sur-Mesure & Conseil",
      duration: "Sur-mesure (intra ou extra-entreprise)",
      price: "Sur devis adapté",
      priceAmount: 0,
      target: "Entreprises agroalimentaires, fermes, ONG, institutions publiques",
      nextSession: "À la demande",
      modulesCovered: [
        "Diagnostic préalable des besoins en compétences et audit terrain",
        "Co-conception de programmes et référentiels de compétences adaptés",
        "Formation-action directement sur vos sites d'exploitation",
        "Délivrance d'attestations et certificats de compétences professionnelles",
        "Suivi post-formation, coaching opérationnel et mesure d'impact",
      ],
      description: "Programmes conçus sur cahier des charges spécifique pour moderniser les compétences techniques de vos salariés.",
      image: "/images/ferme_ecole_avicole_1789164251928.jpg",
      order: 8,
      featured: false,
      isActive: true,
    },
  ]

  for (const f of formationsData) {
    const created = await prisma.formation.upsert({
      where: { slug: f.slug },
      update: f,
      create: f,
    })
    console.log(`✅ Formation créée : ${created.title}`)
  }

  // 5. Témoignages & Avis Clients
  const testimonialsData = [
    {
      name: "Jean-Paul Moukoko",
      role: "Gérant · Ferme Avicole du Kouilou",
      project: "Poussins & Provenderie",
      rating: 5,
      text: "Grâce aux poussins Cobb 500 et à l'aliment de démarrage AVS, la mortalité sur ma bande de 2 000 sujets est tombée à 1.6%. Un suivi vétérinaire rigoureux et des conseils toujours pertinents.",
      img: "https://cdn.pixabay.com/photo/2024/01/06/23/18/man-8492201_640.jpg",
      result: "↑ Mortalité réduite à 1.6%",
      isApproved: true,
      isFeatured: true,
      order: 1,
    },
    {
      name: "Sylvie Kimbembé",
      role: "Directrice Qualité · Unité Agroalimentaire",
      project: "Audit QHSE & HACCP",
      rating: 5,
      text: "L'expertise du Dr POUTYA et la formule « QHSE Partagé » ont transformé notre chaîne de conditionnement. Nous avons obtenu notre agrément sanitaire en un temps record !",
      img: "https://images.unsplash.com/photo-1757140448494-ad45016d456a?auto=format&fit=crop&w=300&q=80",
      result: "↑ Agrément SPS obtenu",
      isApproved: true,
      isFeatured: true,
      order: 2,
    },
    {
      name: "Alain Boukoulou",
      role: "Éleveur Avicole & Porteur de Projet",
      project: "Formation Ferme-École",
      rating: 5,
      text: "La formation de 5 jours en immersion m'a évité toutes les erreurs classiques du débutant. Aujourd'hui, mon élevage tourne à plein régime et génère des revenus constants.",
      img: "/images/clients/alain-boukoulou.jpg",
      result: "↑ Rentabilité garantie",
      isApproved: true,
      isFeatured: true,
      order: 3,
    },
    {
      name: "Mireille Tchicaya",
      role: "Présidente Coopérative Féminine de Tié-Tié",
      project: "Savonnerie & Cosmétique Naturelle",
      rating: 5,
      text: "Grâce à la formation en saponification à froid d'AVS, nos 12 adhérentes fabriquent désormais des savons au beurre de karité certifiés conformes qui se vendent dans les pharmacies et boutiques de Pointe-Noire.",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      result: "↑ 12 emplois créés",
      isApproved: true,
      isFeatured: true,
      order: 4,
    },
    {
      name: "Marcelle Mabiala",
      role: "Propriétaire d'animaux de compagnie",
      project: "Clinique Vétérinaire 24/7",
      rating: 5,
      text: "Une prise en charge d'urgence à 23h pour mon berger allemand accidenté. Le Dr POUTYA a sauvé mon chien avec professionnalisme et humanité. Une clinique moderne indispensable à Pointe-Noire.",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      result: "↑ Prise en charge 24/7",
      isApproved: true,
      isFeatured: false,
      order: 5,
    },
  ]

  for (const t of testimonialsData) {
    const existing = await prisma.testimonial.findFirst({
      where: { name: t.name, project: t.project },
    })
    if (!existing) {
      await prisma.testimonial.create({ data: t })
      console.log(`✅ Témoignage créé : ${t.name} (${t.project})`)
    }
  }

  // 6. Utilisateurs de test (Staff technique & Clients éleveurs)
  const defaultUserPassword = await bcrypt.hash('Eleveur@Avs2026!', 10)
  const demoUsers = [
    {
      email: 'eleveur.kouilou@gmail.com',
      name: 'Jean-Paul Moukoko',
      phone: '+242 06 500 11 22',
      password: defaultUserPassword,
      role: 'CLIENT',
      userType: 'company',
      companyName: 'Ferme Avicole du Kouilou',
      address: 'Route de Madingo-Kayes, PK 14',
      city: 'Pointe-Noire',
    },
    {
      email: 'tech.veterinaire@agrovetoservices.cg',
      name: 'Dr Vétérinaire Adjoint AVS',
      phone: '+242 05 633 70 50',
      password: defaultUserPassword,
      role: 'STAFF',
      userType: 'individual',
      companyName: 'Agro Véto Services Congo',
      address: 'Quartier Socoprise, Av. Nelson Mandela',
      city: 'Pointe-Noire',
    },
  ]

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    })
    console.log(`✅ Utilisateur créé : ${u.name} [${u.role}]`)
  }

  console.log('🎉 Seed AVS complet terminé avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
