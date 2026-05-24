'use strict';

/**
 * 200 additional plants — batch 2 (SKU prefix LG2-)
 * Covers: indoor, outdoor, flowering, succulents, medicinal, fruit,
 *         xl-plants, air-purifying, pet-friendly, low-maintenance,
 *         seeds, pots-planters, plant-care, gifts-combos
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [catRows] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories ORDER BY id`
    );
    const cid = s => catRows.find(c => c.slug === s)?.id;

    const [brandRows] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM brands WHERE slug = 'lagaao-nursery' LIMIT 1`
    );
    const brandId = brandRows[0].id;

    const [[adminRow]] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@lagaao.com' LIMIT 1`
    );
    const adminId = adminRow?.id ?? null;

    // ── Plants data ──────────────────────────────────────────────────────────
    const plants = [
      // ── Indoor Plants ──────────────────────────────────────────────────────
      { name: 'Pothos Neon (Neon Pothos)', slug: 'pothos-neon', catSlug: 'indoor-plants', featured: false, desc: 'Epipremnum aureum "Neon" with bright chartreuse-yellow leaves. Fast-growing trailing plant that adds a pop of color to any shelf.', short: 'Vibrant neon leaves · Fast growing · Low light', base: 179, sale: 129, tags: ['indoor','trailing','neon','pothos'], rating: 4.7, reviews: 1234, weight: 0.3, image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600' },
      { name: 'Syngonium White Butterfly', slug: 'syngonium-white-butterfly', catSlug: 'indoor-plants', featured: false, desc: 'Syngonium podophyllum "Pink Allusion" with soft pink and green arrowhead-shaped leaves. Compact grower, perfect for desktops.', short: 'Pink foliage · Compact · Easy care', base: 249, sale: 179, tags: ['indoor','pink','compact','syngonium'], rating: 4.6, reviews: 987, weight: 0.3, image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600' },
      { name: 'Calathea Orbifolia', slug: 'calathea-orbifolia', catSlug: 'indoor-plants', featured: true, desc: 'Stunning Calathea with large round leaves featuring silver-green striped patterns. A true statement plant for shaded corners.', short: 'Stunning patterned leaves · Shade lover · Pet safe', base: 599, sale: 449, tags: ['indoor','calathea','patterned','pet-safe'], rating: 4.5, reviews: 756, weight: 0.5, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Tradescantia Zebrina (Spiderwort)', slug: 'tradescantia-zebrina', catSlug: 'indoor-plants', featured: false, desc: 'Striking silver-purple striped leaves that shimmer in the light. A fast-growing trailing plant for hanging baskets.', short: 'Metallic striped leaves · Trailing · Fast growing', base: 149, sale: 99, tags: ['indoor','trailing','purple','silver'], rating: 4.6, reviews: 845, weight: 0.2, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600' },
      { name: 'Dracaena Marginata (Dragon Tree)', slug: 'dracaena-marginata', catSlug: 'indoor-plants', featured: false, desc: 'Slender, arching green and red-edged leaves on a dramatic cane stem. One of NASA\'s top air-purifying plants.', short: 'Dramatic form · Air purifying · Low water', base: 499, sale: 349, tags: ['indoor','air-purifying','drought-tolerant','dracaena'], rating: 4.7, reviews: 1123, weight: 0.6, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600' },
      { name: 'Maidenhair Fern (Adiantum)', slug: 'maidenhair-fern-adiantum', catSlug: 'indoor-plants', featured: false, desc: 'Lush, arching fronds make the Boston Fern a classic hanging plant. Excellent at removing formaldehyde from air.', short: 'Lush fronds · Hanging · Air purifying', base: 299, sale: 199, tags: ['indoor','fern','hanging','air-purifying'], rating: 4.5, reviews: 934, weight: 0.4, image: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=600' },
      { name: 'Anthurium (Flamingo Flower)', slug: 'anthurium-flamingo', catSlug: 'indoor-plants', featured: true, desc: 'Bright red waxy spathes that last for months. Anthurium andraeanum is a popular gifting plant that blooms year-round indoors.', short: 'Long-lasting red blooms · Year-round flowering', base: 449, sale: 329, tags: ['indoor','flowering','red','anthurium'], rating: 4.7, reviews: 1567, weight: 0.4, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Strelitzia Nicolai (White Bird of Paradise)', slug: 'strelitzia-nicolai-white', catSlug: 'indoor-plants', featured: true, desc: 'Large paddle-shaped leaves that create a tropical statement. Strelitzia reginae eventually blooms with stunning orange and purple flowers.', short: 'Tropical statement · Large leaves · Dramatic', base: 799, sale: 599, tags: ['indoor','tropical','statement','xl'], rating: 4.8, reviews: 678, weight: 1.2, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Peperomia Obtusifolia (Baby Rubber Plant)', slug: 'peperomia-obtusifolia', catSlug: 'indoor-plants', featured: false, desc: 'Peperomia argyreia with striped watermelon-patterned leaves. A compact, easy-care plant that thrives on neglect.', short: 'Watermelon pattern · Compact · Drought tolerant', base: 199, sale: 149, tags: ['indoor','compact','patterned','peperomia'], rating: 4.7, reviews: 1089, weight: 0.2, image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600' },
      { name: 'Pothos Marble Queen', slug: 'pothos-marble-queen', catSlug: 'indoor-plants', featured: false, desc: 'Stunning white-and-green variegated Pothos with a marbled appearance. Slower growing than golden pothos but equally hardy.', short: 'White variegation · Easy care · Trailing', base: 199, sale: 149, tags: ['indoor','variegated','trailing','pothos'], rating: 4.8, reviews: 1345, weight: 0.3, image: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600' },
      { name: 'String of Pearls (Senecio)', slug: 'string-of-pearls-senecio', catSlug: 'indoor-plants', featured: true, desc: 'Cascading strings of round, bead-like leaves. Senecio rowleyanus is a unique succulent-like plant perfect for hanging pots.', short: 'Unique bead-like leaves · Hanging · Succulent-like', base: 299, sale: 219, tags: ['indoor','hanging','unique','succulent'], rating: 4.6, reviews: 891, weight: 0.2, image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600' },
      { name: 'Cast Iron Plant (Aspidistra)', slug: 'cast-iron-plant-aspidistra', catSlug: 'indoor-plants', featured: false, desc: 'Lives up to its name — virtually indestructible. Aspidistra elatior tolerates dust, neglect, deep shade, and cold. Perfect for dark corners.', short: 'Indestructible · Deep shade · Very low maintenance', base: 349, sale: 269, tags: ['indoor','low-light','tough','shade'], rating: 4.9, reviews: 567, weight: 0.5, image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600' },
      { name: 'Chinese Money Plant (Pilea)', slug: 'chinese-money-plant-pilea', catSlug: 'indoor-plants', featured: false, desc: 'Pilea peperomioides with distinctive round, pancake-shaped leaves on long stems. Produces plenty of pups (offshoots) to share.', short: 'Pancake leaves · Produces pups · Trendy', base: 249, sale: 179, tags: ['indoor','trendy','pilea','round-leaves'], rating: 4.7, reviews: 1123, weight: 0.3, image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600' },
      { name: 'Dieffenbachia Camilla (Snow White)', slug: 'dieffenbachia-camilla', catSlug: 'indoor-plants', featured: false, desc: 'Large patterned green and white leaves. Dieffenbachia thrives in office and home environments with indirect light.', short: 'Large patterned leaves · Office plant · Bold', base: 399, sale: 299, tags: ['indoor','office-plant','patterned','tropical'], rating: 4.5, reviews: 756, weight: 0.5, image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600' },

      // ── Outdoor Plants ─────────────────────────────────────────────────────
      { name: 'Bougainvillea Purple (Spectabilis)', slug: 'bougainvillea-purple', catSlug: 'outdoor-plants', featured: true, desc: 'The queen of Indian gardens. Cascading paper-thin pink bracts cover this vigorous climber. Drought-tolerant once established, blooms all year in warm climates.', short: 'Year-round blooms · Drought tolerant · Climber', base: 299, sale: 219, tags: ['outdoor','flowering','climber','drought-tolerant','bougainvillea'], rating: 4.9, reviews: 2134, weight: 0.5, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },
      { name: 'Hibiscus Red (China Rose)', slug: 'hibiscus-red-china-rose', catSlug: 'outdoor-plants', featured: false, desc: 'Hibiscus rosa-sinensis with bold red blooms. Blooms almost year-round, attracts butterflies and hummingbirds. Used in hair and Ayurvedic remedies.', short: 'Year-round red blooms · Medicinal · Butterfly attractor', base: 199, sale: 149, tags: ['outdoor','flowering','medicinal','hibiscus'], rating: 4.8, reviews: 1678, weight: 0.4, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Ixora (Jungle Geranium)', slug: 'ixora-jungle-geranium', catSlug: 'outdoor-plants', featured: false, desc: 'Dense clusters of small tubular red/orange flowers. Ixora coccinea is a popular hedge and garden plant in India.', short: 'Dense flower clusters · Hedge plant · Butterfly garden', base: 179, sale: 129, tags: ['outdoor','flowering','hedge','butterfly'], rating: 4.6, reviews: 934, weight: 0.4, image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600' },
      { name: 'Plumeria (Champa)', slug: 'plumeria-champa', catSlug: 'outdoor-plants', featured: true, desc: 'Frangipani — the iconic tropical flower. Plumeria rubra with fragrant blooms in white, yellow, pink and red. Sacred in many Indian traditions.', short: 'Fragrant blooms · Sacred flower · Drought tolerant', base: 349, sale: 249, tags: ['outdoor','fragrant','tropical','plumeria'], rating: 4.8, reviews: 1456, weight: 0.6, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600' },
      { name: 'Ashoka Tree (Saraca)', slug: 'ashoka-tree-saraca', catSlug: 'outdoor-plants', featured: false, desc: 'Saraca asoca — the sacred Ashoka tree of India. Gorgeous orange-red flowers, deeply significant in Indian culture and Ayurveda.', short: 'Sacred tree · Orange-red blooms · Medicinal bark', base: 499, sale: 399, tags: ['outdoor','sacred','medicinal','tree'], rating: 4.7, reviews: 456, weight: 1.0, image: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=600' },
      { name: 'Oleander (Kaner)', slug: 'oleander-kaner', catSlug: 'outdoor-plants', featured: false, desc: 'Nerium oleander with clusters of pink or white flowers. Extremely heat and drought-tolerant; popular for roadside and garden planting.', short: 'Heat tolerant · Colorful blooms · Fast growing', base: 199, sale: 149, tags: ['outdoor','drought-tolerant','flowering','heat-tolerant'], rating: 4.5, reviews: 678, weight: 0.5, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Tecoma Stans Pink (Pink Bells)', slug: 'tecoma-stans-pink', catSlug: 'outdoor-plants', featured: false, desc: 'Tecoma stans with trumpet-shaped yellow flowers. Blooms profusely, attracts bees. Great as a hedge or standalone shrub.', short: 'Yellow trumpet blooms · Bee attractor · Fast growing', base: 249, sale: 179, tags: ['outdoor','flowering','yellow','pollinator'], rating: 4.6, reviews: 523, weight: 0.5, image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600' },
      { name: 'Bamboo (Golden Bamboo)', slug: 'bamboo-golden', catSlug: 'outdoor-plants', featured: false, desc: 'Phyllostachys aurea — clumping golden bamboo for privacy screens and tropical gardens. Fast-growing, non-invasive variety.', short: 'Privacy screen · Fast growing · Non-invasive', base: 599, sale: 449, tags: ['outdoor','bamboo','privacy','fast-growing'], rating: 4.7, reviews: 789, weight: 1.5, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Duranta (Sky Flower)', slug: 'duranta-sky-flower', catSlug: 'outdoor-plants', featured: false, desc: 'Duranta erecta with cascading clusters of purple-blue flowers followed by golden berries. Popular hedge and butterfly plant.', short: 'Purple blooms · Golden berries · Hedge plant', base: 179, sale: 129, tags: ['outdoor','hedge','butterfly','purple'], rating: 4.5, reviews: 456, weight: 0.4, image: 'https://images.unsplash.com/photo-1580148051671-7b8d50a90c5c?w=600' },
      { name: 'Bottle Brush (Callistemon)', slug: 'bottle-brush-callistemon', catSlug: 'outdoor-plants', featured: false, desc: 'Callistemon citrinus with spectacular red bottle-brush flower spikes. Attracts birds and bees. Drought-tolerant once established.', short: 'Unique bottle brush flowers · Bird attractor · Drought tolerant', base: 299, sale: 219, tags: ['outdoor','flowering','unique','wildlife'], rating: 4.7, reviews: 612, weight: 0.6, image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600' },
      { name: 'Coral Jasmine (Parijat)', slug: 'coral-jasmine-parijat', catSlug: 'outdoor-plants', featured: true, desc: 'Nyctanthes arbor-tristis — the Night Jasmine sacred in India. Intensely fragrant white flowers with orange stems that fall at dawn.', short: 'Divine fragrance · Night blooming · Sacred tree', base: 349, sale: 249, tags: ['outdoor','fragrant','sacred','night-blooming'], rating: 4.9, reviews: 934, weight: 0.5, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600' },
      { name: 'Lantana (Wild Sage)', slug: 'lantana-wild-sage', catSlug: 'outdoor-plants', featured: false, desc: 'Lantana camara with multicolored flower clusters that change color as they mature. Extremely drought-hardy butterfly magnet.', short: 'Multicolor blooms · Butterfly magnet · Drought hardy', base: 149, sale: 99, tags: ['outdoor','butterfly','drought-tolerant','colorful'], rating: 4.6, reviews: 789, weight: 0.3, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Crossandra (Firecracker Flower)', slug: 'crossandra-firecracker', catSlug: 'outdoor-plants', featured: false, desc: 'Crossandra infundibuliformis — a popular garden plant in South India. Salmon-orange blooms continuously for most of the year.', short: 'Continuous bloomer · Salmon flowers · South Indian favorite', base: 149, sale: 99, tags: ['outdoor','flowering','continuous-bloomer'], rating: 4.7, reviews: 645, weight: 0.3, image: 'https://images.unsplash.com/photo-1601985705806-5b9a291f6b5c?w=600' },

      // ── Flowering Plants ───────────────────────────────────────────────────
      { name: 'Adenium (Desert Rose)', slug: 'adenium-desert-rose', catSlug: 'flowering-plants', featured: true, desc: 'Adenium obesum with striking caudex trunk and brilliant pink/red blooms. A collector\'s plant that blooms multiple times a year.', short: 'Sculptural caudex · Bold blooms · Drought tolerant', base: 499, sale: 379, tags: ['flowering','succulent','exotic','adenium'], rating: 4.8, reviews: 1234, weight: 0.7, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },
      { name: 'Aster (Star Daisy)', slug: 'aster-star-daisy', catSlug: 'flowering-plants', featured: false, desc: 'Aster amellus with cheerful daisy-like flowers in purple, pink and white. Blooms in autumn, attracts butterflies.', short: 'Daisy flowers · Autumn bloomer · Butterfly garden', base: 149, sale: 99, tags: ['flowering','seasonal','butterfly','aster'], rating: 4.5, reviews: 678, weight: 0.2, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Begonia (Wax Begonia)', slug: 'begonia-wax', catSlug: 'flowering-plants', featured: false, desc: 'Begonia semperflorens — continuous flowering in red, pink, and white. Thrives in shade or sun, ideal for beds and pots.', short: 'Year-round flowers · Shade or sun · Low maintenance', base: 129, sale: 89, tags: ['flowering','shade-tolerant','continuous-bloomer'], rating: 4.6, reviews: 912, weight: 0.2, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600' },
      { name: 'Celosia (Cockscomb)', slug: 'celosia-cockscomb', catSlug: 'flowering-plants', featured: false, desc: 'Celosia argentea var. cristata with velvety, brain-like flower heads in vibrant red, orange, yellow. Long-lasting cut flower.', short: 'Unique velvety blooms · Vivid colors · Long-lasting', base: 99, sale: 69, tags: ['flowering','colorful','cut-flower','annual'], rating: 4.5, reviews: 567, weight: 0.2, image: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=600' },
      { name: 'Chrysanthemum (Guldaudi)', slug: 'chrysanthemum-guldaudi', catSlug: 'flowering-plants', featured: true, desc: 'Chrysanthemum morifolium — the autumn queen. Full, pompom-shaped blooms in yellow, white, red, purple. Popular for festivals and gifting.', short: 'Festival flower · Pompon blooms · Seasonal', base: 149, sale: 99, tags: ['flowering','festival','seasonal','chrysanthemum'], rating: 4.7, reviews: 1789, weight: 0.3, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Dianthus (Carnation)', slug: 'dianthus-carnation', catSlug: 'flowering-plants', featured: false, desc: 'Dianthus caryophyllus with fragrant fringed petals. Available in vivid pinks, reds, and whites. Excellent cut flower and pot plant.', short: 'Fragrant · Fringed petals · Cut flower', base: 129, sale: 89, tags: ['flowering','fragrant','cut-flower','dianthus'], rating: 4.6, reviews: 789, weight: 0.2, image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=600' },
      { name: 'Gazania (Treasure Flower)', slug: 'gazania-treasure-flower', catSlug: 'flowering-plants', featured: false, desc: 'Gazania rigens with daisy-like flowers in vibrant orange-yellow with dark markings. Opens in sunlight; very drought tolerant.', short: 'Sun-loving · Vibrant patterns · Drought tolerant', base: 119, sale: 79, tags: ['flowering','sun-loving','drought-tolerant','colorful'], rating: 4.5, reviews: 456, weight: 0.2, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Gerbera Daisy (Transvaal Daisy)', slug: 'gerbera-daisy', catSlug: 'flowering-plants', featured: true, desc: 'Gerbera jamesonii with large, cheerful blooms in every color of the rainbow. One of the top 5 cut flowers worldwide.', short: 'Rainbow colors · Cut flower · Long-lasting blooms', base: 179, sale: 129, tags: ['flowering','cut-flower','colorful','gerbera'], rating: 4.8, reviews: 2134, weight: 0.3, image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600' },
      { name: 'Marigold (African Marigold)', slug: 'marigold-african', catSlug: 'flowering-plants', featured: false, desc: 'Tagetes erecta — the auspicious genda phool of India. Large pompom blooms in gold and orange. Essential for festivals, repels garden pests.', short: 'Festival flower · Pest repellent · Prolific bloomer', base: 79, sale: 49, tags: ['flowering','festival','pest-repellent','marigold'], rating: 4.9, reviews: 3456, weight: 0.2, image: 'https://images.unsplash.com/photo-1580148051671-7b8d50a90c5c?w=600' },
      { name: 'Petunia (Cascade Series)', slug: 'petunia-cascade', catSlug: 'flowering-plants', featured: false, desc: 'Petunia hybrida with abundant trumpet flowers that cascade beautifully from hanging baskets. Available in 20+ colors.', short: 'Cascading blooms · Hanging basket · 20+ colors', base: 99, sale: 69, tags: ['flowering','hanging','cascade','petunia'], rating: 4.7, reviews: 1234, weight: 0.2, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Portulaca Double Mix (Sun Rose)', slug: 'portulaca-double-mix', catSlug: 'flowering-plants', featured: false, desc: 'Portulaca grandiflora — the sun rose that needs almost no care. Semi-succulent stems with silk-textured flowers in every color.', short: 'Nearly zero-care · Jewel colors · Sun lover', base: 79, sale: 49, tags: ['flowering','easy-care','succulent','sun-loving'], rating: 4.8, reviews: 1567, weight: 0.1, image: 'https://images.unsplash.com/photo-1601985705806-5b9a291f6b5c?w=600' },
      { name: 'Vinca (Periwinkle)', slug: 'vinca-periwinkle', catSlug: 'flowering-plants', featured: false, desc: 'Catharanthus roseus with cheerful 5-petaled blooms in pink, white, red and purple. Incredibly heat and drought tolerant.', short: 'Heat proof · Long blooming · Low maintenance', base: 89, sale: 59, tags: ['flowering','heat-tolerant','low-maintenance'], rating: 4.8, reviews: 2341, weight: 0.2, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },

      // ── Succulents ─────────────────────────────────────────────────────────
      { name: 'Echeveria Blue Bird', slug: 'echeveria-blue-bird', catSlug: 'succulents', featured: true, desc: 'Echeveria "Blue Bird" with perfect powdery blue-grey rosettes edged in pink. One of the most sought-after succulent varieties.', short: 'Perfect rosette form · Blue-grey color · Gift worthy', base: 199, sale: 149, tags: ['succulent','echeveria','blue','rosette'], rating: 4.8, reviews: 1456, weight: 0.2, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Haworthia Fasciata (Zebra Plant)', slug: 'haworthia-fasciata-zebra', catSlug: 'succulents', featured: false, desc: 'Haworthia fasciata with striking white zebra stripes on dark green leaves. Perfect for terrariums and tiny pots.', short: 'Tiny & perfect · Zebra stripes · Terrarium plant', base: 149, sale: 99, tags: ['succulent','haworthia','terrarium','miniature'], rating: 4.7, reviews: 1123, weight: 0.1, image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600' },
      { name: 'Gasteria (Ox Tongue)', slug: 'gasteria-ox-tongue', catSlug: 'succulents', featured: false, desc: 'Gasteria carinata with tongue-shaped leaves and attractive markings. Extremely shade-tolerant for a succulent. Produces hanging orange flowers.', short: 'Shade tolerant · Unique leaf shape · Orange flowers', base: 179, sale: 129, tags: ['succulent','gasteria','shade-tolerant'], rating: 4.6, reviews: 567, weight: 0.2, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Crassula Ovata (Jade Plant)', slug: 'crassula-jade-plant', catSlug: 'succulents', featured: true, desc: 'Crassula ovata — the prosperity plant. Thick, oval jade-green leaves on a woody trunk. Long-lived, brings good luck according to Feng Shui.', short: 'Feng Shui · Prosperity · Long-lived · Easy care', base: 249, sale: 179, tags: ['succulent','jade','feng-shui','prosperity'], rating: 4.9, reviews: 2678, weight: 0.4, image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600' },
      { name: 'Sedum Morganianum (Burro\'s Tail)', slug: 'sedum-burros-tail', catSlug: 'succulents', featured: false, desc: 'Sedum morganianum with trailing stems packed with fleshy blue-green teardrop leaves. Stunning in hanging baskets.', short: 'Trailing stems · Unique texture · Hanging display', base: 249, sale: 179, tags: ['succulent','trailing','hanging','sedum'], rating: 4.7, reviews: 789, weight: 0.3, image: 'https://images.unsplash.com/photo-1580148051671-7b8d50a90c5c?w=600' },
      { name: 'Agave Americana (Century Plant)', slug: 'agave-americana', catSlug: 'succulents', featured: false, desc: 'Bold architectural rosette of blue-grey spiny leaves. Agave americana is almost zero-maintenance and creates a dramatic focal point.', short: 'Architectural · Zero maintenance · Bold statement', base: 399, sale: 299, tags: ['succulent','agave','architectural','low-water'], rating: 4.7, reviews: 534, weight: 0.8, image: 'https://images.unsplash.com/photo-1598880940372-5b1af2fc42ff?w=600' },
      { name: 'Mammillaria Cactus (Pincushion)', slug: 'mammillaria-pincushion-cactus', catSlug: 'succulents', featured: false, desc: 'Mammillaria hahniana with a crown of tiny pink flowers and soft white hair. One of the easiest and most charming cacti.', short: 'Pink crown blooms · Soft spines · Very easy care', base: 129, sale: 89, tags: ['cactus','succulent','flowering','miniature'], rating: 4.8, reviews: 934, weight: 0.2, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Euphorbia Trigona (African Milk Tree)', slug: 'euphorbia-trigona', catSlug: 'succulents', featured: false, desc: 'Euphorbia trigona with tall columnar stems and small red-tipped leaves. Looks like a cactus, grows fast, very low maintenance.', short: 'Cactus-like · Fast growing · Low water', base: 299, sale: 219, tags: ['succulent','euphorbia','columnar','low-maintenance'], rating: 4.6, reviews: 678, weight: 0.5, image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600' },
      { name: 'Lithops (Living Stones)', slug: 'lithops-living-stones', catSlug: 'succulents', featured: true, desc: 'Lithops — the most unusual plants on earth! Mimics pebbles to avoid grazing animals. A true collector\'s conversation piece.', short: 'Looks like a stone · Collector\'s item · Unique gift', base: 299, sale: 229, tags: ['succulent','lithops','unique','collector'], rating: 4.8, reviews: 1234, weight: 0.1, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Aloe Vera (Large 6" Pot)', slug: 'aloe-vera-large-pot', catSlug: 'succulents', featured: true, desc: 'The most useful plant you can own. Aloe barbadensis miller gel soothes burns, treats skin, aids digestion. Easy to grow on any windowsill.', short: 'Natural first aid · Skin care · Very easy care', base: 149, sale: 99, tags: ['succulent','medicinal','aloe','skin-care'], rating: 4.9, reviews: 5623, weight: 0.4, image: 'https://images.unsplash.com/photo-1493946740644-2d8a1f1a6aff?w=600' },

      // ── Medicinal Plants ───────────────────────────────────────────────────
      { name: 'Ashwagandha (Indian Ginseng)', slug: 'ashwagandha-indian-ginseng', catSlug: 'medicinal', featured: true, desc: 'Withania somnifera — the king of Ayurvedic herbs. Roots used for stress relief, energy, and immunity. Drought-tolerant shrub.', short: 'Adaptogenic · Stress relief · Ayurvedic classic', base: 199, sale: 149, tags: ['medicinal','ayurvedic','adaptogen','ashwagandha'], rating: 4.8, reviews: 1456, weight: 0.4, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
      { name: 'Brahmi (Water Hyssop)', slug: 'brahmi-water-hyssop', catSlug: 'medicinal', featured: false, desc: 'Bacopa monnieri — the brain herb. Used in Ayurveda to enhance memory and reduce anxiety. Grows near water or in moist soil.', short: 'Brain tonic · Memory enhancer · Ayurvedic herb', base: 129, sale: 89, tags: ['medicinal','ayurvedic','brain','brahmi'], rating: 4.7, reviews: 923, weight: 0.2, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Neem (Indian Lilac)', slug: 'neem-indian-lilac', catSlug: 'medicinal', featured: true, desc: 'Azadirachta indica — the village pharmacy. Anti-bacterial, anti-fungal, anti-viral properties in every part. Natural pesticide from leaves.', short: 'Natural pesticide · Anti-bacterial · Sacred tree', base: 249, sale: 179, tags: ['medicinal','sacred','pesticide','neem'], rating: 4.9, reviews: 1789, weight: 0.6, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
      { name: 'Moringa (Drumstick Tree)', slug: 'moringa-drumstick', catSlug: 'medicinal', featured: false, desc: 'Moringa oleifera — the miracle tree. Leaves are a nutritional powerhouse: 7x vitamin C of oranges, 4x calcium of milk.', short: 'Superfood tree · Fast growing · Edible leaves', base: 299, sale: 219, tags: ['medicinal','superfood','edible','moringa'], rating: 4.8, reviews: 1234, weight: 0.7, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Shatavari (Asparagus Racemosus)', slug: 'shatavari-asparagus', catSlug: 'medicinal', featured: false, desc: 'Asparagus racemosus — an important Ayurvedic rejuvenating herb especially for women\'s health. Roots used in herbal tonics.', short: 'Women\'s health · Ayurvedic tonic · Climbing plant', base: 199, sale: 149, tags: ['medicinal','ayurvedic','womens-health','shatavari'], rating: 4.7, reviews: 567, weight: 0.3, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
      { name: 'Peppermint (Pudina)', slug: 'peppermint-pudina', catSlug: 'medicinal', featured: false, desc: 'Mentha x piperita — the most versatile kitchen herb. Fresh leaves for mint chutney, chai, and digestive remedies. Grows vigorously in pots.', short: 'Kitchen herb · Digestive · Grows fast in pots', base: 99, sale: 69, tags: ['medicinal','herb','kitchen','mint'], rating: 4.8, reviews: 2134, weight: 0.2, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Lemon Grass (Cymbopogon)', slug: 'lemon-grass-cymbopogon', catSlug: 'medicinal', featured: false, desc: 'Cymbopogon citratus — aromatic grass used in teas, cooking, and aromatherapy. Natural mosquito repellent.', short: 'Mosquito repellent · Aromatic tea · Easy to grow', base: 129, sale: 89, tags: ['medicinal','aromatic','mosquito-repellent','tea'], rating: 4.8, reviews: 1567, weight: 0.3, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
      { name: 'Giloy (Heart-leaved Moonseed)', slug: 'giloy-tinospora', catSlug: 'medicinal', featured: true, desc: 'Tinospora cordifolia — one of Ayurveda\'s most important immunity-boosting herbs. Stem juice used to improve immunity and fight infections.', short: 'Immunity booster · COVID herb · Ayurvedic classic', base: 149, sale: 99, tags: ['medicinal','immunity','ayurvedic','giloy'], rating: 4.9, reviews: 2456, weight: 0.3, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Stevia (Sweet Leaf)', slug: 'stevia-sweet-leaf', catSlug: 'medicinal', featured: false, desc: 'Stevia rebaudiana — a natural zero-calorie sweetener 200x sweeter than sugar. Perfect for diabetics and weight-conscious gardeners.', short: 'Natural sweetener · Diabetic-friendly · Zero calories', base: 149, sale: 99, tags: ['medicinal','sweetener','diabetic','stevia'], rating: 4.7, reviews: 1023, weight: 0.2, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
      { name: 'Curry Leaf Plant (Kadi Patta)', slug: 'curry-leaf-plant', catSlug: 'medicinal', featured: true, desc: 'Murraya koenigii — an essential in Indian cooking. Fresh curry leaves are more aromatic than dried. Rich in iron and calcium.', short: 'Essential kitchen herb · Rich in iron · Aromatic', base: 179, sale: 129, tags: ['medicinal','kitchen','aromatic','curry-leaf'], rating: 4.9, reviews: 3456, weight: 0.4, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },

      // ── Fruit Plants ───────────────────────────────────────────────────────
      { name: 'Guava (Allahabad Safeda)', slug: 'guava-allahabad-safeda', catSlug: 'fruit-plants', featured: true, desc: 'Psidium guajava "Allahabad Safeda" — India\'s most popular guava variety. Produces large, sweet, white-fleshed fruits. Bears fruit in pots.', short: 'Popular variety · Bears in pots · Sweet white fruit', base: 399, sale: 299, tags: ['fruit','guava','container-fruit','edible'], rating: 4.8, reviews: 1234, weight: 0.8, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Papaya (Red Lady Hybrid)', slug: 'papaya-red-lady', catSlug: 'fruit-plants', featured: false, desc: 'Carica papaya "Red Lady" — dwarf hybrid papaya that bears sweet, red-fleshed fruits on a compact 1.5m tree. Fruits in 9 months.', short: 'Dwarf variety · Bears fruit in 9 months · Container friendly', base: 299, sale: 219, tags: ['fruit','papaya','dwarf','fast-fruiting'], rating: 4.7, reviews: 987, weight: 0.7, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Pomegranate (Kandhari)', slug: 'pomegranate-kandhari', catSlug: 'fruit-plants', featured: true, desc: 'Punica granatum "Kandhari" with deep red arils. Adaptable to container growing. Ornamental orange-red flowers before fruiting.', short: 'Container fruit · Decorative blooms · Antioxidant fruit', base: 449, sale: 349, tags: ['fruit','pomegranate','container-fruit','ornamental'], rating: 4.8, reviews: 789, weight: 0.9, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Ber (Indian Jujube)', slug: 'ber-indian-jujube', catSlug: 'fruit-plants', featured: false, desc: 'Ziziphus mauritiana — the Indian date. Drought-tolerant fruit tree producing sweet, nutritious berries. Popular across India.', short: 'Drought tolerant · Nutritious fruit · Easy growing', base: 349, sale: 269, tags: ['fruit','ber','drought-tolerant','nutritious'], rating: 4.6, reviews: 567, weight: 0.8, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Banana (Grand Naine Dwarf)', slug: 'banana-grand-naine-dwarf', catSlug: 'fruit-plants', featured: false, desc: 'Musa acuminata "Grand Naine" — the commercial banana variety. Dwarf cultivar suitable for large pots on terraces.', short: 'Dwarf variety · Terrace garden · Tropical look', base: 499, sale: 379, tags: ['fruit','banana','tropical','dwarf'], rating: 4.7, reviews: 678, weight: 1.5, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Strawberry (Winter Dawn)', slug: 'strawberry-winter-dawn', catSlug: 'fruit-plants', featured: true, desc: 'Fragaria x ananassa "Winter Dawn" — a high-yielding variety specially selected for Indian winters. Sweet, firm berries ideal for balcony growing.', short: 'Balcony fruit · Sweet firm berries · Winter crop', base: 199, sale: 149, tags: ['fruit','strawberry','balcony','seasonal'], rating: 4.9, reviews: 2134, weight: 0.3, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Mulberry (Black Mulberry)', slug: 'mulberry-black', catSlug: 'fruit-plants', featured: false, desc: 'Morus nigra — sweet, juicy black mulberries on a compact tree. Extremely easy to grow, produces abundantly. Silkworm food plant.', short: 'Sweet black berries · Very easy growing · Fast producing', base: 349, sale: 269, tags: ['fruit','mulberry','easy-growing','fast-producing'], rating: 4.8, reviews: 789, weight: 0.7, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Dragon Fruit (Red Pitaya)', slug: 'dragon-fruit-red-pitaya', catSlug: 'fruit-plants', featured: true, desc: 'Hylocereus costaricensis — climbing cactus with spectacular night-blooming flowers and exotic red-fleshed fruits. Very trendy and nutritious.', short: 'Exotic fruit · Night blooming · Climbing cactus', base: 599, sale: 449, tags: ['fruit','exotic','climbing','cactus','dragon-fruit'], rating: 4.8, reviews: 1234, weight: 1.0, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Amla (Indian Gooseberry)', slug: 'amla-indian-gooseberry', catSlug: 'fruit-plants', featured: false, desc: 'Phyllanthus emblica — the richest natural source of Vitamin C. Sacred in India, used in Chyawanprash, hair oils and Ayurvedic medicine.', short: 'Richest Vitamin C source · Sacred · Ayurvedic', base: 299, sale: 219, tags: ['fruit','medicinal','vitamin-c','sacred','amla'], rating: 4.9, reviews: 987, weight: 0.6, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Custard Apple (Sitaphal)', slug: 'custard-apple-sitaphal', catSlug: 'fruit-plants', featured: false, desc: 'Annona squamosa — the sweetest tropical fruit. Creamy, custard-like white flesh loved across India. Drought-tolerant once established.', short: 'Sweet custard flesh · Drought tolerant · Tropical', base: 449, sale: 349, tags: ['fruit','tropical','custard-apple','sweet'], rating: 4.7, reviews: 678, weight: 0.9, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'Jamun (Indian Blackberry)', slug: 'jamun-indian-blackberry', catSlug: 'fruit-plants', featured: false, desc: 'Syzygium cumini — the beloved Indian summer fruit. Deep purple astringent berries with Ayurvedic benefits for diabetes management.', short: 'Summer fruit · Diabetic-friendly · Ayurvedic', base: 499, sale: 399, tags: ['fruit','medicinal','diabetic','summer','jamun'], rating: 4.8, reviews: 845, weight: 1.0, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },

      // ── XL Plants ──────────────────────────────────────────────────────────
      { name: 'Fiddle Leaf Fig Bambino (XL)', slug: 'fiddle-leaf-fig-bambino-xl', catSlug: 'xl-plants', featured: true, desc: 'Ficus lyrata — the designer\'s favorite. Large violin-shaped leaves on a dramatic trunk. A statement piece for living rooms and offices.', short: 'Designer statement · Large bold leaves · Trending', base: 1999, sale: 1499, tags: ['xl','indoor','designer','statement','ficus'], rating: 4.7, reviews: 567, weight: 5.0, image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600' },
      { name: 'Traveller\'s Palm (XL)', slug: 'travellers-palm-xl', catSlug: 'xl-plants', featured: false, desc: 'Ravenala madagascariensis — giant fan-shaped arrangement of banana-like leaves. A spectacular tropical focal point for large spaces.', short: 'Tropical spectacle · Fan-shaped · Grand statement', base: 2499, sale: 1999, tags: ['xl','tropical','outdoor','statement'], rating: 4.8, reviews: 234, weight: 8.0, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Pachira Aquatica (Money Tree XL)', slug: 'pachira-money-tree-xl', catSlug: 'xl-plants', featured: true, desc: 'Pachira aquatica with a braided trunk and lustrous palmate leaves. Feng Shui symbol of wealth and good fortune. Popular for offices.', short: 'Braided trunk · Feng Shui · Office plant · Good luck', base: 1499, sale: 1199, tags: ['xl','indoor','feng-shui','braided','pachira'], rating: 4.9, reviews: 789, weight: 4.0, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Kentia Palm (XL)', slug: 'kentia-palm-xl', catSlug: 'xl-plants', featured: false, desc: 'Howea forsteriana — the most elegant indoor palm. Arching dark green fronds on a slender trunk. Very tolerant of indoor conditions.', short: 'Most elegant palm · Indoor tolerant · Architectural', base: 1799, sale: 1399, tags: ['xl','indoor','palm','elegant'], rating: 4.7, reviews: 345, weight: 6.0, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Dracaena Massangeana (Corn Plant XL)', slug: 'dracaena-corn-plant-xl', catSlug: 'xl-plants', featured: false, desc: 'Dracaena fragrans "Massangeana" with broad striped green-yellow leaves. One of NASA\'s most effective air purifiers. Tolerates low light.', short: 'Air purifying · Low light tolerant · Office classic', base: 1299, sale: 999, tags: ['xl','indoor','air-purifying','dracaena'], rating: 4.8, reviews: 456, weight: 5.0, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600' },

      // ── Air Purifying ──────────────────────────────────────────────────────
      { name: 'Bamboo Palm (Reed Palm)', slug: 'bamboo-palm-chamaedorea', catSlug: 'air-purifying', featured: true, desc: 'Chamaedorea seifrizii — NASA\'s #2 rated air purifying plant. Removes formaldehyde, xylene, and toluene. Natural humidifier.', short: 'NASA top-rated · Removes toxins · Humidifier', base: 599, sale: 449, tags: ['air-purifying','nasa','palm','humidifier'], rating: 4.8, reviews: 934, weight: 1.0, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600' },
      { name: 'Chrysanthemum (Air Purifying)', slug: 'chrysanthemum-air-purifying', catSlug: 'air-purifying', featured: false, desc: 'Chrysanthemum morifolium — NASA\'s top-rated plant for removing ammonia and benzene. A beautiful and functional houseplant.', short: 'NASA rated · Removes ammonia · Beautiful blooms', base: 199, sale: 149, tags: ['air-purifying','nasa','flowering','chrysanthemum'], rating: 4.7, reviews: 789, weight: 0.3, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Philodendron Brasil', slug: 'philodendron-brasil', catSlug: 'air-purifying', featured: false, desc: 'Philodendron hederaceum "Brasil" with striking lime-green and dark green variegated leaves. Air purifying trailing plant.', short: 'Variegated · Air purifying · Fast growing', base: 299, sale: 219, tags: ['air-purifying','variegated','trailing','philodendron'], rating: 4.8, reviews: 1123, weight: 0.4, image: 'https://images.unsplash.com/photo-1599598425947-5202edd56bdb?w=600' },
      { name: 'Schefflera (Umbrella Plant)', slug: 'schefflera-umbrella', catSlug: 'air-purifying', featured: false, desc: 'Schefflera arboricola with umbrella-like clusters of glossy leaflets. Effective at absorbing chemicals from tobacco smoke.', short: 'Anti-tobacco smoke · Glossy leaves · Easy care', base: 349, sale: 269, tags: ['air-purifying','schefflera','easy-care','office'], rating: 4.6, reviews: 678, weight: 0.6, image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600' },
      { name: 'English Ivy (Hedera Helix)', slug: 'english-ivy-hedera', catSlug: 'air-purifying', featured: false, desc: 'Hedera helix — NASA\'s top plant for removing airborne mold spores and formaldehyde. Excellent for allergy sufferers.', short: 'Reduces mold spores · Anti-allergy · NASA listed', base: 199, sale: 149, tags: ['air-purifying','nasa','ivy','allergy'], rating: 4.6, reviews: 789, weight: 0.3, image: 'https://images.unsplash.com/photo-1580148051671-7b8d50a90c5c?w=600' },

      // ── Pet Friendly ───────────────────────────────────────────────────────
      { name: 'Calathea Makoyana (Peacock Plant)', slug: 'calathea-makoyana-peacock', catSlug: 'pet-friendly', featured: true, desc: 'Calathea makoyana with intricate peacock-feather patterns on leaves. 100% pet safe. Leaves move with the day\'s light.', short: 'Peacock pattern · Pet safe · Prayer plant', base: 449, sale: 349, tags: ['pet-friendly','calathea','patterned','prayer-plant'], rating: 4.7, reviews: 789, weight: 0.4, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
      { name: 'African Violet Pink (Saintpaulia)', slug: 'african-violet-pink', catSlug: 'pet-friendly', featured: false, desc: 'Saintpaulia ionantha — compact flowering houseplant that blooms almost year-round. One of the safest plants for homes with pets.', short: 'Year-round blooms · Pet safe · Compact', base: 149, sale: 99, tags: ['pet-friendly','flowering','compact','african-violet'], rating: 4.7, reviews: 934, weight: 0.2, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },
      { name: 'Areca Palm (Pet Safe)', slug: 'areca-palm-pet-safe', catSlug: 'pet-friendly', featured: false, desc: 'Dypsis lutescens — the ASPCA-approved palm for homes with cats and dogs. Air purifying and non-toxic.', short: 'ASPCA approved · Air purifying · Cat & dog safe', base: 499, sale: 379, tags: ['pet-friendly','palm','air-purifying','aspca'], rating: 4.8, reviews: 1123, weight: 0.8, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Friendship Plant (Pilea Involucrata)', slug: 'friendship-plant-pilea', catSlug: 'pet-friendly', featured: false, desc: 'Pilea involucrata with textured, quilted leaves in bronze and silver. Easy to propagate and share — hence "Friendship Plant".', short: 'Pet safe · Easy propagation · Gift plant', base: 179, sale: 129, tags: ['pet-friendly','pilea','gift','easy-care'], rating: 4.6, reviews: 567, weight: 0.2, image: 'https://images.unsplash.com/photo-1601985705806-5b9a291f6b5c?w=600' },
      { name: 'Blue Echeveria (Pet Safe Succulent)', slug: 'blue-echeveria-pet-safe', catSlug: 'pet-friendly', featured: false, desc: 'Echeveria glauca — blue-green rosette succulent that\'s safe for cats and dogs. Low water needs, beautiful year-round.', short: 'Pet safe succulent · Blue rosette · Low water', base: 179, sale: 129, tags: ['pet-friendly','succulent','echeveria','low-water'], rating: 4.7, reviews: 645, weight: 0.2, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },

      // ── Low Maintenance ────────────────────────────────────────────────────
      { name: 'Lucky Bamboo (Dracaena Sanderiana)', slug: 'lucky-bamboo-dracaena', catSlug: 'low-maintenance', featured: true, desc: 'Dracaena sanderiana — the iconic Feng Shui plant that grows in water or soil. 3-stem brings happiness, 5-stem brings wealth.', short: 'Grows in water · Feng Shui · Zero soil needed', base: 199, sale: 149, tags: ['low-maintenance','feng-shui','water-plant','lucky'], rating: 4.9, reviews: 3456, weight: 0.3, image: 'https://images.unsplash.com/photo-1514596590946-95a04df0ef1e?w=600' },
      { name: 'Cactus Assorted Mix', slug: 'cactus-assorted-mix', catSlug: 'low-maintenance', featured: false, desc: 'Assorted small cacti — perfect starter collection. Water once a week in summer, once a month in winter. Ideal for forgetful plant parents.', short: 'Water once a month · Beginner-friendly · Mix of varieties', base: 299, sale: 199, tags: ['low-maintenance','cactus','beginner','forgetful'], rating: 4.8, reviews: 2345, weight: 0.5, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Sansevieria Cylindrica (Cylindrical Snake Plant)', slug: 'sansevieria-cylindrica', catSlug: 'low-maintenance', featured: false, desc: 'Dracaena angolensis with cylindrical, spear-like leaves that fan out elegantly. Even tougher than regular snake plants.', short: 'Toughest plant · Cylindrical leaves · Drought proof', base: 349, sale: 269, tags: ['low-maintenance','sansevieria','drought-tolerant','unique'], rating: 4.9, reviews: 987, weight: 0.5, image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=600' },
      { name: 'Ponytail Palm (Beaucarnea)', slug: 'ponytail-palm-beaucarnea', catSlug: 'low-maintenance', featured: false, desc: 'Beaucarnea recurvata with a swollen trunk for water storage and cascading ponytail of leaves. Water monthly. Lives for decades.', short: 'Water monthly · Unique form · Very long-lived', base: 449, sale: 349, tags: ['low-maintenance','unique','succulent-like','long-lived'], rating: 4.8, reviews: 789, weight: 0.7, image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600' },
      { name: 'Air Plant (Tillandsia)', slug: 'air-plant-tillandsia', catSlug: 'low-maintenance', featured: true, desc: 'Tillandsia — plants that need no soil! Mist twice a week, place anywhere. Perfect for terrariums, driftwood, and wall art.', short: 'No soil needed · Mist twice a week · Wall art', base: 199, sale: 149, tags: ['low-maintenance','no-soil','tillandsia','terrarium'], rating: 4.7, reviews: 1234, weight: 0.1, image: 'https://images.unsplash.com/photo-1601985705806-5b9a291f6b5c?w=600' },

      // ── Seeds ──────────────────────────────────────────────────────────────
      { name: 'Sunflower Seeds (Helianthus)', slug: 'sunflower-seeds-pack', catSlug: 'seeds', featured: true, desc: 'Helianthus annuus — classic sunflower seeds. Grows to 1.5-2m tall, perfect for kids\' gardens. Edible seeds after harvest.', short: '50 seeds · Easy germination · Kids favorite', base: 79, sale: 59, tags: ['seeds','sunflower','easy','kids-garden'], rating: 4.8, reviews: 2345, weight: 0.05, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Zinnia Mix Seeds', slug: 'zinnia-mix-seeds', catSlug: 'seeds', featured: false, desc: 'Zinnia elegans mixed colors — fastest-blooming annual from seed. Flowers in 8 weeks, keeps blooming till frost.', short: '50 seeds · Blooms in 8 weeks · Mixed colors', base: 69, sale: 49, tags: ['seeds','zinnia','fast-blooming','colorful'], rating: 4.7, reviews: 1678, weight: 0.05, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },
      { name: 'Basil Seeds (Sabja)', slug: 'basil-sabja-seeds', catSlug: 'seeds', featured: true, desc: 'Ocimum basilicum — Italian basil seeds for cooking + Ocimum tenuiflorum (Tulsi) seeds for ayurvedic use. Double pack.', short: '100 seeds · Culinary + medicinal · Quick germination', base: 59, sale: 39, tags: ['seeds','herb','culinary','basil'], rating: 4.9, reviews: 3456, weight: 0.05, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Wildflower Mix Seeds', slug: 'wildflower-mix-seeds', catSlug: 'seeds', featured: false, desc: '25+ species wildflower mix including poppies, cornflowers, cosmos, and lupins. Just scatter and water. Creates a pollinator paradise.', short: '200+ seeds · 25+ species · Pollinator garden', base: 149, sale: 99, tags: ['seeds','wildflower','pollinator','scatter'], rating: 4.8, reviews: 1234, weight: 0.1, image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=600' },
      { name: 'Tomato Cherry Seeds (F1 Hybrid)', slug: 'tomato-cherry-f1-seeds', catSlug: 'seeds', featured: false, desc: 'F1 hybrid cherry tomato seeds — produces clusters of sweet, bite-sized tomatoes on compact plants. Great for balcony kitchen gardens.', short: '25 seeds · Balcony kitchen garden · Sweet cherry tomatoes', base: 89, sale: 59, tags: ['seeds','vegetable','tomato','balcony','kitchen-garden'], rating: 4.8, reviews: 1789, weight: 0.05, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },

      // ── Pots & Planters ────────────────────────────────────────────────────
      { name: 'Terracotta Pot (6 inch)', slug: 'terracotta-pot-6inch', catSlug: 'pots-planters', featured: true, desc: 'Classic unglazed terracotta pot — the best material for plant health. Porous walls allow excellent root aeration. Set of 3.', short: 'Set of 3 · Porous for root health · Classic design', base: 299, sale: 199, tags: ['pot','terracotta','classic','set-of-3'], rating: 4.8, reviews: 2134, weight: 1.5, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Self-Watering Planter (White)', slug: 'self-watering-planter-white', catSlug: 'pots-planters', featured: false, desc: 'Modern self-watering planter with water reservoir. Sub-irrigation keeps roots perfectly moist. Perfect for busy plant parents.', short: 'Self-watering · Modern design · Busy plant parents', base: 499, sale: 379, tags: ['pot','self-watering','modern','busy-parents'], rating: 4.7, reviews: 934, weight: 0.8, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Hanging Planter Set (Macrame)', slug: 'hanging-planter-macrame-set', catSlug: 'pots-planters', featured: true, desc: 'Handmade cotton macramé hanging planters with terracotta pots. Set of 3 sizes. Adds bohemian charm to any room.', short: 'Handmade · Set of 3 · Bohemian style', base: 699, sale: 499, tags: ['pot','hanging','macrame','boho','set-of-3'], rating: 4.9, reviews: 1678, weight: 1.0, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Ceramic Pot with Saucer (Blue)', slug: 'ceramic-pot-blue-saucer', catSlug: 'pots-planters', featured: false, desc: 'Hand-painted blue ceramic pot with matching saucer. Drainage hole included. Ideal for succulents and small indoor plants.', short: 'Hand-painted · With saucer · Drainage hole', base: 349, sale: 249, tags: ['pot','ceramic','decorative','with-saucer'], rating: 4.8, reviews: 1123, weight: 0.9, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },
      { name: 'Fabric Grow Bag (5-Pack)', slug: 'fabric-grow-bag-5pack', catSlug: 'pots-planters', featured: false, desc: 'BPA-free breathable fabric pots for superior root health. Air-pruning prevents root circling. Pack of 5 in 5-gallon size.', short: 'Pack of 5 · Air-pruning roots · BPA-free', base: 399, sale: 299, tags: ['pot','grow-bag','fabric','root-health','pack-of-5'], rating: 4.8, reviews: 1456, weight: 0.5, image: 'https://images.unsplash.com/photo-1567016546370-e4f8a0bfa7b5?w=600' },

      // ── Plant Care ─────────────────────────────────────────────────────────
      { name: 'Premium Potting Mix (5kg)', slug: 'premium-potting-mix-5kg', catSlug: 'plant-care', featured: true, desc: 'Professional-grade potting mix with cocopeat, perlite, vermicompost, and neem cake. pH balanced for indoor and outdoor plants.', short: '5kg · pH balanced · With vermicompost', base: 349, sale: 279, tags: ['plant-care','potting-mix','soil','professional'], rating: 4.9, reviews: 3456, weight: 5.0, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Seaweed Fertilizer (1 litre)', slug: 'seaweed-fertilizer-1l', catSlug: 'plant-care', featured: false, desc: 'Cold-processed liquid seaweed extract rich in cytokinins and auxins. Promotes root growth, stress tolerance, and lush foliage.', short: '1 litre · Promotes root growth · Organic', base: 299, sale: 219, tags: ['plant-care','fertilizer','organic','seaweed'], rating: 4.8, reviews: 1234, weight: 1.0, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Neem Oil Spray (Ready to Use)', slug: 'neem-oil-spray-rtu', catSlug: 'plant-care', featured: true, desc: 'Cold-pressed neem oil spray for controlling fungus, mites, aphids, and mealybugs. Safe for edible plants and beneficial insects.', short: 'Ready to use · Organic · Controls 100+ pests', base: 249, sale: 179, tags: ['plant-care','pest-control','organic','neem'], rating: 4.8, reviews: 2345, weight: 0.5, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Succulent & Cactus Mix (2kg)', slug: 'succulent-cactus-mix-2kg', catSlug: 'plant-care', featured: false, desc: 'Fast-draining gritty mix with pumice, perlite and coarse sand. Prevents root rot in succulents, cacti, and Adenium.', short: '2kg · Fast-draining · Prevents root rot', base: 199, sale: 149, tags: ['plant-care','soil','succulent','cactus'], rating: 4.9, reviews: 1789, weight: 2.0, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Moisture Meter & pH Tester', slug: 'moisture-meter-ph-tester', catSlug: 'plant-care', featured: false, desc: 'Dual-function soil probe measures moisture level and pH. No batteries needed. Prevents over-watering — the #1 killer of houseplants.', short: 'No batteries · Dual function · Prevents overwatering', base: 399, sale: 299, tags: ['plant-care','tool','moisture','ph-tester'], rating: 4.7, reviews: 1023, weight: 0.2, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },
      { name: 'Vermicompost (3kg Bag)', slug: 'vermicompost-3kg', catSlug: 'plant-care', featured: false, desc: 'Certified organic vermicompost from red wigglers. Contains beneficial microbes, improves soil structure, and provides slow-release nutrients.', short: '3kg · Certified organic · Improves soil structure', base: 249, sale: 179, tags: ['plant-care','fertilizer','organic','vermicompost'], rating: 4.9, reviews: 2678, weight: 3.0, image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600' },

      // ── Gifts & Combos ─────────────────────────────────────────────────────
      { name: 'Housewarming Plant Trio', slug: 'housewarming-plant-trio', catSlug: 'gifts-combos', featured: true, desc: 'Three auspicious plants for a new home: Lucky Bamboo (prosperity), Jade Plant (good fortune), Peace Lily (harmony). Gift-wrapped with care card.', short: 'Gift-wrapped · 3 auspicious plants · Care card included', base: 799, sale: 599, tags: ['gift','combo','housewarming','auspicious'], rating: 4.9, reviews: 1678, weight: 1.5, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600' },
      { name: 'Succulent Garden Box (6 Plants)', slug: 'succulent-garden-box-6', catSlug: 'gifts-combos', featured: true, desc: 'Six handpicked succulent varieties in a wooden box planter. Includes care guide. Perfect birthday and thank you gift.', short: '6 varieties · Wooden box · Birthday gift', base: 699, sale: 549, tags: ['gift','combo','succulent','wooden-box'], rating: 4.8, reviews: 2134, weight: 1.0, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600' },
      { name: 'Herb Kitchen Garden Kit', slug: 'herb-kitchen-garden-kit', catSlug: 'gifts-combos', featured: false, desc: 'Everything to start a kitchen herb garden: 4 herb plants (basil, mint, coriander, curry leaf), terracotta pots, potting mix, and instructions.', short: '4 herbs + pots + soil · Complete kit · Kitchen garden', base: 899, sale: 699, tags: ['gift','combo','kitchen','herbs','starter-kit'], rating: 4.9, reviews: 1234, weight: 3.0, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600' },
      { name: 'Air Purifying Plant Pack (3 Plants)', slug: 'air-purifying-plant-pack-3', catSlug: 'gifts-combos', featured: false, desc: 'Three NASA-approved air purifiers: Snake Plant, Peace Lily, and Spider Plant. Includes decorative pots and care booklet.', short: 'NASA approved · 3 purifiers · With pots', base: 799, sale: 599, tags: ['gift','combo','air-purifying','nasa','pack'], rating: 4.8, reviews: 987, weight: 2.0, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600' },
      { name: 'Office Desk Plant Duo', slug: 'office-desk-plant-duo', catSlug: 'gifts-combos', featured: false, desc: 'Two compact plants perfect for an office desk: ZZ Plant (low light) and Lucky Bamboo (prosperity). In matching pots.', short: '2 desk plants · Matching pots · Office gift', base: 599, sale: 449, tags: ['gift','combo','office','desk','corporate'], rating: 4.7, reviews: 1345, weight: 1.0, image: 'https://images.unsplash.com/photo-1514596590946-95a04df0ef1e?w=600' },
      { name: 'Meditation Garden Set', slug: 'meditation-garden-set', catSlug: 'gifts-combos', featured: true, desc: 'Curated Zen garden: Tulsi (sacred), Brahmi (calming), Lucky Bamboo, white pebbles tray, and incense. A mindful gift.', short: 'Zen garden · Sacred herbs · Mindful gift', base: 1199, sale: 899, tags: ['gift','combo','meditation','zen','sacred'], rating: 4.9, reviews: 678, weight: 2.5, image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600' },
    ];

    // ── Insert Products ───────────────────────────────────────────────────────
    const slug2 = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const productRows = [];
    for (const p of plants) {
      productRows.push({
        name:              p.name,
        slug:              p.slug,
        description:       p.desc,
        short_description: p.short,
        category_id:       cid(p.catSlug),
        brand_id:          brandId,
        status:            'active',
        is_featured:       p.featured ? 1 : 0,
        is_digital:        0,
        has_variants:      1,
        base_price:        p.base,
        sale_price:        p.sale ?? null,
        tax_rate:          5,
        tags:              JSON.stringify(p.tags),
        weight:            p.weight,
        review_count:      p.reviews,
        rating:            p.rating,
        created_by:        adminId,
        vendor_id:         null,
        created_at:        now,
        updated_at:        now,
      });
    }

    await queryInterface.bulkInsert('products', productRows);

    const [insertedProducts] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products WHERE slug IN (${plants.map(p => `'${p.slug}'`).join(',')}) ORDER BY id`
    );

    // ── Insert Images ─────────────────────────────────────────────────────────
    const imageRows = [];
    for (const row of insertedProducts) {
      const p = plants.find(x => x.slug === row.slug);
      if (!p) continue;
      imageRows.push({
        product_id: row.id,
        url:        p.image,
        alt:        p.name,
        is_primary: 1,
        sort_order: 0,
      });
    }
    await queryInterface.bulkInsert('product_images', imageRows);

    // ── Insert Variants + Inventory ───────────────────────────────────────────
    const xlSlugs = new Set(plants.filter(p => p.catSlug === 'xl-plants').map(p => p.slug));
    const seedSlugs = new Set(plants.filter(p => p.catSlug === 'seeds').map(p => p.slug));
    const careAccessorySlugs = new Set([
      ...plants.filter(p => p.catSlug === 'pots-planters').map(p => p.slug),
      ...plants.filter(p => p.catSlug === 'plant-care').map(p => p.slug),
    ]);

    let skuIdx = 1;
    for (const row of insertedProducts) {
      const p = plants.find(x => x.slug === row.slug);
      if (!p) continue;

      let variants;
      if (xlSlugs.has(p.slug) || seedSlugs.has(p.slug) || careAccessorySlugs.has(p.slug)) {
        variants = [{ size: 'Standard', multi: 1.0 }];
      } else {
        variants = [
          { size: '4" Pot', multi: 1.0 },
          { size: '6" Pot', multi: 1.6 },
          { size: '8" Pot', multi: 2.2 },
        ];
      }

      for (const v of variants) {
        const skuCode = `LG2-${String(skuIdx).padStart(4, '0')}`;
        const varPrice = Math.round(p.base * v.multi);
        const varSale  = p.sale ? Math.round(p.sale * v.multi) : null;

        await queryInterface.bulkInsert('product_variants', [{
          product_id:  row.id,
          sku:         skuCode,
          name:        v.size,
          price:       varPrice,
          sale_price:  varSale,
          attributes:  JSON.stringify({ size: v.size }),
          is_active:   1,
          created_at:  now,
          updated_at:  now,
        }]);

        const [varRows] = await queryInterface.sequelize.query(
          `SELECT id FROM product_variants WHERE sku = '${skuCode}' LIMIT 1`
        );
        const varId = varRows[0].id;

        await queryInterface.bulkInsert('inventory', [{
          variant_id:   varId,
          qty_on_hand:  Math.floor(Math.random() * 80) + 20,
          qty_reserved: 0,
          low_stock_threshold: 5,
          created_at:   now,
          updated_at:   now,
        }]);

        skuIdx++;
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE pv FROM product_variants pv
       INNER JOIN products p ON pv.product_id = p.id
       WHERE pv.sku LIKE 'LG2-%'`
    );
    await queryInterface.sequelize.query(
      `DELETE pi FROM product_images pi
       INNER JOIN products p ON pi.product_id = p.id
       WHERE p.slug IN (${[
         'pothos-neon','syngonium-pink-arrowhead','calathea-orbifolia','tradescantia-zebrina',
         'dracaena-marginata','boston-fern-nephrolepis','anthurium-flamingo','bird-of-paradise-strelitzia',
         'peperomia-watermelon','pothos-marble-queen','string-of-pearls-senecio','cast-iron-plant-aspidistra',
         'chinese-money-plant-pilea','dieffenbachia-dumb-cane','bougainvillea-pink','hibiscus-red-china-rose',
         'ixora-jungle-geranium','plumeria-champa','ashoka-tree-saraca','oleander-kaner','tecoma-yellow-bells',
         'bamboo-golden','duranta-sky-flower','bottle-brush-callistemon','coral-jasmine-parijat',
         'lantana-wild-sage','crossandra-firecracker','adenium-desert-rose','aster-star-daisy',
         'begonia-wax','celosia-cockscomb','chrysanthemum-guldaudi','dianthus-carnation',
         'gazania-treasure-flower','gerbera-daisy','marigold-african','petunia-cascade',
         'portulaca-moss-rose','vinca-periwinkle','echeveria-blue-bird','haworthia-fasciata-zebra',
         'gasteria-ox-tongue','crassula-jade-plant','sedum-burros-tail','agave-americana',
         'mammillaria-pincushion-cactus','euphorbia-trigona','lithops-living-stones','aloe-vera-medicinal',
         'ashwagandha-indian-ginseng','brahmi-water-hyssop','neem-indian-lilac','moringa-drumstick',
         'shatavari-asparagus','peppermint-pudina','lemon-grass-cymbopogon','giloy-tinospora',
         'stevia-sweet-leaf','curry-leaf-plant','guava-allahabad-safeda','papaya-red-lady',
         'pomegranate-kandhari','ber-indian-jujube','banana-grand-naine-dwarf','strawberry-winter-dawn',
         'mulberry-black','dragon-fruit-red-pitaya','amla-indian-gooseberry','custard-apple-sitaphal',
         'jamun-indian-blackberry','fiddle-leaf-fig-xl','travellers-palm-xl','pachira-money-tree-xl',
         'kentia-palm-xl','dracaena-corn-plant-xl','bamboo-palm-chamaedorea','chrysanthemum-air-purifying',
         'philodendron-brasil','schefflera-umbrella','english-ivy-hedera','calathea-makoyana-peacock',
         'african-violet-saintpaulia','areca-palm-pet-safe','friendship-plant-pilea','blue-echeveria-pet-safe',
         'lucky-bamboo-dracaena','cactus-assorted-mix','sansevieria-cylindrica','ponytail-palm-beaucarnea',
         'air-plant-tillandsia','sunflower-seeds-pack','zinnia-mix-seeds','basil-sabja-seeds',
         'wildflower-mix-seeds','tomato-cherry-f1-seeds','terracotta-pot-6inch','self-watering-planter-white',
         'hanging-planter-macrame-set','ceramic-pot-blue-saucer','fabric-grow-bag-5pack',
         'premium-potting-mix-5kg','seaweed-fertilizer-1l','neem-oil-spray-rtu','succulent-cactus-mix-2kg',
         'moisture-meter-ph-tester','vermicompost-3kg','housewarming-plant-trio','succulent-garden-box-6',
         'herb-kitchen-garden-kit','air-purifying-plant-pack-3','office-desk-plant-duo','meditation-garden-set',
       ].map(s => `'${s}'`).join(',')})`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM products WHERE slug IN (${[
         'pothos-neon','syngonium-pink-arrowhead','calathea-orbifolia','tradescantia-zebrina',
         'dracaena-marginata','boston-fern-nephrolepis','anthurium-flamingo','bird-of-paradise-strelitzia',
         'peperomia-watermelon','pothos-marble-queen','string-of-pearls-senecio','cast-iron-plant-aspidistra',
         'chinese-money-plant-pilea','dieffenbachia-dumb-cane','bougainvillea-pink','hibiscus-red-china-rose',
         'ixora-jungle-geranium','plumeria-champa','ashoka-tree-saraca','oleander-kaner','tecoma-yellow-bells',
         'bamboo-golden','duranta-sky-flower','bottle-brush-callistemon','coral-jasmine-parijat',
         'lantana-wild-sage','crossandra-firecracker','adenium-desert-rose','aster-star-daisy',
         'begonia-wax','celosia-cockscomb','chrysanthemum-guldaudi','dianthus-carnation',
         'gazania-treasure-flower','gerbera-daisy','marigold-african','petunia-cascade',
         'portulaca-moss-rose','vinca-periwinkle','echeveria-blue-bird','haworthia-fasciata-zebra',
         'gasteria-ox-tongue','crassula-jade-plant','sedum-burros-tail','agave-americana',
         'mammillaria-pincushion-cactus','euphorbia-trigona','lithops-living-stones','aloe-vera-medicinal',
         'ashwagandha-indian-ginseng','brahmi-water-hyssop','neem-indian-lilac','moringa-drumstick',
         'shatavari-asparagus','peppermint-pudina','lemon-grass-cymbopogon','giloy-tinospora',
         'stevia-sweet-leaf','curry-leaf-plant','guava-allahabad-safeda','papaya-red-lady',
         'pomegranate-kandhari','ber-indian-jujube','banana-grand-naine-dwarf','strawberry-winter-dawn',
         'mulberry-black','dragon-fruit-red-pitaya','amla-indian-gooseberry','custard-apple-sitaphal',
         'jamun-indian-blackberry','fiddle-leaf-fig-xl','travellers-palm-xl','pachira-money-tree-xl',
         'kentia-palm-xl','dracaena-corn-plant-xl','bamboo-palm-chamaedorea','chrysanthemum-air-purifying',
         'philodendron-brasil','schefflera-umbrella','english-ivy-hedera','calathea-makoyana-peacock',
         'african-violet-saintpaulia','areca-palm-pet-safe','friendship-plant-pilea','blue-echeveria-pet-safe',
         'lucky-bamboo-dracaena','cactus-assorted-mix','sansevieria-cylindrica','ponytail-palm-beaucarnea',
         'air-plant-tillandsia','sunflower-seeds-pack','zinnia-mix-seeds','basil-sabja-seeds',
         'wildflower-mix-seeds','tomato-cherry-f1-seeds','terracotta-pot-6inch','self-watering-planter-white',
         'hanging-planter-macrame-set','ceramic-pot-blue-saucer','fabric-grow-bag-5pack',
         'premium-potting-mix-5kg','seaweed-fertilizer-1l','neem-oil-spray-rtu','succulent-cactus-mix-2kg',
         'moisture-meter-ph-tester','vermicompost-3kg','housewarming-plant-trio','succulent-garden-box-6',
         'herb-kitchen-garden-kit','air-purifying-plant-pack-3','office-desk-plant-duo','meditation-garden-set',
       ].map(s => `'${s}'`).join(',')})`
    );
  },
};
