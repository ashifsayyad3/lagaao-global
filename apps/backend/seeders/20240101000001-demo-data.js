'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ── 1. Users ──────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Password@123', 10);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Super Admin', email: 'admin@lagaao.com', phone: '9000000001',
        password_hash: passwordHash, role: 'super_admin',
        is_verified: true, is_active: true, mfa_enabled: false,
        created_at: now, updated_at: now,
      },
      {
        name: 'Rahul Sharma', email: 'vendor@lagaao.com', phone: '9000000002',
        password_hash: passwordHash, role: 'vendor',
        is_verified: true, is_active: true, mfa_enabled: false,
        created_at: now, updated_at: now,
      },
      {
        name: 'Priya Patel', email: 'customer@lagaao.com', phone: '9000000003',
        password_hash: passwordHash, role: 'customer',
        is_verified: true, is_active: true, mfa_enabled: false,
        created_at: now, updated_at: now,
      },
      {
        name: 'Amit Kumar', email: 'amit@lagaao.com', phone: '9000000004',
        password_hash: passwordHash, role: 'customer',
        is_verified: true, is_active: true, mfa_enabled: false,
        created_at: now, updated_at: now,
      },
    ], {});

    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('admin@lagaao.com','vendor@lagaao.com','customer@lagaao.com','amit@lagaao.com') ORDER BY id`
    );
    const adminId    = users.find(u => u.email === 'admin@lagaao.com').id;
    const vendorUserId = users.find(u => u.email === 'vendor@lagaao.com').id;
    const customerId = users.find(u => u.email === 'customer@lagaao.com').id;

    // ── 2. Addresses ──────────────────────────────────────────────
    await queryInterface.bulkInsert('addresses', [
      {
        user_id: customerId, type: 'home', name: 'Priya Patel', phone: '9000000003',
        line1: '12 MG Road', line2: 'Apt 3B', city: 'Mumbai',
        state: 'Maharashtra', pincode: '400001', country: 'India',
        is_default: true, created_at: now, updated_at: now,
      },
      {
        user_id: customerId, type: 'work', name: 'Priya Patel', phone: '9000000003',
        line1: 'Tower B, BKC', line2: null, city: 'Mumbai',
        state: 'Maharashtra', pincode: '400051', country: 'India',
        is_default: false, created_at: now, updated_at: now,
      },
    ], {});

    // ── 3. Categories ─────────────────────────────────────────────
    await queryInterface.bulkInsert('categories', [
      { name: 'Electronics',   slug: 'electronics',   image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', description: 'Gadgets & devices', parent_id: null, sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Fashion',       slug: 'fashion',       image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', description: 'Clothing & accessories', parent_id: null, sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Home & Living', slug: 'home-living',   image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', description: 'Furniture & decor', parent_id: null, sort_order: 3, is_active: true, created_at: now, updated_at: now },
      { name: 'Books',         slug: 'books',         image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', description: 'Books & stationery', parent_id: null, sort_order: 4, is_active: true, created_at: now, updated_at: now },
      { name: 'Sports',        slug: 'sports',        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400', description: 'Sports & fitness', parent_id: null, sort_order: 5, is_active: true, created_at: now, updated_at: now },
    ], {});

    const [cats] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories ORDER BY id`
    );
    const catId = slug => cats.find(c => c.slug === slug).id;

    // Subcategories
    await queryInterface.bulkInsert('categories', [
      { name: 'Smartphones',  slug: 'smartphones',   image: null, description: null, parent_id: catId('electronics'),  sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Laptops',      slug: 'laptops',       image: null, description: null, parent_id: catId('electronics'),  sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Audio',        slug: 'audio',         image: null, description: null, parent_id: catId('electronics'),  sort_order: 3, is_active: true, created_at: now, updated_at: now },
      { name: "Men's Wear",   slug: 'mens-wear',     image: null, description: null, parent_id: catId('fashion'),      sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: "Women's Wear", slug: 'womens-wear',   image: null, description: null, parent_id: catId('fashion'),      sort_order: 2, is_active: true, created_at: now, updated_at: now },
    ], {});

    const [allCats] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM categories ORDER BY id`
    );
    const cid = slug => allCats.find(c => c.slug === slug).id;

    // ── 4. Brands ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('brands', [
      { name: 'Apple',   slug: 'apple',   logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', is_active: true, created_at: now, updated_at: now },
      { name: 'Samsung', slug: 'samsung', logo: null, is_active: true, created_at: now, updated_at: now },
      { name: 'OnePlus', slug: 'oneplus', logo: null, is_active: true, created_at: now, updated_at: now },
      { name: 'Nike',    slug: 'nike',    logo: null, is_active: true, created_at: now, updated_at: now },
      { name: 'Sony',    slug: 'sony',    logo: null, is_active: true, created_at: now, updated_at: now },
      { name: 'Penguin', slug: 'penguin', logo: null, is_active: true, created_at: now, updated_at: now },
    ], {});

    const [brands] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM brands ORDER BY id`
    );
    const bid = slug => brands.find(b => b.slug === slug).id;

    // ── 5. Vendor Profile ─────────────────────────────────────────
    await queryInterface.bulkInsert('vendor_profiles', [
      {
        user_id: vendorUserId,
        store_name: 'TechZone India', store_slug: 'techzone-india',
        description: 'Premium electronics at best prices.',
        status: 'active', commission_rate: 10.00,
        bank_details: null, pan: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5',
        is_verified: true, total_products: 0, total_revenue: 0, rating: 0, review_count: 0,
        created_at: now, updated_at: now,
      },
    ], {});

    const [[vendor]] = await queryInterface.sequelize.query(
      `SELECT id FROM vendor_profiles WHERE user_id = ${vendorUserId}`
    );
    const vendorId = vendor.id;

    // ── 6. Products ───────────────────────────────────────────────
    await queryInterface.bulkInsert('products', [
      {
        name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max',
        description: 'The most powerful iPhone ever with A17 Pro chip, titanium design, and a 48MP main camera.',
        short_description: 'A17 Pro chip · 48MP camera · Titanium design',
        category_id: cid('smartphones'), brand_id: bid('apple'),
        status: 'active', is_featured: true, is_digital: false, has_variants: true,
        base_price: 134900.00, sale_price: null, tax_rate: 18,
        tags: JSON.stringify(['apple','iphone','5g','flagship']),
        weight: 0.221, review_count: 128, rating: 4.80,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
      {
        name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra',
        description: 'Galaxy AI on the most advanced Galaxy ever. 200MP camera, built-in S Pen, and Snapdragon 8 Gen 3.',
        short_description: '200MP camera · Snapdragon 8 Gen 3 · S Pen included',
        category_id: cid('smartphones'), brand_id: bid('samsung'),
        status: 'active', is_featured: true, is_digital: false, has_variants: true,
        base_price: 129999.00, sale_price: 119999.00, tax_rate: 18,
        tags: JSON.stringify(['samsung','galaxy','5g','flagship','ai']),
        weight: 0.232, review_count: 89, rating: 4.65,
        created_by: adminId, vendor_id: vendorId,
        created_at: now, updated_at: now,
      },
      {
        name: 'OnePlus 12', slug: 'oneplus-12',
        description: 'Hasselblad camera system, Snapdragon 8 Gen 3, and 100W SUPERVOOC charging.',
        short_description: 'Snapdragon 8 Gen 3 · 100W charging · Hasselblad camera',
        category_id: cid('smartphones'), brand_id: bid('oneplus'),
        status: 'active', is_featured: false, is_digital: false, has_variants: true,
        base_price: 64999.00, sale_price: 59999.00, tax_rate: 18,
        tags: JSON.stringify(['oneplus','5g','fast-charging']),
        weight: 0.220, review_count: 54, rating: 4.55,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
      {
        name: 'Sony WH-1000XM5 Headphones', slug: 'sony-wh-1000xm5',
        description: 'Industry-leading noise cancellation with 8 microphones. 30-hour battery, Multipoint connection.',
        short_description: 'Best-in-class ANC · 30hr battery · 8 mic array',
        category_id: cid('audio'), brand_id: bid('sony'),
        status: 'active', is_featured: true, is_digital: false, has_variants: false,
        base_price: 29990.00, sale_price: 24990.00, tax_rate: 18,
        tags: JSON.stringify(['sony','headphones','anc','wireless']),
        weight: 0.250, review_count: 203, rating: 4.70,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
      {
        name: 'Nike Air Max 270', slug: 'nike-air-max-270',
        description: 'React foam and Air Max cushioning for all-day comfort. Breathable mesh upper.',
        short_description: 'Air Max unit · React foam · Mesh upper',
        category_id: cid('mens-wear'), brand_id: bid('nike'),
        status: 'active', is_featured: false, is_digital: false, has_variants: true,
        base_price: 12995.00, sale_price: 9995.00, tax_rate: 12,
        tags: JSON.stringify(['nike','shoes','running','lifestyle']),
        weight: 0.400, review_count: 312, rating: 4.40,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
      {
        name: 'Atomic Habits', slug: 'atomic-habits',
        description: 'James Clear\'s #1 New York Times bestseller. An easy and proven way to build good habits and break bad ones.',
        short_description: 'James Clear · Habit formation · NYT Bestseller',
        category_id: cid('books'), brand_id: bid('penguin'),
        status: 'active', is_featured: false, is_digital: false, has_variants: false,
        base_price: 799.00, sale_price: 499.00, tax_rate: 0,
        tags: JSON.stringify(['books','self-help','habits','bestseller']),
        weight: 0.300, review_count: 891, rating: 4.90,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
      {
        name: 'MacBook Air M3', slug: 'macbook-air-m3',
        description: 'Supercharged by M3 chip with 18-hour battery life. Available in 13 and 15 inch.',
        short_description: 'M3 chip · 18hr battery · 15" display',
        category_id: cid('laptops'), brand_id: bid('apple'),
        status: 'active', is_featured: true, is_digital: false, has_variants: true,
        base_price: 114900.00, sale_price: null, tax_rate: 18,
        tags: JSON.stringify(['apple','macbook','laptop','m3']),
        weight: 1.240, review_count: 67, rating: 4.85,
        created_by: adminId, vendor_id: null,
        created_at: now, updated_at: now,
      },
    ], {});

    const [products] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM products ORDER BY id`
    );
    const pid = slug => products.find(p => p.slug === slug).id;

    // ── 7. Product Variants ───────────────────────────────────────
    const variants = [];

    // iPhone 15 Pro Max
    for (const [storage, price] of [['256GB', 134900], ['512GB', 149900], ['1TB', 164900]]) {
      variants.push({
        product_id: pid('iphone-15-pro-max'), sku: `IPH15PM-${storage}`,
        name: `iPhone 15 Pro Max ${storage}`, price, sale_price: null,
        attributes: JSON.stringify({ storage }), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    // Samsung S24 Ultra
    for (const [storage, price, salePrice] of [['256GB', 129999, 119999], ['512GB', 144999, 134999]]) {
      variants.push({
        product_id: pid('samsung-galaxy-s24-ultra'), sku: `SGS24U-${storage}`,
        name: `Galaxy S24 Ultra ${storage}`, price, sale_price: salePrice,
        attributes: JSON.stringify({ storage }), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    // OnePlus 12
    for (const [ram, storage, price, salePrice] of [['12GB', '256GB', 64999, 59999], ['16GB', '512GB', 69999, 64999]]) {
      variants.push({
        product_id: pid('oneplus-12'), sku: `OP12-${ram}-${storage}`,
        name: `OnePlus 12 ${ram}+${storage}`, price, sale_price: salePrice,
        attributes: JSON.stringify({ ram, storage }), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    // Nike shoes
    for (const [size, price] of [['UK7', 9995], ['UK8', 9995], ['UK9', 9995], ['UK10', 9995], ['UK11', 10995]]) {
      variants.push({
        product_id: pid('nike-air-max-270'), sku: `NIKEAM270-${size}`,
        name: `Air Max 270 ${size}`, price, sale_price: null,
        attributes: JSON.stringify({ size }), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    // MacBook Air M3
    for (const [ram, storage, price] of [['8GB', '256GB', 114900], ['16GB', '512GB', 144900], ['16GB', '1TB', 164900]]) {
      variants.push({
        product_id: pid('macbook-air-m3'), sku: `MBA-M3-${ram}-${storage}`,
        name: `MacBook Air M3 ${ram}/${storage}`, price, sale_price: null,
        attributes: JSON.stringify({ ram, storage }), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    // No-variant products get a single default variant
    for (const [slug, sku, price, salePrice] of [
      ['sony-wh-1000xm5', 'SONY-WH1000XM5', 29990, 24990],
      ['atomic-habits',   'BOOK-ATOMIC-HABITS', 799, 499],
    ]) {
      variants.push({
        product_id: pid(slug), sku, name: 'Default', price, sale_price: salePrice,
        attributes: JSON.stringify({}), sort_order: 0,
        is_active: true, created_at: now, updated_at: now,
      });
    }

    await queryInterface.bulkInsert('product_variants', variants, {});

    const [variantRows] = await queryInterface.sequelize.query(
      `SELECT id, sku FROM product_variants ORDER BY id`
    );
    const vid = sku => variantRows.find(v => v.sku === sku).id;

    // ── 8. Product Images ─────────────────────────────────────────
    await queryInterface.bulkInsert('product_images', [
      { product_id: pid('iphone-15-pro-max'),       url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', alt: 'iPhone 15 Pro Max', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('samsung-galaxy-s24-ultra'), url: 'https://images.unsplash.com/photo-1706439756295-2fa1f8c0ff9b?w=600', alt: 'Samsung Galaxy S24 Ultra', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('oneplus-12'),               url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600', alt: 'OnePlus 12', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('sony-wh-1000xm5'),          url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600', alt: 'Sony WH-1000XM5', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('nike-air-max-270'),         url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', alt: 'Nike Air Max 270', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('atomic-habits'),            url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', alt: 'Atomic Habits', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
      { product_id: pid('macbook-air-m3'),           url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', alt: 'MacBook Air M3', is_primary: true,  sort_order: 0, created_at: now, updated_at: now },
    ], {});

    // ── 9. Inventory ──────────────────────────────────────────────
    const inventoryRows = variantRows.map(v => ({
      variant_id: v.id,
      warehouse_id: 'default',
      qty_on_hand: 50 + Math.floor(Math.random() * 150),
      qty_reserved: 0,
      low_stock_threshold: 5,
      created_at: now, updated_at: now,
    }));
    await queryInterface.bulkInsert('inventory', inventoryRows, {});

    // ── 10. CMS: Banners ──────────────────────────────────────────
    await queryInterface.bulkInsert('banners', [
      {
        title: 'New iPhone 15 Pro Max', subtitle: 'Starting at ₹1,34,900',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200',
        mobil_image: null, link: '/products/iphone-15-pro-max',
        cta_label: 'Shop Now', position: 'hero', is_active: true, sort_order: 1,
        start_date: null, end_date: null, bg_color: null, created_at: now, updated_at: now,
      },
      {
        title: 'Up to 40% Off on Sony Audio', subtitle: 'Limited time offer',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
        mobil_image: null, link: '/products?category=audio',
        cta_label: 'Explore Deals', position: 'hero', is_active: true, sort_order: 2,
        start_date: null, end_date: null, bg_color: null, created_at: now, updated_at: now,
      },
      {
        title: 'Free Shipping', subtitle: 'On orders above ₹999',
        image: null, mobil_image: null, link: null,
        cta_label: null, position: 'promotional', is_active: true, sort_order: 1,
        start_date: null, end_date: null, bg_color: null, created_at: now, updated_at: now,
      },
    ], {});

    // ── 11. CMS: Announcement ─────────────────────────────────────
    await queryInterface.bulkInsert('announcements', [
      {
        message: '🎉 Grand Opening Sale — Use code LAGAAO10 for 10% off your first order!',
        type: 'promo', link: '/products', link_label: 'Shop Now',
        is_active: true, expires_at: null,
        created_at: now, updated_at: now,
      },
    ], {});

    // ── 12. CMS: Blog ─────────────────────────────────────────────
    await queryInterface.bulkInsert('blog_posts', [
      {
        title: 'Top 5 Smartphones of 2024', slug: 'top-5-smartphones-2024',
        excerpt: 'We tested the best flagship phones of the year so you don\'t have to.',
        content: '<p>The smartphone market in 2024 has been more competitive than ever...</p>',
        cover_image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        author_id: adminId, status: 'published', tags: JSON.stringify(['smartphones','review','2024']),
        published_at: now, meta_title: null, meta_description: null, view_count: 0,
        created_at: now, updated_at: now,
      },
      {
        title: 'How to Build Better Habits in 30 Days', slug: 'better-habits-30-days',
        excerpt: 'Inspired by Atomic Habits — practical steps you can start today.',
        content: '<p>James Clear\'s framework distilled into 5 actionable habits...</p>',
        cover_image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800',
        author_id: adminId, status: 'published', tags: JSON.stringify(['productivity','habits','books']),
        published_at: now, meta_title: null, meta_description: null, view_count: 0,
        created_at: now, updated_at: now,
      },
    ], {});

    // ── 13. CMS: Static Pages ─────────────────────────────────────
    const [cmsCols] = await queryInterface.sequelize.query('DESCRIBE cms_pages');
    const cmsColNames = cmsCols.map(c => c.Field);
    const cmsPageBase = (title, slug, content, metaTitle, metaDesc) => {
      const row = { title, slug, content, meta_title: metaTitle, meta_description: metaDesc, created_at: now, updated_at: now };
      if (cmsColNames.includes('is_published')) row.is_published = true;
      if (cmsColNames.includes('status')) row.status = 'published';
      return row;
    };
    await queryInterface.bulkInsert('cms_pages', [
      cmsPageBase('About Us', 'about',
        '<h2>About Lagaao</h2><p>Lagaao is India\'s smartest marketplace, powered by AI.</p>',
        'About Lagaao', 'Learn about Lagaao — India\'s AI-powered marketplace.'),
      cmsPageBase('Privacy Policy', 'privacy',
        '<h2>Privacy Policy</h2><p>We take your privacy seriously...</p>',
        'Privacy Policy — Lagaao', 'Lagaao privacy policy.'),
    ], {});

    // ── 14. Coupons ───────────────────────────────────────────────
    const couponExpiry = new Date(now);
    couponExpiry.setMonth(couponExpiry.getMonth() + 3);

    await queryInterface.bulkInsert('coupons', [
      {
        code: 'LAGAAO10', type: 'percent', value: 10, min_order_value: 999.00,
        max_discount: 500.00, max_uses: 1000, used_count: 0, max_uses_per_user: 1,
        expires_at: couponExpiry, is_active: true,
        created_at: now, updated_at: now,
      },
      {
        code: 'FLAT200', type: 'fixed', value: 200, min_order_value: 1499.00,
        max_discount: 200.00, max_uses: 500, used_count: 0, max_uses_per_user: 1,
        expires_at: couponExpiry, is_active: true,
        created_at: now, updated_at: now,
      },
      {
        code: 'FREESHIP', type: 'shipping', value: 100, min_order_value: 499.00,
        max_discount: 100.00, max_uses: null, used_count: 0, max_uses_per_user: null,
        expires_at: null, is_active: true,
        created_at: now, updated_at: now,
      },
    ], {});

    console.log('✅ Demo seed complete');
    console.log('   admin@lagaao.com    | Password@123 | super_admin');
    console.log('   vendor@lagaao.com   | Password@123 | vendor');
    console.log('   customer@lagaao.com | Password@123 | customer');
  },

  async down(queryInterface) {
    // Reverse order to respect FK constraints
    await queryInterface.bulkDelete('coupons',          null, {});
    await queryInterface.bulkDelete('cms_pages',        null, {});
    await queryInterface.bulkDelete('blog_posts',       null, {});
    await queryInterface.bulkDelete('announcements',    null, {});
    await queryInterface.bulkDelete('banners',          null, {});
    await queryInterface.bulkDelete('inventory',        null, {});
    await queryInterface.bulkDelete('product_images',   null, {});
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('products',         null, {});
    await queryInterface.bulkDelete('vendor_profiles',  null, {});
    await queryInterface.bulkDelete('brands',           null, {});
    await queryInterface.bulkDelete('categories',       null, {});
    await queryInterface.bulkDelete('addresses',        null, {});
    await queryInterface.bulkDelete('users',            null, {});
  },
};
