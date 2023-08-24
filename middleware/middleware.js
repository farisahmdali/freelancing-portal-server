const multer = require("multer");
const jwt = require("jsonwebtoken");
const { getAdminbyId } = require("../helpers/helper");
const { OAuth2Client } = require('google-auth-library');

module.exports = {
  createMulter: () => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        console.log("working")
        cb(null, "./routes/file");
      },
      filename: function (req, file, cb) {
        console.log(req.params.name);
        cb(null, file.originalname);
      },
    });

    const upload = multer({ storage: storage });
    return upload;
  },
  jwtAuth:async(token)=>{
    try{

      let user = jwt.verify(token, process.env.SECRET_CODE);
      return user._id
    }catch(err){
      return false
    }
  },
  verifyJwt: async (req, res, next) => {
    try{

      let user = jwt.verify(req.headers.authorization, process.env.SECRET_CODE);
      delete req.body.token;
      req._id = user._id;
      next();
    }catch(err){
      res.send(403);
    }
  },
  verifyJwtParams: async (req, res, next) => {
    try{

      let user = jwt.verify(req.headers.authorization, process.env.SECRET_CODE);
      delete req.body.token;
      req._id = user._id;
      next();
    }catch(err){
      res.send(403);
    }
  },
 verifyTokenGoogle:async(jwtToken)=>{
    try {
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken: jwtToken,
        audience: "992852730562-mmbfql25sfup3qc8188oh1btn6sqerm9.apps.googleusercontent.com", // Replace YOUR_CLIENT_ID with your Google OAuth Client ID
      });
  
      // Get the payload and other information from the token
      const payload = ticket.getPayload();
      console.log('Token is valid.');
      console.log('Issuer:', payload.iss);
      console.log('Audience:', payload.aud);
      console.log('Expiration Time:', payload.exp);
      console.log('Issued At:', payload.iat);
      // Add any other relevant checks here
  
      return payload;
    } catch (error) {
      console.error('Invalid token:', error.message);
      return null;
    }
  },
  verifyJwtget: async (req, res, next) => {
    try {
      let user = jwt.verify(req.headers.authorization, process.env.SECRET_CODE);
      delete req.query.token;
      req._id = user._id;
      next();
    } catch (err) {
      res.send(403);
    }
  },
  errorHandler:function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  },
  portRunning:(port)=>{
    console.log(`server is running on port 5000`)
  },
  verifyJwtAdmin:(req,res,next)=>{
    let user
    if(req.headers.authorization){
         user = jwt.verify(req.headers.authorization, process.env.SECRET_CODE);
    }else{
        res.sendStatus(403);
    }
        let admin = getAdminbyId(user._id)
        if(admin&&user.isAdmin){
            next()
        }else{
            res.sendStatus(403)
        }
  }
};
