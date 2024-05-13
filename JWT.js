//jsonwebtoken:est une bibaliotheque javascript utilisée pour créer et verifier des webtokens(JWT) dans les applications web et les services backend 
const{sign,verify} = require("jsonwebtoken");
const createToken =(utilisateur) =>{
const accessToken = sign(
    {data :utilisateur},"SECRET"
)
return accessToken
}
const validateToken = (req,res,next) =>{
    const accessToken = req.cookies ['access-token']
    console.log(accessToken);
    if(!accessToken) {
        return res.status(400).json({error :"User not Authentificated"})

    }
    try{
        const validToken = verify(accessToken,"SECRET")
        if(validToken) {
            req.authentificated = true
            return next();
        }
        }
        catch(err){
            return res.status(400).json({error :err});
        }
}

module.exports ={createToken , validateToken}