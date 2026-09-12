// backend/src/controllers/productController.js
const prisma = require('../lib/prisma')

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, inStock, sort, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}

    if (category) {
      where.category = { slug: category }
    }

    if (inStock !== undefined) {
      where.inStock = inStock === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { badge: { contains: search, mode: 'insensitive' } },
      ]
    }

    let orderBy = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    if (sort === 'price_desc') orderBy = { price: 'desc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    ])

    res.json({
      success: true,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
      data: products,
    })
  } catch (error) {
    next(error)
  }
}

exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' })
    }

    res.json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
}

exports.createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      promoPrice,
      stock,
      unit,
      image,
      images,
      badge,
      features,
      categoryId,
    } = req.body

    if (!title || price === undefined || !image) {
      return res.status(400).json({
        success: false,
        message: 'Titre, prix et image principale sont obligatoires.',
      })
    }

    let baseSlug = slugify(title)
    let finalSlug = baseSlug
    let counter = 1
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug: finalSlug,
        description: description || '',
        price: parseFloat(price),
        promoPrice: promoPrice ? parseFloat(promoPrice) : null,
        stock: stock ? parseInt(stock) : 0,
        inStock: stock ? parseInt(stock) > 0 : true,
        unit: unit || 'unité',
        image,
        images: Array.isArray(images) ? images : [],
        badge: badge || null,
        features: Array.isArray(features) ? features : [],
        categoryId: categoryId || null,
      },
      include: { category: true },
    })

    res.status(201).json({ success: true, message: 'Produit créé avec succès', data: product })
  } catch (error) {
    next(error)
  }
}

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = { ...req.body }

    if (data.price !== undefined) data.price = parseFloat(data.price)
    if (data.promoPrice !== undefined) data.promoPrice = data.promoPrice ? parseFloat(data.promoPrice) : null
    if (data.stock !== undefined) {
      data.stock = parseInt(data.stock)
      data.inStock = data.stock > 0
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    })

    res.json({ success: true, message: 'Produit mis à jour', data: product })
  } catch (error) {
    next(error)
  }
}

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.product.delete({ where: { id } })
    res.json({ success: true, message: 'Produit supprimé avec succès' })
  } catch (error) {
    next(error)
  }
}

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est requis' })
    }

    const slug = slugify(name)
    const category = await prisma.category.create({
      data: { name, slug, description, icon },
    })

    res.status(201).json({ success: true, message: 'Catégorie créée', data: category })
  } catch (error) {
    next(error)
  }
}
