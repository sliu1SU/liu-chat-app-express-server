// cookies duration
const cookiesDuration = 1000 * 30 * 60;

function authMW() {
    return async function (req, res, next){
        if (req.path === "/login/" || req.path === "/signup/"
            || req.path === "/logoff/") {
            // let the req through
            next();
            return;
        }
        if (req.cookies["authToken"]) {
            //console.log('cookie available!');
            const token = req.cookies["authToken"];
            res.cookie("authToken", token, {maxAge: cookiesDuration});
            next();
        } else {
            res.status(401).end();
        }
    }
}

module.exports = authMW;