export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access restricted: Administrative privileges are required for this endpoint.'
    });
  }
  next();
};

export default adminMiddleware;
