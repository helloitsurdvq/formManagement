const roleMiddleware = (req, res, next) => {
    const role = req.user?.type_of_account || req.user?.role;

    if (role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admin credentials required." });
    }
};
module.exports = roleMiddleware;