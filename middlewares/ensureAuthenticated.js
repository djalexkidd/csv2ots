// Le middleware  `ensureAuthenticated` vérifie qu'il y a un user stocké dans session
// si ce n'est pas le cas renvoie false et redirige vers le login
export default (req, res, next) => {
    if (req.isAuthenticated() || process.env.LDAP_ENABLE === "false") { return next(); }
    res.redirect('/login');
};