import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // Users
  // ============================================
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
  const staffPassword = await bcrypt.hash('Staff@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@suoidahongiao.vn' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@suoidahongiao.vn',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@suoidahongiao.vn' },
    update: {},
    create: {
      email: 'staff@suoidahongiao.vn',
      name: 'Nhân viên',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  console.log('✅ Users created:', { admin: admin.email, staff: staff.email });

  // ============================================
  // Categories
  // ============================================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mon-chinh' },
      update: {},
      create: { name: 'Món chính', slug: 'mon-chinh', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'mon-nuong' },
      update: {},
      create: { name: 'Món nướng', slug: 'mon-nuong', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'com-canh' },
      update: {},
      create: { name: 'Cơm – Canh', slug: 'com-canh', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'rau' },
      update: {},
      create: { name: 'Rau', slug: 'rau', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'nuoc-uong' },
      update: {},
      create: { name: 'Nước uống', slug: 'nuoc-uong', sortOrder: 5 },
    }),
  ]);

  console.log('✅ Categories created:', categories.map((c) => c.name));

  // ============================================
  // Products with mouth-watering photography
  // ============================================
  const products = [
    // Món chính
    {
      name: 'Gà nướng Hòn Giao',
      price: 250000,
      description: 'Gà đồi nướng than hoa ướp gia vị đặc biệt Hòn Giao, thơm lừng, da giòn rụm, thịt ngọt mềm. Phục vụ kèm muối ớt xanh.',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      sortOrder: 1,
    },
    {
      name: 'Cá suối chiên giòn',
      price: 180000,
      description: 'Cá suối tươi đánh bắt tại Hòn Giao, chiên giòn vàng ươm, dậy mùi thơm. Ăn kèm rau rừng và nước mắm chua ngọt.',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      sortOrder: 2,
    },
    {
      name: 'Heo rừng xào lăn',
      price: 220000,
      description: 'Thịt heo rừng xào lăn với sả, ớt hiểm, lá lốt. Đậm đà, thơm nức mũi, ăn kèm cơm nóng.',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      sortOrder: 3,
    },
    {
      name: 'Lẩu gà lá é',
      price: 350000,
      description: 'Lẩu gà ta nấu với lá é tươi, nấm rừng, măng giòn. Nước lẩu ngọt thanh, the cay thơm nồng đặc trưng.',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      sortOrder: 4,
    },

    // Món nướng
    {
      name: 'Gà nướng nguyên con',
      price: 350000,
      description: 'Gà đồi nguyên con nướng than hồng, phết mật ong rừng Hòn Giao, da giòn óng ả.',
      image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      sortOrder: 1,
    },
    {
      name: 'Cá lóc nướng trui',
      price: 200000,
      description: 'Cá lóc đồng nướng trui rơm cuốn bánh tráng, rau sống thơm nức, chấm mắm nêm đậm đà.',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      sortOrder: 2,
    },
    {
      name: 'Bắp nướng mỡ hành',
      price: 30000,
      description: 'Bắp nếp ngọt dẻo nướng than hoa, rưới mỡ hành phi thơm phức tép mỡ giòn.',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      sortOrder: 3,
    },
    {
      name: 'Khoai lang mật nướng',
      price: 25000,
      description: 'Khoai lang mật nướng than củi, tươm mật dẻo quánh, bùi ngọt tự nhiên.',
      image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      sortOrder: 4,
    },

    // Cơm – Canh
    {
      name: 'Cơm lam nướng ống tre',
      price: 35000,
      description: 'Cơm nếp nương nướng trong ống tre nứa thơm lừng, dẻo ngọt chấm muối mè đậu phộng.',
      image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[2].id,
      sortOrder: 1,
    },
    {
      name: 'Cơm trắng gạo dẻo',
      price: 15000,
      description: 'Cơm trắng dẻo thơm nấu từ gạo lúa mới vùng thung lũng Hòn Giao.',
      image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[2].id,
      sortOrder: 2,
    },
    {
      name: 'Canh rau rừng cá suối',
      price: 80000,
      description: 'Canh chua thanh tao nấu cá suối tự nhiên với rau rừng tươi, cà chua bi, thơm non.',
      image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[2].id,
      sortOrder: 3,
    },

    // Rau
    {
      name: 'Rau rừng luộc kho quẹt',
      price: 65000,
      description: 'Đĩa rau rừng tổng hợp tươi non hái sớm mai, luộc giòn chấm niêu kho quẹt tôm thịt.',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[3].id,
      sortOrder: 1,
    },
    {
      name: 'Rau muống xào tỏi đập dập',
      price: 45000,
      description: 'Rau muống xanh mướt giòn rụm xào lửa lớn với tỏi quê đập dập thơm lừng.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[3].id,
      sortOrder: 2,
    },
    {
      name: 'Nộm hoa chuối rừng tai heo',
      price: 75000,
      description: 'Hoa chuối rừng thái mỏng giòn sần sật trộn tai heo, rau răm, lạc rang giã dập.',
      image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[3].id,
      sortOrder: 3,
    },

    // Nước uống
    {
      name: 'Nước suối khoáng lạnh',
      price: 15000,
      description: 'Nước suối nguồn tinh khiết ướp lạnh sảng khoái.',
      image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      sortOrder: 1,
    },
    {
      name: 'Trà thảo mộc Hòn Giao',
      price: 25000,
      description: 'Trà thảo mộc núi rừng nấu từ hoa cúc, la hán, cam thảo mát gan giải nhiệt.',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      sortOrder: 2,
    },
    {
      name: 'Nước mía tắc ép tươi',
      price: 25000,
      description: 'Nước mía tươi ép tại chỗ kèm tắc thơm mát lạnh giải khát.',
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      sortOrder: 3,
    },
    {
      name: 'Bia Sài Gòn Special',
      price: 28000,
      description: 'Bia lon ướp lạnh sâu, bọt mịn êm đằm.',
      image: 'https://images.unsplash.com/photo-1608270172551-8651b3d5b51b?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      sortOrder: 4,
    },
    {
      name: 'Bia Tiger Crystal',
      price: 32000,
      description: 'Bia Tiger bạc sảng khoái mát lạnh cực đã.',
      image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      sortOrder: 5,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          image: product.image,
          price: product.price,
          description: product.description,
        },
      });
    } else {
      await prisma.product.create({ data: product });
    }
  }

  console.log('✅ Products updated with appetizing images:', products.length, 'items');

  // ============================================
  // Tables
  // ============================================
  const tables = [
    { number: 1, name: 'Bàn 01' },
    { number: 2, name: 'Bàn 02' },
    { number: 3, name: 'Bàn 03' },
    { number: 4, name: 'Bàn 04' },
    { number: 5, name: 'Bàn 05' },
    { number: 6, name: 'Bàn 06' },
    { number: 7, name: 'Bàn 07' },
    { number: 8, name: 'Bàn 08' },
    { number: 9, name: 'Bàn 09' },
    { number: 10, name: 'Bàn 10' },
    { number: 11, name: 'Phòng VIP 01' },
    { number: 12, name: 'Phòng VIP 02' },
  ];

  for (const table of tables) {
    await prisma.restaurantTable.upsert({
      where: { number: table.number },
      update: {},
      create: table,
    });
  }

  console.log('✅ Tables created:', tables.length, 'tables');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
