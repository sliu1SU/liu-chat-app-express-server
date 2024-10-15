function authMW() {
    return async function (req, res, next){
        console.log('auth middleware is called!');
        if (req.path === "/login/" || req.path === "/signup/") {
            // let the req through
            //next();
            return res.status(401).end();
        }
        if (req.cookies["authToken"]) {
            next();
        } else {
            res.status(401).end();
        }
    }
}

module.exports = authMW;