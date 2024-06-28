module.exports = async (req, res, next) => {
    if (req.session.hasOwnProperty("user")) {
        global.adminData = req.session.user;
    }
    return next();
}