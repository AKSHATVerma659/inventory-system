const { User, Role } = require('../models');
const bcrypt = require('bcrypt'); // 🔥 direct bcrypt
const { generateToken } = require('../utils/jwt');

/* ================= REGISTER (UNCHANGED) ================= */

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash });

    try {
      const userCount = await User.count();
      if (userCount === 1) {
        const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
        if (adminRole) await user.addRole(adminRole);
      } else {
        const userRole = await Role.findOne({ where: { name: 'USER' } });
        if (userRole) await user.addRole(userRole);
      }
    } catch (err) {
      console.warn('Role assignment skipped:', err.message);
    }

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ================= LOGIN (DEBUG VERSION) ================= */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: Role
    });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👉 EMAIL:', email);
    console.log('👉 PASSWORD FROM REQUEST:', password);
    console.log('👉 HASH FROM DB:', user.password_hash);

    // 🔥 DIRECT bcrypt comparison
    const isMatch = await bcrypt.compare(password, user.password_hash);

    console.log('👉 BCRYPT MATCH RESULT:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roles = user.roles.map(r => r.name);
    const token = generateToken({ id: user.id, roles });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles
      }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};
