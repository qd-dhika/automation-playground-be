import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics' } }),
    prisma.category.upsert({ where: { name: 'Clothing' }, update: {}, create: { name: 'Clothing' } }),
    prisma.category.upsert({ where: { name: 'Books' }, update: {}, create: { name: 'Books' } }),
    prisma.category.upsert({ where: { name: 'Home & Kitchen' }, update: {}, create: { name: 'Home & Kitchen' } }),
    prisma.category.upsert({ where: { name: 'Sports' }, update: {}, create: { name: 'Sports' } }),
  ]);

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword = await bcrypt.hash('User123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@example.com', password: adminPassword, role: Role.admin },
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: { name: 'Regular User', email: 'user@example.com', password: userPassword, role: Role.user },
  });

  const productData = [
    { name: 'Wireless Headphones', description: 'Premium noise-cancelling wireless headphones', price: 199.99, stock: 50, categoryId: categories[0].id },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical gaming keyboard', price: 89.99, stock: 30, categoryId: categories[0].id },
    { name: 'USB-C Hub', description: '7-in-1 USB-C multiport hub', price: 45.99, stock: 100, categoryId: categories[0].id },
    { name: 'Running Shoes', description: 'Lightweight breathable running shoes', price: 79.99, stock: 60, categoryId: categories[4].id },
    { name: 'Yoga Mat', description: 'Non-slip eco-friendly yoga mat', price: 29.99, stock: 80, categoryId: categories[4].id },
    { name: 'Cotton T-Shirt', description: '100% organic cotton basic tee', price: 19.99, stock: 200, categoryId: categories[1].id },
    { name: 'Denim Jacket', description: 'Classic slim-fit denim jacket', price: 59.99, stock: 45, categoryId: categories[1].id },
    { name: 'Clean Code', description: 'A handbook of agile software craftsmanship', price: 35.99, stock: 25, categoryId: categories[2].id },
    { name: 'The Pragmatic Programmer', description: 'Your journey to mastery', price: 39.99, stock: 20, categoryId: categories[2].id },
    { name: 'Coffee Maker', description: 'Programmable 12-cup drip coffee maker', price: 49.99, stock: 35, categoryId: categories[3].id },
    { name: 'Air Fryer', description: '5.8-quart digital air fryer', price: 89.99, stock: 40, categoryId: categories[3].id },
    { name: 'Bluetooth Speaker', description: 'Portable waterproof bluetooth speaker', price: 59.99, stock: 70, categoryId: categories[0].id },
  ];

  await prisma.product.deleteMany({});
  for (const product of productData) {
    await prisma.product.create({ data: product });
  }

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
