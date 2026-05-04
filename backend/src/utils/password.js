const bcrypt = require('bcrypt');

exports.hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, 10);
};

exports.comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;

  return await bcrypt.compare(
    String(plainPassword),
    String(hashedPassword)
  );
};
