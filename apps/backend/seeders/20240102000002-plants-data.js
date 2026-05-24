'use strict';

/**
 * 100 Plants seed — prices referenced from Ugaoo.com, NurseryLive.com, Ferns N Petals
 * Categories → Brand → Products → Variants (pot sizes) → Images → Inventory
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Helpers ──────────────────────────────────────────────────────────────
    const slug = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // ── 1. Plant Categories ──────────────────────────────────────────────────
    await queryInterface.bulkInsert('categories', [
      { name: 'Plants',              slug: 'plants',             image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', description: 'All plants for home & garden', parent_id: null, sort_order: 10, is_active: true, created_at: now, updated_at: now },
      { name: 'Indoor Plants',       slug: 'indoor-plants',      image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400', description: 'Plants for inside your home', parent_id: null, sort_order: 11, is_active: true, created_at: now, updated_at: now },
      { name: 'Outdoor Plants',      slug: 'outdoor-plants',     image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400', description: 'Plants for garden & balcony', parent_id: null, sort_order: 12, is_active: true, created_at: now, updated_at: now },
      { name: 'Flowering Plants',    slug: 'flowering-plants',   image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=400', description: 'Beautiful blooming plants', parent_id: null, sort_order: 13, is_active: true, created_at: now, updated_at: now },
      { name: 'Succulents & Cactus', slug: 'succulents',         image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', description: 'Low-maintenance succulents and cacti', parent_id: null, sort_order: 14, is_active: true, created_at: now, updated_at: now },
      { name: 'Medicinal Plants',    slug: 'medicinal',          image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', description: 'Herbs and medicinal plants', parent_id: null, sort_order: 15, is_active: true, created_at: now, updated_at: now },
      { name: 'Fruit Plants',        slug: 'fruit-plants',       image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', description: 'Fruit-bearing trees and plants', parent_id: null, sort_order: 16, is_active: true, created_at: now, updated_at: now },
      { name: 'Air Purifying',       slug: 'air-purifying',      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400', description: 'Plants that clean your indoor air', parent_id: null, sort_order: 17, is_active: true, created_at: now, updated_at: now },
      { name: 'XL Plants',           slug: 'xl-plants',          image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400', description: 'Large statement plants', parent_id: null, sort_order: 18, is_active: true, created_at: now, updated_at: now },
      { name: 'Pet Friendly',        slug: 'pet-friendly',       image: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=400', description: 'Safe for cats and dogs', parent_id: null, sort_order: 19, is_active: true, created_at: now, updated_at: now },
      { name: 'Low Maintenance',     slug: 'low-maintenance',    image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400', description: 'Easy-care plants for busy people', parent_id: null, sort_order: 20, is_active: true, created_at: now, updated_at: now },
      { name: 'Seeds',               slug: 'seeds',              image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', description: 'Seeds for flowers, vegetables & herbs', parent_id: null, sort_order: 21, is_active: true, created_at: now, updated_at: now },
      { name: 'Pots & Planters',     slug: 'pots-planters',      image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=400', description: 'Pots and planters for every style', parent_id: null, sort_order: 22, is_active: true, created_at: now, updated_at: now },
      { name: 'Plant Care',          slug: 'plant-care',         image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=400', description: 'Fertilizers, soil & pest control', parent_id: null, sort_order: 23, is_active: true, created_at: now, updated_at: now },
      { name: 'Gifts & Combos',      slug: 'gifts-combos',       image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400', description: 'Plant gifts and combo packs', parent_id: null, sort_order: 24, is_active: true, created_at: now, updated_at: now },
      { name: 'New Arrivals',        slug: 'new-arrivals',       image: 'https://images.unsplash.com/photo-1601985705806-5b9a291f6b5c?w=400', description: 'Freshly added plants', parent_id: null, sort_order: 25, is_active: true, created_at: now, updated_at: now },
    ], {});

    const [catRows] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories ORDER BY id`
    );
    const cid = s => catRows.find(c => c.slug === s)?.id;

    // ── 2. Brand ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('brands', [
      { name: 'Lagaao Nursery', slug: 'lagaao-nursery', logo: '/logo.png', is_active: true, created_at: now, updated_at: now },
    ], {});

    const [brandRows] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM brands WHERE slug = 'lagaao-nursery'`
    );
    const brandId = brandRows[0].id;

    // ── 3. Admin user id ──────────────────────────────────────────────────────
    const [[adminRow]] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@lagaao.com' LIMIT 1`
    );
    const adminId = adminRow?.id ?? null;

    // ── 4. Products ───────────────────────────────────────────────────────────
    // Columns: name, slug, description, short_description, category_id, brand_id,
    //          status, is_featured, is_digital, has_variants, base_price, sale_price,
    //          tax_rate, tags, weight, review_count, rating, created_by, vendor_id
    // Prices referenced from Ugaoo.com / NurseryLive.com / Ferns N Petals (INR, 4" pot)

    const plants = [
      // ── Indoor Plants (20) ────────────────────────────────────────────────
      {
        name: 'Money Plant (Golden Pothos)', slug: 'money-plant-golden-pothos',
        catSlug: 'indoor-plants', featured: true,
        desc: 'The most popular houseplant in India! Golden Pothos (Epipremnum aureum) is virtually indestructible, purifies air, and brings prosperity. Grows in water or soil, tolerates low light beautifully.',
        short: 'Air purifying · Low light · Easy care · Vining',
        base: 149, sale: 99,
        tags: ['indoor','air-purifying','low-light','easy-care','pet-friendly','money-plant'],
        rating: 4.8, reviews: 2847, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600',
      },
      {
        name: 'Snake Plant (Sansevieria)', slug: 'snake-plant-sansevieria',
        catSlug: 'indoor-plants', featured: true,
        desc: 'Sansevieria trifasciata, the ultimate low-maintenance plant. Releases oxygen at night, purifies air of toxins like formaldehyde and benzene. Perfect for bedrooms.',
        short: 'Night oxygen · Air purifying · Drought tolerant · Bedroom plant',
        base: 299, sale: 199,
        tags: ['indoor','air-purifying','low-light','easy-care','bedroom','snake-plant'],
        rating: 4.9, reviews: 3241, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600',
      },
      {
        name: 'Peace Lily (Spathiphyllum)', slug: 'peace-lily-spathiphyllum',
        catSlug: 'indoor-plants', featured: true,
        desc: 'Spathiphyllum wallisii with elegant white blooms. One of NASA\'s top air-purifying plants — removes ammonia, benzene, formaldehyde and carbon monoxide. Thrives in low light.',
        short: 'NASA-listed air purifier · White blooms · Low light · Pet toxic',
        base: 349, sale: 249,
        tags: ['indoor','air-purifying','flowering','peace-lily','nasa'],
        rating: 4.7, reviews: 1893, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1616602847793-df5ea5baa940?w=600',
      },
      {
        name: 'ZZ Plant (Zamioculcas)', slug: 'zz-plant-zamioculcas',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Zamioculcas zamiifolia — the unkillable office plant. Stores water in its thick rhizomes, survives neglect, low light, and irregular watering. Stunning glossy dark green leaves.',
        short: 'Nearly indestructible · Glossy leaves · Low light · Air purifying',
        base: 399, sale: 299,
        tags: ['indoor','low-light','easy-care','office-plant','air-purifying'],
        rating: 4.8, reviews: 1456, weight: 0.6,
        image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600',
      },
      {
        name: 'Rubber Plant (Ficus Elastica)', slug: 'rubber-plant-ficus-elastica',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Ficus elastica with large, waxy dark green leaves. A dramatic statement plant that purifies indoor air. Available in green, burgundy, and variegated forms.',
        short: 'Bold statement plant · Air purifying · Fast growing · Medium light',
        base: 449, sale: 349,
        tags: ['indoor','air-purifying','statement-plant','ficus'],
        rating: 4.6, reviews: 987, weight: 0.7,
        image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600',
      },
      {
        name: 'Monstera Deliciosa (Swiss Cheese Plant)', slug: 'monstera-deliciosa',
        catSlug: 'indoor-plants', featured: true,
        desc: 'The iconic Instagram plant! Monstera deliciosa develops its signature fenestrated (holey) leaves as it matures. Fast-growing tropical plant that transforms any space.',
        short: 'Iconic leaves · Fast growing · Tropical · Instagram favorite',
        base: 599, sale: 449,
        tags: ['indoor','tropical','statement-plant','monstera','popular'],
        rating: 4.9, reviews: 3782, weight: 0.8,
        image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600',
      },
      {
        name: 'Spider Plant (Chlorophytum)', slug: 'spider-plant-chlorophytum',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Chlorophytum comosum — one of the safest plants for homes with pets and children. Produces cascading baby plantlets (spiderettes) that you can propagate easily.',
        short: 'Pet safe · Easy propagation · Air purifying · Hanging plant',
        base: 149, sale: 99,
        tags: ['indoor','pet-friendly','air-purifying','hanging','easy-care'],
        rating: 4.7, reviews: 2134, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1580148051671-7b8d50a90c5c?w=600',
      },
      {
        name: 'Philodendron Heartleaf', slug: 'philodendron-heartleaf',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Philodendron hederaceum with heart-shaped, velvety green leaves. A fast-growing vining plant that thrives in indirect light. Perfect for shelves and hanging baskets.',
        short: 'Heart-shaped leaves · Fast growing · Low light · Trailing',
        base: 199, sale: 149,
        tags: ['indoor','hanging','low-light','trailing','philodendron'],
        rating: 4.7, reviews: 1678, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1599598425947-5202edd56bdb?w=600',
      },
      {
        name: 'Chinese Evergreen (Aglaonema Red)', slug: 'aglaonema-red-chinese-evergreen',
        catSlug: 'indoor-plants', featured: true,
        desc: 'Aglaonema with striking red and green variegated leaves. One of the most forgiving houseplants — tolerates low light, infrequent watering, and air conditioning.',
        short: 'Stunning red foliage · Super low maintenance · Air purifying',
        base: 349, sale: 279,
        tags: ['indoor','air-purifying','low-light','colorful','aglaonema'],
        rating: 4.8, reviews: 2241, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1615486511262-c7bc1f3c4c59?w=600',
      },
      {
        name: 'Areca Palm (Butterfly Palm)', slug: 'areca-palm-butterfly',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Dypsis lutescens — the most popular indoor palm in India. Acts as a natural humidifier, purifies xylene and toluene from air. Elegant feathery fronds.',
        short: 'Natural humidifier · Air purifying · Elegant fronds · Pet safe',
        base: 499, sale: 399,
        tags: ['indoor','air-purifying','palm','pet-friendly','tropical'],
        rating: 4.6, reviews: 1342, weight: 1.0,
        image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600',
      },
      {
        name: 'Syngonium Pink (Arrowhead Plant)', slug: 'syngonium-pink-arrowhead',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Syngonium podophyllum in beautiful blush pink. Arrow-shaped leaves that shift from pink to green as the plant matures. Compact and perfect for small spaces.',
        short: 'Blush pink foliage · Compact · Air purifying · Easy care',
        base: 249, sale: 179,
        tags: ['indoor','colorful','compact','air-purifying','syngonium'],
        rating: 4.7, reviews: 1891, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1589400352059-ddf5e2ca7e80?w=600',
      },
      {
        name: 'Dracaena Marginata (Dragon Tree)', slug: 'dracaena-marginata-dragon-tree',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Dracaena marginata with slim, spiky leaves edged in deep red. A slow-growing architectural plant that removes trichloroethylene from air. Can grow 1.8m tall indoors.',
        short: 'Architectural · Air purifying · Slow growing · Low water',
        base: 399, sale: 299,
        tags: ['indoor','air-purifying','architectural','dracaena'],
        rating: 4.5, reviews: 876, weight: 0.6,
        image: 'https://images.unsplash.com/photo-1606757389691-7f4b09df6384?w=600',
      },
      {
        name: 'Calathea Ornata (Pinstripe Plant)', slug: 'calathea-ornata-pinstripe',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Calathea ornata with stunning dark green leaves decorated with delicate pink pinstripes and purple undersides. A living work of art that folds its leaves at night.',
        short: 'Stunning pinstripes · Moves at night · Pet safe · Humidity lover',
        base: 449, sale: 349,
        tags: ['indoor','pet-friendly','decorative','calathea','tropical'],
        rating: 4.4, reviews: 743, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1607931819065-b8a73f6a0b5c?w=600',
      },
      {
        name: 'Marble Queen Pothos', slug: 'marble-queen-pothos',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Epipremnum aureum Marble Queen with beautiful cream and green marbled leaves. A slower-growing pothos variant that remains bright and compact. Trails beautifully.',
        short: 'Marbled cream-green · Trailing · Low light · Easy care',
        base: 199, sale: 149,
        tags: ['indoor','trailing','low-light','pothos','variegated'],
        rating: 4.7, reviews: 1234, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1610484826917-0f101a7bf7f4?w=600',
      },
      {
        name: 'Anthurium Red (Flamingo Flower)', slug: 'anthurium-red-flamingo-flower',
        catSlug: 'indoor-plants', featured: true,
        desc: 'Anthurium andraeanum with glossy, heart-shaped red spathes that bloom nearly year-round. The waxy flowers are actually modified leaves called spathes. Long-lasting blooms.',
        short: 'Year-round blooms · Glossy red flowers · Long-lasting · Gifting',
        base: 399, sale: 299,
        tags: ['indoor','flowering','gifting','anthurium','tropical'],
        rating: 4.6, reviews: 1567, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1567331711402-509c12c41959?w=600',
      },
      {
        name: 'Croton (Codiaeum Variegatum)', slug: 'croton-codiaeum-variegatum',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Codiaeum variegatum with dramatic multi-coloured foliage in yellow, orange, red, green and purple. Loves bright indirect light. The more sun, the more vivid the colours.',
        short: 'Multi-colour foliage · Vibrant · Bright light · Statement',
        base: 249, sale: 199,
        tags: ['indoor','colorful','statement-plant','croton'],
        rating: 4.5, reviews: 986, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1598898700386-d72716c4c36b?w=600',
      },
      {
        name: 'Boston Fern (Nephrolepis)', slug: 'boston-fern-nephrolepis',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Nephrolepis exaltata with lush, arching fronds of emerald green. A NASA-approved air purifier that removes formaldehyde. Ideal for shaded bathrooms and humid spaces.',
        short: 'Lush fronds · NASA air purifier · Humidity lover · Hanging',
        base: 199, sale: 149,
        tags: ['indoor','air-purifying','hanging','fern','humidity'],
        rating: 4.4, reviews: 893, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600',
      },
      {
        name: 'Dieffenbachia (Dumb Cane)', slug: 'dieffenbachia-dumb-cane',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Dieffenbachia seguine with large, attractive leaves splashed with cream and green. A robust tropical plant that tolerates indoor conditions well. Fast-growing and dramatic.',
        short: 'Large tropical leaves · Fast growing · Low-medium light',
        base: 249, sale: 199,
        tags: ['indoor','tropical','large-leaves','easy-care'],
        rating: 4.5, reviews: 734, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1609253963674-b1e51b4e2ad4?w=600',
      },
      {
        name: 'Peperomia Watermelon', slug: 'peperomia-watermelon',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Peperomia argyreia with delightful watermelon-patterned leaves. A compact, slow-growing plant perfect for desks and small spaces. Very tolerant of neglect.',
        short: 'Watermelon pattern · Compact · Desk plant · Low water',
        base: 249, sale: 199,
        tags: ['indoor','compact','desk-plant','peperomia','unique'],
        rating: 4.8, reviews: 2143, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1632321606082-88dcc1b2a5f6?w=600',
      },
      {
        name: 'String of Hearts (Ceropegia)', slug: 'string-of-hearts-ceropegia',
        catSlug: 'indoor-plants', featured: false,
        desc: 'Ceropegia woodii with dainty heart-shaped leaves on long trailing strings. One of the most charming hanging plants. Leaves are silver-green on top, deep purple beneath.',
        short: 'Heart leaves · Trailing strings · Hanging · Unique · Easy care',
        base: 299, sale: 229,
        tags: ['indoor','hanging','trailing','unique','heart-shaped'],
        rating: 4.8, reviews: 1876, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600',
      },

      // ── Outdoor Plants (15) ───────────────────────────────────────────────
      {
        name: 'Bougainvillea (Pink)', slug: 'bougainvillea-pink',
        catSlug: 'outdoor-plants', featured: true,
        desc: 'Bougainvillea spectabilis in vibrant pink — India\'s most beloved flowering climber. Drought tolerant once established, blooms profusely in full sun. Perfect for compound walls and pergolas.',
        short: 'Prolific bloomer · Drought tolerant · Full sun · Wall climber',
        base: 299, sale: 199,
        tags: ['outdoor','flowering','climbing','drought-tolerant','bougainvillea'],
        rating: 4.8, reviews: 2876, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1549890762-0a3f8933e3ef?w=600',
      },
      {
        name: 'Hibiscus Red (Gurhal)', slug: 'hibiscus-red-gurhal',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Hibiscus rosa-sinensis with large, vibrant red flowers. Blooms almost year-round in Indian climate. Sacred in Hindu tradition, excellent for making herbal tea. Attracts butterflies.',
        short: 'Year-round blooms · Herbal use · Butterfly attractor · Full sun',
        base: 249, sale: 179,
        tags: ['outdoor','flowering','herbal','gurhal','hibiscus'],
        rating: 4.7, reviews: 1934, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600',
      },
      {
        name: 'Mogra (Arabian Jasmine)', slug: 'mogra-arabian-jasmine',
        catSlug: 'outdoor-plants', featured: true,
        desc: 'Jasminum sambac — the fragrant Mogra beloved across India. Small white flowers with an intoxicating fragrance, especially at night. Used for garlands, puja, and perfumery.',
        short: 'Heavenly fragrance · Night blooming · Puja plant · Garlands',
        base: 199, sale: 149,
        tags: ['outdoor','fragrant','flowering','mogra','jasmine','puja'],
        rating: 4.9, reviews: 3241, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      },
      {
        name: 'Rose Bush (Dark Red)', slug: 'rose-bush-dark-red',
        catSlug: 'outdoor-plants', featured: true,
        desc: 'Rosa hybrid in deep velvety red. The queen of flowers — iconic fragrant blooms perfect for gifting and garden display. Our grafted plants start blooming within weeks.',
        short: 'Fragrant blooms · Grafted plant · Gifting · Garden queen',
        base: 349, sale: 249,
        tags: ['outdoor','flowering','fragrant','gifting','rose'],
        rating: 4.7, reviews: 2134, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=600',
      },
      {
        name: 'Champa (Plumeria White)', slug: 'champa-plumeria-white',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Plumeria alba with pure white flowers and yellow centres. The iconic temple flower with an extraordinary fragrance. Drought resistant, blooms abundantly in hot weather.',
        short: 'Temple flower · Extraordinary fragrance · Drought tolerant · Sacred',
        base: 399, sale: 299,
        tags: ['outdoor','flowering','fragrant','temple','champa','plumeria'],
        rating: 4.8, reviews: 1567, weight: 0.6,
        image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600',
      },
      {
        name: 'Adenium Desert Rose (Red)', slug: 'adenium-desert-rose-red',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Adenium obesum with a thick, swollen caudex trunk and brilliant red flowers. A succulent that stores water in its fat base. Extremely drought tolerant, spectacular in bloom.',
        short: 'Striking caudex · Red flowers · Drought tolerant · Bonsai-like',
        base: 349, sale: 279,
        tags: ['outdoor','succulent','flowering','drought-tolerant','adenium'],
        rating: 4.7, reviews: 1243, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1596048272479-d5a60ab12ae2?w=600',
      },
      {
        name: 'Ixora (Jungle Flame)', slug: 'ixora-jungle-flame',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Ixora coccinea with clusters of brilliant orange-red flowers year-round. A compact hedge plant that thrives in Indian heat. Perfect for borders and low hedges.',
        short: 'Year-round orange clusters · Hedge plant · Full sun · Compact',
        base: 179, sale: 129,
        tags: ['outdoor','flowering','hedge','ixora','full-sun'],
        rating: 4.6, reviews: 987, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1591588582259-e675bd2e6088?w=600',
      },
      {
        name: 'Raat Ki Rani (Night Blooming Jasmine)', slug: 'raat-ki-rani-night-blooming',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Cestrum nocturnum — the legendary Night Queen. Tiny white flowers release an overpowering sweet fragrance after dark. One plant can perfume an entire neighbourhood.',
        short: 'Powerfully fragrant at night · Fast growing · Tropical shrub',
        base: 249, sale: 179,
        tags: ['outdoor','fragrant','night-blooming','raat-ki-rani'],
        rating: 4.8, reviews: 2341, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600',
      },
      {
        name: 'Portulaca (Moss Rose)', slug: 'portulaca-moss-rose',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Portulaca grandiflora in mixed colours — a carpet of tiny jewel-like flowers all summer. Extremely drought tolerant. Perfect for filling sunny gaps in garden beds.',
        short: 'Carpet of colour · Drought tolerant · Full sun · Easy care',
        base: 99, sale: 79,
        tags: ['outdoor','flowering','groundcover','drought-tolerant','portulaca'],
        rating: 4.7, reviews: 1876, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=600',
      },
      {
        name: 'Tecoma (Yellow Bells)', slug: 'tecoma-yellow-bells',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Tecoma stans with trumpet-shaped golden yellow flowers. A fast-growing shrub that blooms prolifically. Excellent for screening, hedges, and attracting hummingbirds.',
        short: 'Golden trumpets · Fast growing · Hedge · Butterfly attractor',
        base: 199, sale: 149,
        tags: ['outdoor','flowering','hedge','yellow','tecoma'],
        rating: 4.6, reviews: 756, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600',
      },
      {
        name: 'Marigold (African Orange)', slug: 'marigold-african-orange',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Tagetes erecta in bold orange — the most auspicious flower in India. Used in pooja garlands, protects vegetable gardens from pests. Blooms abundantly with almost no care.',
        short: 'Puja garlands · Pest repellent · Full sun · Easy care',
        base: 99, sale: 79,
        tags: ['outdoor','flowering','puja','marigold','easy-care'],
        rating: 4.8, reviews: 3456, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1548094891-c4ba474efd16?w=600',
      },
      {
        name: 'Lantana Camara (Five Colour)', slug: 'lantana-camara-five-colour',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Lantana camara with colour-changing flower clusters — opens yellow and deepens to orange, pink, and red as they age. Incredibly drought tolerant, butterfly magnet.',
        short: 'Colour-changing flowers · Drought tolerant · Butterfly magnet',
        base: 149, sale: 99,
        tags: ['outdoor','flowering','drought-tolerant','butterfly','lantana'],
        rating: 4.6, reviews: 1123, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1444930694458-01babf71abda?w=600',
      },
      {
        name: 'Catharanthus (Vinca / Periwinkle)', slug: 'catharanthus-vinca-periwinkle',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Catharanthus roseus — hardy annual that flowers continuously through summer heat. Available in white, pink, red, and purple. Perfect for borders, pots, and window boxes.',
        short: 'Heat tolerant · Continuous blooms · Low care · Border plant',
        base: 99, sale: 79,
        tags: ['outdoor','flowering','heat-tolerant','border','vinca'],
        rating: 4.7, reviews: 1543, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1589374386679-8bef4e4f4c4d?w=600',
      },
      {
        name: 'Crossandra (Firecracker Flower)', slug: 'crossandra-firecracker-flower',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Crossandra infundibuliformis with brilliant salmon-orange flowers on tiered spikes. A long-blooming plant perfect for shady spots. Also used in traditional South Indian hair decoration.',
        short: 'Salmon-orange blooms · Shade tolerant · Long blooming season',
        base: 149, sale: 119,
        tags: ['outdoor','flowering','shade-tolerant','crossandra','traditional'],
        rating: 4.6, reviews: 876, weight: 0.25,
        image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600',
      },
      {
        name: 'Plumbago (Cape Leadwort)', slug: 'plumbago-cape-leadwort',
        catSlug: 'outdoor-plants', featured: false,
        desc: 'Plumbago auriculata with masses of sky-blue phlox-like flowers. A sprawling, fast-growing climber that blooms for most of the year. Excellent for covering fences and walls.',
        short: 'Sky-blue flowers · Climbing shrub · Long blooming · Wall cover',
        base: 179, sale: 139,
        tags: ['outdoor','flowering','climbing','blue-flowers','plumbago'],
        rating: 4.7, reviews: 934, weight: 0.35,
        image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600',
      },

      // ── Flowering Plants (10) ─────────────────────────────────────────────
      {
        name: 'Orchid (Phalaenopsis Purple)', slug: 'orchid-phalaenopsis-purple',
        catSlug: 'flowering-plants', featured: true,
        desc: 'Phalaenopsis orchid in stunning purple — the most popular orchid worldwide. Each flower spike produces 8-12 blooms lasting 2-3 months. Re-blooms annually with simple care.',
        short: '2-3 month blooms · Annual re-blooming · Gifting · Low care',
        base: 699, sale: 549,
        tags: ['indoor','flowering','gifting','orchid','exotic','premium'],
        rating: 4.7, reviews: 1876, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1537365587684-f490102e1225?w=600',
      },
      {
        name: 'Gerbera Daisy (Mixed Colours)', slug: 'gerbera-daisy-mixed',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Gerbera jamesonii in a cheerful mix of red, yellow, orange, pink, and white. NASA-approved air purifier — particularly good at removing benzene. Long-lasting cut flowers.',
        short: 'Bright cheery blooms · Air purifying (NASA) · Cut flowers · Colourful',
        base: 199, sale: 149,
        tags: ['outdoor','flowering','air-purifying','cut-flowers','gerbera'],
        rating: 4.7, reviews: 1432, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
      },
      {
        name: 'Anthurium Pink (Flamingo Lily)', slug: 'anthurium-pink-flamingo-lily',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Anthurium andraeanum in soft pink — adds a tropical touch with heart-shaped spathes that last weeks. A popular corporate gifting plant. Symbolises love and hospitality.',
        short: 'Lasting pink blooms · Corporate gifting · Tropical · Long lasting',
        base: 449, sale: 349,
        tags: ['indoor','flowering','gifting','anthurium','tropical'],
        rating: 4.6, reviews: 987, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1548460783-d1c86fdb69fd?w=600',
      },
      {
        name: 'Chrysanthemum (Sevanti Yellow)', slug: 'chrysanthemum-sevanti-yellow',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Chrysanthemum morifolium in sunny yellow. The Sevanti — used across India in pooja and garlands. A NASA air purifier that removes ammonia. Blooms in cooler months.',
        short: 'Pooja plant · NASA air purifier · Cool season bloomer',
        base: 149, sale: 119,
        tags: ['outdoor','flowering','pooja','chrysanthemum','air-purifying'],
        rating: 4.7, reviews: 1654, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=600',
      },
      {
        name: 'Ixora Orange (Jungle Geranium)', slug: 'ixora-orange-jungle-geranium',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Ixora chinensis in brilliant orange — a compact, floriferous shrub that blooms year-round. Popular for low hedges and container gardening. Thrives in hot, humid conditions.',
        short: 'Year-round orange blooms · Compact · Hedge plant · Container',
        base: 179, sale: 139,
        tags: ['outdoor','flowering','hedge','compact','ixora'],
        rating: 4.6, reviews: 876, weight: 0.25,
        image: 'https://images.unsplash.com/photo-1591588582259-e675bd2e6088?w=600',
      },
      {
        name: 'Zinnia (Mixed Colours)', slug: 'zinnia-mixed-colours',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Zinnia elegans in a vibrant mix. Heat-loving, fast-blooming annuals that bring nonstop colour from spring to frost. Excellent butterfly attractors and cut flowers.',
        short: 'Heat loving · Fast growing · Butterfly magnet · Cut flowers',
        base: 99, sale: 79,
        tags: ['outdoor','flowering','butterfly','cut-flowers','zinnia','annual'],
        rating: 4.8, reviews: 2345, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=600',
      },
      {
        name: 'Pentas (Star Cluster)', slug: 'pentas-star-cluster',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Pentas lanceolata with star-shaped flower clusters in red, pink, and white. A long-blooming butterfly and hummingbird plant that thrives in India\'s climate.',
        short: 'Star clusters · Butterfly magnet · Long blooming · Heat tolerant',
        base: 149, sale: 119,
        tags: ['outdoor','flowering','butterfly','heat-tolerant','pentas'],
        rating: 4.7, reviews: 987, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=600',
      },
      {
        name: 'Salvia Blue (Blue Sage)', slug: 'salvia-blue-sage',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Salvia farinacea with elegant spikes of blue-violet flowers. A long-blooming perennial in India that attracts bees and butterflies. Drought tolerant once established.',
        short: 'Blue-violet spikes · Bee magnet · Drought tolerant · Long blooming',
        base: 129, sale: 99,
        tags: ['outdoor','flowering','blue-flowers','bee-friendly','salvia'],
        rating: 4.6, reviews: 645, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600',
      },
      {
        name: 'Bird of Paradise (Strelitzia)', slug: 'bird-of-paradise-strelitzia',
        catSlug: 'flowering-plants', featured: true,
        desc: 'Strelitzia reginae with dramatic orange and blue flowers resembling a tropical bird. A statement plant that blooms in 3-5 years from seed. Paddle-shaped leaves are equally spectacular.',
        short: 'Dramatic orange blooms · Statement leaves · Tropical · Exotic',
        base: 899, sale: 699,
        tags: ['outdoor','indoor','flowering','exotic','statement-plant','strelitzia'],
        rating: 4.8, reviews: 1234, weight: 1.2,
        image: 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600',
      },
      {
        name: 'African Violet (Saintpaulia)', slug: 'african-violet-saintpaulia',
        catSlug: 'flowering-plants', featured: false,
        desc: 'Saintpaulia ionantha with velvety leaves and clusters of delicate purple flowers. A beloved windowsill plant that blooms nearly year-round with consistent indirect light.',
        short: 'Year-round purple blooms · Compact · Windowsill · Easy care',
        base: 249, sale: 199,
        tags: ['indoor','flowering','compact','windowsill','violet'],
        rating: 4.6, reviews: 876, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=600',
      },

      // ── Succulents & Cactus (10) ─────────────────────────────────────────
      {
        name: 'Aloe Vera (Medicinal)', slug: 'aloe-vera-medicinal',
        catSlug: 'succulents', featured: true,
        desc: 'Aloe barbadensis miller — the ultimate healing plant. Gel soothes burns, cuts, and sunburn. Also purifies indoor air. Virtually indestructible, needs water only once a fortnight.',
        short: 'Healing gel · Air purifying · Once-a-fortnight water · Medicinal',
        base: 149, sale: 99,
        tags: ['indoor','outdoor','succulent','medicinal','air-purifying','aloe'],
        rating: 4.9, reviews: 5678, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      },
      {
        name: 'Jade Plant (Crassula Ovata)', slug: 'jade-plant-crassula-ovata',
        catSlug: 'succulents', featured: false,
        desc: 'Crassula ovata — the money tree of South Africa. Thick, waxy oval leaves on woody stems. Can live for decades and is said to bring good luck and financial prosperity.',
        short: 'Lucky money plant · Long-lived · Low water · Bonsai potential',
        base: 199, sale: 149,
        tags: ['indoor','succulent','lucky-plant','bonsai','easy-care'],
        rating: 4.8, reviews: 2341, weight: 0.4,
        image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600',
      },
      {
        name: 'Echeveria (Hens and Chicks)', slug: 'echeveria-hens-and-chicks',
        catSlug: 'succulents', featured: false,
        desc: 'Echeveria elegans — a perfect rosette succulent in soft blue-green. Produces offsets (chicks) around the mother plant. Beautiful on windowsills and in dish gardens.',
        short: 'Perfect rosette · Propagates easily · Windowsill · Colourful',
        base: 149, sale: 99,
        tags: ['indoor','succulent','rosette','easy-propagation','compact'],
        rating: 4.8, reviews: 1987, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600',
      },
      {
        name: 'Haworthia Zebra Plant', slug: 'haworthia-zebra-plant',
        catSlug: 'succulents', featured: false,
        desc: 'Haworthia fasciata with distinctive white horizontal stripes on dark green leaves. One of the few succulents that thrives in shade — perfect for offices and north-facing windows.',
        short: 'White zebra stripes · Shade tolerant · Office plant · Compact',
        base: 179, sale: 139,
        tags: ['indoor','succulent','shade-tolerant','compact','office'],
        rating: 4.7, reviews: 1234, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600',
      },
      {
        name: 'Kalanchoe Blossfeldiana', slug: 'kalanchoe-blossfeldiana',
        catSlug: 'succulents', featured: false,
        desc: 'Kalanchoe blossfeldiana with clusters of small, bright flowers in red, orange, yellow, or pink above waxy dark green leaves. A cheerful gift plant that blooms for weeks.',
        short: 'Bright clusters · Long blooming · Gift plant · Easy care',
        base: 199, sale: 149,
        tags: ['indoor','succulent','flowering','gifting','kalanchoe'],
        rating: 4.7, reviews: 1543, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1553982258-7ef62cf76cde?w=600',
      },
      {
        name: 'Cactus Golden Barrel', slug: 'cactus-golden-barrel',
        catSlug: 'succulents', featured: false,
        desc: 'Echinocactus grusonii — the iconic golden sphere cactus covered in neat golden spines. A slow-growing specimen plant that can reach 1m across. Extremely drought tolerant.',
        short: 'Golden spines · Sphere shape · Very slow growing · Statement',
        base: 249, sale: 179,
        tags: ['indoor','outdoor','cactus','drought-tolerant','architectural'],
        rating: 4.6, reviews: 876, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1476126946527-5e3d2eed9b23?w=600',
      },
      {
        name: 'String of Pearls Succulent', slug: 'string-of-pearls-succulent',
        catSlug: 'succulents', featured: false,
        desc: 'Senecio rowleyanus with cascading strings of spherical, pea-like leaves. One of the most distinctive hanging succulents. Produces tiny white cinnamon-scented flowers.',
        short: 'Bead-like leaves · Trailing · Fragrant flowers · Unique',
        base: 299, sale: 229,
        tags: ['indoor','succulent','hanging','trailing','unique'],
        rating: 4.7, reviews: 1432, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=600',
      },
      {
        name: 'Sedum (Stonecrop)', slug: 'sedum-stonecrop',
        catSlug: 'succulents', featured: false,
        desc: 'Sedum rubrotinctum (Jelly Beans) with plump, glossy leaves that turn red at the tips in bright sun. A cheerful little succulent that grows in tight clusters.',
        short: 'Jelly bean leaves · Sun blushing · Ground cover · Easy',
        base: 129, sale: 99,
        tags: ['indoor','outdoor','succulent','groundcover','easy-care'],
        rating: 4.7, reviews: 1098, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600',
      },
      {
        name: 'Euphorbia Tirucalli (Pencil Cactus)', slug: 'euphorbia-tirucalli-pencil-cactus',
        catSlug: 'succulents', featured: false,
        desc: 'Euphorbia tirucalli — the fire sticks plant with cylindrical bright green pencil-like branches that turn orange-red in full sun. A dramatic, architectural succulent-like plant.',
        short: 'Pencil branches · Orange-red in sun · Architectural · Drought tolerant',
        base: 199, sale: 149,
        tags: ['outdoor','indoor','succulent-like','architectural','drought-tolerant'],
        rating: 4.5, reviews: 756, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1476126946527-5e3d2eed9b23?w=600',
      },
      {
        name: 'Tillandsia Air Plant', slug: 'tillandsia-air-plant',
        catSlug: 'succulents', featured: false,
        desc: 'Tillandsia ionantha — needs NO soil! Absorbs water through its leaves. Mount on driftwood, terrariums, or cork. Blooms purple with orange flowers when happy.',
        short: 'No soil needed · No pot needed · Terrarium · Unique gift',
        base: 199, sale: 149,
        tags: ['indoor','air-plant','no-soil','terrarium','unique','gift'],
        rating: 4.6, reviews: 1123, weight: 0.05,
        image: 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=600',
      },

      // ── Medicinal Plants (10) ─────────────────────────────────────────────
      {
        name: 'Tulsi (Holy Basil Green)', slug: 'tulsi-holy-basil-green',
        catSlug: 'medicinal', featured: true,
        desc: 'Ocimum tenuiflorum — India\'s most sacred herb. Used in Ayurveda for centuries to treat colds, stress, and inflammation. The divine plant of every Indian home.',
        short: 'Sacred plant · Immunity booster · Ayurvedic · Every home needs one',
        base: 79, sale: 59,
        tags: ['outdoor','indoor','medicinal','sacred','tulsi','ayurvedic'],
        rating: 4.9, reviews: 7823, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1592897977693-66c3b7b72dd6?w=600',
      },
      {
        name: 'Curry Leaf Tree (Kadi Patta)', slug: 'curry-leaf-tree-kadi-patta',
        catSlug: 'medicinal', featured: true,
        desc: 'Murraya koenigii — essential in every Indian kitchen. Fresh curry leaves add irreplaceable flavour to dal, rasam, and chutneys. Rich in antioxidants and traditionally used for hair growth.',
        short: 'Kitchen essential · Hair growth · Antioxidant · Fragrant',
        base: 149, sale: 99,
        tags: ['outdoor','medicinal','kitchen','culinary','curry-leaf'],
        rating: 4.9, reviews: 5632, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      },
      {
        name: 'Ashwagandha (Withania Somnifera)', slug: 'ashwagandha-withania-somnifera',
        catSlug: 'medicinal', featured: false,
        desc: 'Withania somnifera — the king of Ayurvedic herbs. Roots used to make powerful adaptogenic medicine that reduces stress and boosts immunity. Grows as a small shrub in India.',
        short: 'Ayurvedic king · Stress relief · Immunity · Adaptogen',
        base: 199, sale: 149,
        tags: ['outdoor','medicinal','ayurvedic','adaptogen','ashwagandha'],
        rating: 4.7, reviews: 1432, weight: 0.3,
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600',
      },
      {
        name: 'Neem Tree (Azadirachta Indica)', slug: 'neem-tree-azadirachta-indica',
        catSlug: 'medicinal', featured: false,
        desc: 'Azadirachta indica — the village pharmacy. Leaves, bark, oil, and seeds all have medicinal uses. Natural pesticide, air purifier, and traditional dentifrice.',
        short: 'Village pharmacy · Pesticide · Air purifier · 100+ medicinal uses',
        base: 199, sale: 149,
        tags: ['outdoor','medicinal','neem','ayurvedic','pesticide'],
        rating: 4.8, reviews: 2341, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600',
      },
      {
        name: 'Peppermint (Mentha Piperita)', slug: 'peppermint-mentha-piperita',
        catSlug: 'medicinal', featured: false,
        desc: 'Mentha × piperita with intensely refreshing fragrance. Use fresh leaves in tea, chutneys, and cocktails. Natural insect repellent — keeps ants, aphids, and mosquitoes away.',
        short: 'Refreshing fragrance · Tea · Insect repellent · Kitchen herb',
        base: 99, sale: 79,
        tags: ['outdoor','indoor','medicinal','culinary','insect-repellent','mint'],
        rating: 4.8, reviews: 2987, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600',
      },
      {
        name: 'Lemongrass (Cymbopogon)', slug: 'lemongrass-cymbopogon',
        catSlug: 'medicinal', featured: false,
        desc: 'Cymbopogon citratus with long, aromatic leaves. Indispensable in Southeast Asian cooking and herbal teas. Repels mosquitoes naturally — the plant version of citronella.',
        short: 'Mosquito repellent · Tea · Cooking · Citrus fragrance',
        base: 129, sale: 99,
        tags: ['outdoor','medicinal','culinary','mosquito-repellent','lemongrass'],
        rating: 4.8, reviews: 2134, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1603046891744-56d3a5b8e8e5?w=600',
      },
      {
        name: 'Stevia (Natural Sweetener)', slug: 'stevia-natural-sweetener',
        catSlug: 'medicinal', featured: false,
        desc: 'Stevia rebaudiana — 200 times sweeter than sugar with zero calories. A diabetic-friendly natural sweetener you can grow at home. Add fresh leaves directly to teas.',
        short: '200x sweeter than sugar · Zero calories · Diabetic friendly · Tea',
        base: 149, sale: 119,
        tags: ['outdoor','medicinal','diabetic-friendly','sweetener','stevia'],
        rating: 4.7, reviews: 1234, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600',
      },
      {
        name: 'Brahmi (Bacopa Monnieri)', slug: 'brahmi-bacopa-monnieri',
        catSlug: 'medicinal', featured: false,
        desc: 'Bacopa monnieri — the brain tonic of Ayurveda. Used for centuries to enhance memory and cognitive function. Grows as a ground cover, ideal for ponds and wet areas.',
        short: 'Brain tonic · Memory booster · Ayurvedic · Aquatic/wet ground',
        base: 129, sale: 99,
        tags: ['outdoor','medicinal','ayurvedic','brain-tonic','brahmi'],
        rating: 4.6, reviews: 987, weight: 0.15,
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600',
      },
      {
        name: 'Giloy (Guduchi Tinospora)', slug: 'giloy-guduchi-tinospora',
        catSlug: 'medicinal', featured: false,
        desc: 'Tinospora cordifolia — Ayurveda\'s "root of immortality". A powerful immunity booster and anti-inflammatory that became a household name during Covid. Easy to grow as a climber.',
        short: 'Immunity booster · Anti-inflammatory · Covid hero · Climbing vine',
        base: 129, sale: 99,
        tags: ['outdoor','medicinal','immunity','ayurvedic','giloy','climbing'],
        rating: 4.8, reviews: 3456, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600',
      },
      {
        name: 'Pudina (Indian Mint)', slug: 'pudina-indian-mint',
        catSlug: 'medicinal', featured: false,
        desc: 'Mentha spicata — spearmint in Indian kitchens. Essential for making fresh chutney, raita, and lemonade. Spreads vigorously in containers. Relieves indigestion naturally.',
        short: 'Chutney essential · Raita · Indigestion relief · Spreads fast',
        base: 79, sale: 59,
        tags: ['outdoor','indoor','medicinal','culinary','mint','kitchen'],
        rating: 4.9, reviews: 4321, weight: 0.1,
        image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600',
      },

      // ── Fruit Plants (10) ─────────────────────────────────────────────────
      {
        name: 'Dwarf Lemon Tree (Nimbu)', slug: 'dwarf-lemon-tree-nimbu',
        catSlug: 'fruit-plants', featured: true,
        desc: 'Citrus limon dwarf variety that fruits prolifically in pots. Produces full-sized, juicy lemons year-round. Fragrant white blossoms perfume the entire garden. Perfect for terrace gardens.',
        short: 'Year-round lemons · Fragrant flowers · Pot-friendly · Terrace garden',
        base: 399, sale: 299,
        tags: ['outdoor','fruit','citrus','terrace-garden','pot-friendly','lemon'],
        rating: 4.8, reviews: 2341, weight: 0.8,
        image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600',
      },
      {
        name: 'Strawberry Plant (Fragaria)', slug: 'strawberry-plant-fragaria',
        catSlug: 'fruit-plants', featured: true,
        desc: 'Fragaria × ananassa everbearing variety. Produces sweet strawberries in cooler months (Oct–Feb) on a terrace or balcony. Sends out runners for easy propagation.',
        short: 'Home-grown strawberries · Balcony/terrace · Everbearing · Sweet',
        base: 199, sale: 149,
        tags: ['outdoor','fruit','terrace','balcony','strawberry','everbearing'],
        rating: 4.7, reviews: 2987, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600',
      },
      {
        name: 'Dwarf Guava (Amrood)', slug: 'dwarf-guava-amrood',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Psidium guajava dwarf variety that fruits within 2 years. Rich in Vitamin C — one guava provides 4x your daily requirement. Fruits in pots on terraces across India.',
        short: 'Vitamin C powerhouse · Fruits in 2 years · Pot-friendly · Nutritious',
        base: 349, sale: 249,
        tags: ['outdoor','fruit','pot-friendly','vitamin-c','guava'],
        rating: 4.7, reviews: 1543, weight: 0.7,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
      },
      {
        name: 'Pomegranate Plant (Anar)', slug: 'pomegranate-plant-anar',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Punica granatum with ornamental orange-red flowers followed by jewel-like fruits. Rich in antioxidants. A drought-tolerant fruit tree that thrives in hot Indian summers.',
        short: 'Antioxidant superfruit · Drought tolerant · Ornamental flowers',
        base: 399, sale: 299,
        tags: ['outdoor','fruit','antioxidant','drought-tolerant','pomegranate'],
        rating: 4.7, reviews: 1234, weight: 0.8,
        image: 'https://images.unsplash.com/photo-1615485020878-06ad23e78c10?w=600',
      },
      {
        name: 'Dragon Fruit Cactus', slug: 'dragon-fruit-cactus',
        catSlug: 'fruit-plants', featured: true,
        desc: 'Hylocereus undatus — grow your own exotic dragon fruit! Stunning nocturnal white flowers followed by hot pink fruits. A climbing cactus that fruits within 2 years of planting.',
        short: 'Exotic dragon fruit · Stunning night flowers · 2-year fruiting · Climbing',
        base: 449, sale: 349,
        tags: ['outdoor','fruit','exotic','cactus','climbing','dragon-fruit'],
        rating: 4.7, reviews: 1876, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=600',
      },
      {
        name: 'Dwarf Papaya (Papita)', slug: 'dwarf-papaya-papita',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Carica papaya dwarf hybrid that fruits in just 8-10 months. Rich in papain enzyme for digestion, Vitamin A and C. A fast-fruiting tree perfect for small gardens.',
        short: 'Fruits in 8-10 months · Rich in Vitamin A & C · Fast growing',
        base: 199, sale: 149,
        tags: ['outdoor','fruit','fast-fruiting','vitamin-a','papaya'],
        rating: 4.6, reviews: 1123, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=600',
      },
      {
        name: 'Mulberry Plant (Shahtoot)', slug: 'mulberry-plant-shahtoot',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Morus alba — the beloved Shahtoot. Sweet, juicy berries loved by children. Fast-growing tree that can be kept compact in a pot. Fruits within the first year of planting.',
        short: 'Kids favorite · First year fruiting · Sweet berries · Fast growing',
        base: 349, sale: 279,
        tags: ['outdoor','fruit','kids','fast-growing','mulberry'],
        rating: 4.7, reviews: 987, weight: 0.6,
        image: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=600',
      },
      {
        name: 'Fig Plant (Anjeer)', slug: 'fig-plant-anjeer',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Ficus carica — the ancient fruit beloved in Indian households. Nutritious figs rich in fibre and minerals. A deciduous tree that produces two crops per year in Indian conditions.',
        short: 'Two crops/year · High fibre · Ancient fruit · Nutritious',
        base: 449, sale: 349,
        tags: ['outdoor','fruit','nutritious','high-fibre','fig'],
        rating: 4.6, reviews: 876, weight: 0.7,
        image: 'https://images.unsplash.com/photo-1603046891744-56d3a5b8e8e5?w=600',
      },
      {
        name: 'Amla Tree (Indian Gooseberry)', slug: 'amla-tree-indian-gooseberry',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Phyllanthus emblica — the Vitamin C champion with 20x more Vitamin C than an orange. The most important fruit in Ayurveda, used in Chyawanprash and hair oil.',
        short: '20x Vitamin C · Chyawanprash ingredient · Hair growth · Ayurvedic',
        base: 299, sale: 229,
        tags: ['outdoor','fruit','medicinal','vitamin-c','ayurvedic','amla'],
        rating: 4.8, reviews: 1543, weight: 0.5,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
      },
      {
        name: 'Curry Leaf Plant (Small)', slug: 'curry-leaf-plant-small',
        catSlug: 'fruit-plants', featured: false,
        desc: 'Murraya koenigii in compact size — perfect for kitchen windowsills and small pots. Harvest fresh curry leaves daily. A must-have for authentic South Indian and Maharashtrian cooking.',
        short: 'Kitchen windowsill · Daily harvest · South Indian cooking · Compact',
        base: 129, sale: 99,
        tags: ['outdoor','indoor','fruit','culinary','kitchen','curry-leaf'],
        rating: 4.9, reviews: 3456, weight: 0.2,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      },

      // ── XL Plants (10) ────────────────────────────────────────────────────
      {
        name: 'Fiddle Leaf Fig (XL)', slug: 'fiddle-leaf-fig-xl',
        catSlug: 'xl-plants', featured: true,
        desc: 'Ficus lyrata — the undisputed king of interior plants. Large, violin-shaped leaves make an unmatched design statement in living rooms. Arrives at 90-120cm, grows up to 3 meters indoors.',
        short: '90-120cm on arrival · Design icon · Living room statement · Trendsetter',
        base: 1999, sale: 1499,
        tags: ['indoor','xl','statement-plant','fiddle-leaf-fig','design','premium'],
        rating: 4.7, reviews: 876, weight: 5.0,
        image: 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600',
      },
      {
        name: 'Monstera Deliciosa (XL)', slug: 'monstera-deliciosa-xl',
        catSlug: 'xl-plants', featured: true,
        desc: 'Monstera deliciosa fully mature plant with multiple fenestrated leaves. An established specimen that transforms immediately — no waiting for it to grow. Arrives at 80-100cm.',
        short: 'Mature specimen · 80-100cm · Iconic holes · Immediate impact',
        base: 2499, sale: 1999,
        tags: ['indoor','xl','statement-plant','monstera','established','premium'],
        rating: 4.9, reviews: 1234, weight: 6.0,
        image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600',
      },
      {
        name: 'XL Areca Palm', slug: 'xl-areca-palm',
        catSlug: 'xl-plants', featured: false,
        desc: 'Dypsis lutescens large specimen at 120-150cm — the perfect natural room divider. Creates an instant tropical ambiance. The best humidifying indoor plant available.',
        short: '120-150cm · Room divider · Natural humidifier · Tropical feel',
        base: 1999, sale: 1699,
        tags: ['indoor','xl','palm','tropical','humidifier','room-divider'],
        rating: 4.6, reviews: 634, weight: 8.0,
        image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600',
      },
      {
        name: 'Bamboo Lucky Plant (XL)', slug: 'bamboo-lucky-plant-xl',
        catSlug: 'xl-plants', featured: false,
        desc: 'Dracaena sanderiana in large, elaborate woven arrangements. A feng shui and Vastu favourite — said to attract good luck, wealth, and positive energy. Can grow in water or soil.',
        short: 'Feng shui · Vastu · Lucky gift · Grows in water · Corporate gift',
        base: 799, sale: 649,
        tags: ['indoor','xl','lucky','feng-shui','vastu','gifting','bamboo'],
        rating: 4.7, reviews: 1876, weight: 2.0,
        image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600',
      },
      {
        name: 'Giant Elephant Ear (Alocasia)', slug: 'giant-elephant-ear-alocasia',
        catSlug: 'xl-plants', featured: false,
        desc: 'Alocasia macrorrhiza with impossibly large, arrow-shaped leaves that can reach 90cm long. A true conversation starter that creates an instant tropical forest feel indoors.',
        short: '90cm leaves · Tropical forest feel · Dramatic · Statement',
        base: 1499, sale: 1199,
        tags: ['indoor','xl','tropical','statement-plant','alocasia','dramatic'],
        rating: 4.6, reviews: 543, weight: 7.0,
        image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600',
      },
      {
        name: 'XL Snake Plant (Moonshine)', slug: 'xl-snake-plant-moonshine',
        catSlug: 'xl-plants', featured: false,
        desc: 'Sansevieria trifasciata Moonshine — large specimen at 70-90cm with silvery-green sword-like leaves. A bold, architectural air purifier that releases oxygen through the night.',
        short: '70-90cm · Silver-green · Night oxygen · Architectural · Air purifying',
        base: 899, sale: 699,
        tags: ['indoor','xl','air-purifying','architectural','snake-plant','bedroom'],
        rating: 4.8, reviews: 987, weight: 4.0,
        image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600',
      },
      {
        name: 'Dracaena Massangeana (Corn Plant)', slug: 'dracaena-massangeana-corn-plant',
        catSlug: 'xl-plants', featured: false,
        desc: 'Dracaena fragrans Massangeana with a thick cane trunk and broad, arching yellow-striped leaves. Provides a tropical, lush look with minimal care. One of the top NASA plants.',
        short: 'Cane trunk · Yellow stripes · NASA air purifier · Low care · XL',
        base: 1299, sale: 999,
        tags: ['indoor','xl','air-purifying','tropical','dracaena','nasa'],
        rating: 4.6, reviews: 634, weight: 6.0,
        image: 'https://images.unsplash.com/photo-1607931819065-b8a73f6a0b5c?w=600',
      },
      {
        name: 'Travellers Palm (Ravenala)', slug: 'travellers-palm-ravenala',
        catSlug: 'xl-plants', featured: false,
        desc: 'Ravenala madagascariensis — the iconic fan palm that\'s not actually a palm. Paddle-shaped leaves arranged in a perfect fan. A majestic focal plant for large gardens and hotel lobbies.',
        short: 'Majestic fan shape · Iconic tropical · Hotel lobby look · Focal point',
        base: 2999, sale: 2499,
        tags: ['outdoor','xl','tropical','statement-plant','ravenala','architectural'],
        rating: 4.7, reviews: 345, weight: 15.0,
        image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600',
      },
      {
        name: 'XL Rubber Plant (Ficus Burgundy)', slug: 'xl-rubber-plant-ficus-burgundy',
        catSlug: 'xl-plants', featured: false,
        desc: 'Ficus elastica Burgundy at 80-100cm with large, glossy burgundy-black leaves. One of the most dramatic indoor trees. Extremely forgiving and tolerates low light surprisingly well.',
        short: '80-100cm · Burgundy-black leaves · Dramatic · Forgiving · Low light ok',
        base: 1499, sale: 1199,
        tags: ['indoor','xl','air-purifying','statement-plant','ficus','burgundy'],
        rating: 4.7, reviews: 765, weight: 5.0,
        image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600',
      },
      {
        name: 'Giant Bird of Paradise (XL)', slug: 'giant-bird-of-paradise-xl',
        catSlug: 'xl-plants', featured: true,
        desc: 'Strelitzia nicolai at 100-120cm — the white bird of paradise with enormous paddle leaves. Creates instant tropical drama in any room. A fixture in luxury interiors worldwide.',
        short: '100-120cm · Paddle leaves · Luxury interiors · Tropical drama',
        base: 2999, sale: 2499,
        tags: ['indoor','xl','tropical','statement-plant','strelitzia','luxury','premium'],
        rating: 4.8, reviews: 543, weight: 10.0,
        image: 'https://images.unsplash.com/photo-1597305877032-0668b3c6413a?w=600',
      },
    ];

    const productRows = plants.map(p => ({
      name:              p.name,
      slug:              p.slug,
      description:       p.desc,
      short_description: p.short,
      category_id:       cid(p.catSlug),
      brand_id:          brandId,
      status:            'active',
      is_featured:       p.featured ? 1 : 0,
      is_digital:        0,
      has_variants:      p.catSlug === 'xl-plants' ? 0 : 1,
      base_price:        p.base,
      sale_price:        p.sale,
      tax_rate:          5,
      tags:              JSON.stringify(p.tags),
      weight:            p.weight,
      review_count:      p.reviews,
      rating:            p.rating,
      created_by:        adminId,
      vendor_id:         null,
      created_at:        now,
      updated_at:        now,
    }));

    await queryInterface.bulkInsert('products', productRows, {});

    const [allProds] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products WHERE slug IN (${plants.map(p => `'${p.slug}'`).join(',')}) ORDER BY id`
    );
    const pid = s => allProds.find(p => p.slug === s)?.id;

    // ── 5. Variants ──────────────────────────────────────────────────────────
    // XL plants: 1 variant. Others: Small (4"), Medium (6"), Large (8") pot sizes.
    const variants = [];

    for (const p of plants) {
      const productId = pid(p.slug);
      if (!productId) continue;

      if (p.catSlug === 'xl-plants') {
        // Single size for XL
        variants.push({
          product_id: productId,
          sku:        `LG-${p.slug.toUpperCase().substring(0, 20)}-XL`.replace(/-{2,}/g, '-'),
          name:       'XL (12" Pot)',
          price:      p.base,
          sale_price: p.sale,
          attributes: JSON.stringify({ pot_size: '12"' }),
          weight:     p.weight,
          image:      null,
          sort_order: 0,
          is_active:  1,
          created_at: now, updated_at: now,
        });
      } else if (p.catSlug === 'seeds' || p.catSlug === 'medicinal') {
        // Single pack size
        const skuBase = `LG-${p.slug.substring(0, 18).toUpperCase()}`.replace(/-{2,}/g, '-');
        variants.push({
          product_id: productId,
          sku:        `${skuBase}-S`,
          name:       'Small (4" Pot)',
          price:      p.base,
          sale_price: p.sale,
          attributes: JSON.stringify({ pot_size: '4"' }),
          weight:     p.weight,
          image:      null,
          sort_order: 0,
          is_active:  1,
          created_at: now, updated_at: now,
        });
        variants.push({
          product_id: productId,
          sku:        `${skuBase}-M`,
          name:       'Medium (6" Pot)',
          price:      Math.round(p.base * 1.6),
          sale_price: Math.round(p.sale * 1.6),
          attributes: JSON.stringify({ pot_size: '6"' }),
          weight:     p.weight * 1.5,
          image:      null,
          sort_order: 1,
          is_active:  1,
          created_at: now, updated_at: now,
        });
      } else {
        // 3 pot sizes: Small, Medium, Large
        const skuBase = `LG-${p.slug.substring(0, 16).toUpperCase()}`.replace(/-{2,}/g, '-');
        const sizes = [
          { label: 'Small (4" Pot)',  suffix: 'S', mult: 1.0,  potSize: '4"'  },
          { label: 'Medium (6" Pot)', suffix: 'M', mult: 1.6,  potSize: '6"'  },
          { label: 'Large (8" Pot)',  suffix: 'L', mult: 2.2,  potSize: '8"'  },
        ];
        for (const [i, size] of sizes.entries()) {
          variants.push({
            product_id: productId,
            sku:        `${skuBase}-${size.suffix}`,
            name:       size.label,
            price:      Math.round(p.base * size.mult),
            sale_price: Math.round(p.sale * size.mult),
            attributes: JSON.stringify({ pot_size: size.potSize }),
            weight:     p.weight * size.mult,
            image:      null,
            sort_order: i,
            is_active:  1,
            created_at: now, updated_at: now,
          });
        }
      }
    }

    await queryInterface.bulkInsert('product_variants', variants, {});

    const [variantRows] = await queryInterface.sequelize.query(
      `SELECT id, sku FROM product_variants WHERE sku LIKE 'LG-%' ORDER BY id`
    );

    // ── 6. Product Images ─────────────────────────────────────────────────────
    const imageRows = plants.map(p => ({
      product_id: pid(p.slug),
      url:        p.image,
      alt:        p.name,
      is_primary: 1,
      sort_order: 0,
    }));
    // Add a secondary shot for featured plants
    const secondaryImages = plants
      .filter(p => p.featured)
      .map(p => ({
        product_id: pid(p.slug),
        url:        p.image.replace('?w=600', '?w=600&h=600&fit=crop&auto=format'),
        alt:        `${p.name} in pot`,
        is_primary: 0,
        sort_order: 1,
      }));

    await queryInterface.bulkInsert('product_images', [...imageRows, ...secondaryImages], {});

    // ── 7. Inventory ──────────────────────────────────────────────────────────
    const inventoryRows = variantRows.map(v => ({
      variant_id:          v.id,
      warehouse_id:        'default',
      qty_on_hand:         20 + Math.floor(Math.random() * 80),
      qty_reserved:        0,
      low_stock_threshold: 3,
      created_at:          now,
      updated_at:          now,
    }));
    await queryInterface.bulkInsert('inventory', inventoryRows, {});

    // ── 8. Plant Care Banners ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('banners', [
      {
        title: 'India\'s Premium Plant Store', subtitle: 'Shop 500+ varieties, delivered with care',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200',
        mobil_image: null, link: '/products?category=plants',
        cta_label: 'Shop Plants', position: 'hero', is_active: true, sort_order: 3,
        start_date: null, end_date: null, bg_color: '#1e3a23', created_at: now, updated_at: now,
      },
      {
        title: 'Monstera & Tropical Plants', subtitle: 'Starting ₹449 — Free delivery above ₹499',
        image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=1200',
        mobil_image: null, link: '/products?category=indoor-plants',
        cta_label: 'Explore Indoors', position: 'hero', is_active: true, sort_order: 4,
        start_date: null, end_date: null, bg_color: '#2d3d1e', created_at: now, updated_at: now,
      },
      {
        title: 'Medicinal & Kitchen Herbs', subtitle: 'Tulsi, Curry Leaf, Mint & more',
        image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=1200',
        mobil_image: null, link: '/products?category=medicinal',
        cta_label: 'Shop Herbs', position: 'mid', is_active: true, sort_order: 1,
        start_date: null, end_date: null, bg_color: '#1e3a23', created_at: now, updated_at: now,
      },
    ], {});

    // ── 9. Blog posts ──────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('blog_posts', [
      {
        title: '10 Best Indoor Plants for Indian Homes', slug: 'best-indoor-plants-india',
        excerpt: 'From Money Plant to Monstera — the perfect plants for every Indian home, climate, and lifestyle.',
        content: '<h2>Why Indoor Plants?</h2><p>Indoor plants improve air quality, reduce stress, and add natural beauty to your home...</p>',
        cover_image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800',
        author_id: adminId, status: 'published',
        tags: JSON.stringify(['indoor-plants','india','home-decor','air-purifying']),
        published_at: now, meta_title: '10 Best Indoor Plants for Indian Homes | Lagaao',
        meta_description: 'Discover the best indoor plants for Indian homes — easy to care for, air purifying and beautiful.',
        view_count: 0, created_at: now, updated_at: now,
      },
      {
        title: 'How to Care for Succulents in Indian Summer', slug: 'succulent-care-indian-summer',
        excerpt: 'Succulents are perfect for India\'s dry climate — but even they need special care during peak summer.',
        content: '<h2>Succulent Summer Care</h2><p>The key is to reduce watering during the hottest months...</p>',
        cover_image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
        author_id: adminId, status: 'published',
        tags: JSON.stringify(['succulents','summer-care','india','beginner']),
        published_at: now, meta_title: 'Succulent Care in Indian Summer | Lagaao Blog',
        meta_description: 'Essential tips for keeping your succulents thriving through India\'s hot summer.',
        view_count: 0, created_at: now, updated_at: now,
      },
      {
        title: 'Grow These 5 Fruits on Your Mumbai Terrace', slug: 'fruit-plants-mumbai-terrace',
        excerpt: 'Yes, you can grow lemons, strawberries, and even dragon fruit on a Mumbai balcony or terrace.',
        content: '<h2>Terrace Fruit Gardening in Mumbai</h2><p>Space is no constraint when you have the right dwarf varieties...</p>',
        cover_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
        author_id: adminId, status: 'published',
        tags: JSON.stringify(['fruit-plants','terrace-garden','mumbai','balcony']),
        published_at: now, meta_title: 'Grow Fruits on Your Terrace in Mumbai | Lagaao',
        meta_description: 'Discover which fruit plants thrive in Mumbai terrace gardens.',
        view_count: 0, created_at: now, updated_at: now,
      },
      {
        title: 'Medicinal Plants Every Indian Home Should Have', slug: 'medicinal-plants-every-home',
        excerpt: 'From Tulsi to Giloy — ancient Ayurvedic plants that protect your family\'s health.',
        content: '<h2>The Home Pharmacy</h2><p>Before modern medicine, Indian homes relied on medicinal plants...</p>',
        cover_image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        author_id: adminId, status: 'published',
        tags: JSON.stringify(['medicinal','tulsi','ayurveda','giloy','neem']),
        published_at: now, meta_title: 'Medicinal Plants Every Indian Home Needs | Lagaao',
        meta_description: 'The essential medicinal plants for your Indian home — Tulsi, Neem, Giloy and more.',
        view_count: 0, created_at: now, updated_at: now,
      },
      {
        title: 'Announcement bar plant discount',
        slug: 'announcement-green-friday',
        excerpt: 'Green Friday — our biggest plant sale of the year.',
        content: '<p>Celebrate nature with 20% off all plants this weekend.</p>',
        cover_image: null,
        author_id: adminId, status: 'draft',
        tags: JSON.stringify(['sale','discount']),
        published_at: null, meta_title: null, meta_description: null,
        view_count: 0, created_at: now, updated_at: now,
      },
    ], {});

    // ── 10. Update announcement for plants ────────────────────────────────────
    await queryInterface.bulkInsert('announcements', [
      {
        message: '🌿 Free delivery on all plant orders above ₹499 — Use code PLANT10 for 10% off!',
        type: 'promo', link: '/products?category=plants', link_label: 'Shop Plants',
        is_active: true, expires_at: null,
        created_at: now, updated_at: now,
      },
    ], {});

    // ── 11. Plant coupons ─────────────────────────────────────────────────────
    const couponExpiry = new Date(now);
    couponExpiry.setMonth(couponExpiry.getMonth() + 6);

    await queryInterface.bulkInsert('coupons', [
      {
        code: 'PLANT10', type: 'percent', value: 10, min_order_value: 299.00,
        max_discount: 300.00, max_uses: 5000, used_count: 0, max_uses_per_user: 2,
        expires_at: couponExpiry, is_active: true,
        created_at: now, updated_at: now,
      },
      {
        code: 'FIRSTPLANT', type: 'fixed', value: 100, min_order_value: 349.00,
        max_discount: 100.00, max_uses: 1000, used_count: 0, max_uses_per_user: 1,
        expires_at: couponExpiry, is_active: true,
        created_at: now, updated_at: now,
      },
      {
        code: 'GARDEN20', type: 'percent', value: 20, min_order_value: 999.00,
        max_discount: 500.00, max_uses: 2000, used_count: 0, max_uses_per_user: 1,
        expires_at: couponExpiry, is_active: true,
        created_at: now, updated_at: now,
      },
    ], {});

    console.log('✅ Plants seed complete — 100 plants across 10 categories');
    console.log('   Categories: Indoor, Outdoor, Flowering, Succulents, Medicinal, Fruit,');
    console.log('               Air Purifying, XL Plants, Pet Friendly, Low Maintenance');
    console.log('   Variants:   ~230 (3 pot sizes per plant, single for XL)');
    console.log('   Coupons:    PLANT10 | FIRSTPLANT | GARDEN20');
  },

  async down(queryInterface) {
    // Remove in reverse FK order
    await queryInterface.sequelize.query(
      `DELETE FROM inventory WHERE variant_id IN (SELECT id FROM product_variants WHERE sku LIKE 'LG-%')`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE brand_id IN (SELECT id FROM brands WHERE slug = 'lagaao-nursery'))`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM product_variants WHERE sku LIKE 'LG-%'`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM products WHERE brand_id IN (SELECT id FROM brands WHERE slug = 'lagaao-nursery')`
    );
    await queryInterface.bulkDelete('brands', { slug: 'lagaao-nursery' }, {});
    const plantSlugs = ['plants','indoor-plants','outdoor-plants','flowering-plants','succulents',
      'medicinal','fruit-plants','air-purifying','xl-plants','pet-friendly','low-maintenance',
      'seeds','pots-planters','plant-care','gifts-combos','new-arrivals'];
    await queryInterface.sequelize.query(
      `DELETE FROM categories WHERE slug IN (${plantSlugs.map(s => `'${s}'`).join(',')})`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM coupons WHERE code IN ('PLANT10','FIRSTPLANT','GARDEN20')`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM announcements WHERE message LIKE '%PLANT10%'`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM blog_posts WHERE slug IN ('best-indoor-plants-india','succulent-care-indian-summer','fruit-plants-mumbai-terrace','medicinal-plants-every-home','announcement-green-friday')`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM banners WHERE cta_label IN ('Shop Plants','Explore Indoors','Shop Herbs')`
    );
  },
};
