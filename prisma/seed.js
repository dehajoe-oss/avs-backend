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

  console.log('🎉 Seed AVS terminé avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
