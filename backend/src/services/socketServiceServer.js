// services/socketServiceServer.js
let _io = null;

exports.setIo = (io) => {
  _io = io;
};

exports.getIo = () => _io;
