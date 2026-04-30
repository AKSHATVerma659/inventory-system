const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models (temporary for testing)
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    // Ensure basic roles exist
    try {
      const { Role } = require('./models');
      await Role.findOrCreate({ where: { name: 'ADMIN' } });
      await Role.findOrCreate({ where: { name: 'USER' } });
      console.log('✅ Roles seeded');
    } catch (err) {
      console.warn('⚠️ Role seeding skipped:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();
