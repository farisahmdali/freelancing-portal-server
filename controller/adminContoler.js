const bcrypt = require("bcrypt");
const {
  getAdmin,
  getAllUsers,
  deleteUser,
  getAllPosts,
  deleteSpecificPost,
  blockUser,
  reportGotForUser,
  paid,
  chart,
} = require("../helpers/helper");
const jwt = require("jsonwebtoken");

module.exports = {
  adminLogin: async (req, res) => {
    let admin = await getAdmin(req.query.email);
    let validation;
    if (admin) {
      validation = await bcrypt.compare(req.query.password, admin?.password);
    }
    if (validation) {
      let token = jwt.sign(
        { _id: admin._id, isAdmin: true },
        process.env.SECRET_CODE,
        { expiresIn: "24h" }
      );
      res.send({ token });
    } else {
      res.sendStatus(403);
    }
  },
  getUser: async (req, res) => {
    let {result,payment} = await getAllUsers();
    res.send({ result,payment });
  },
  deleteUser: async (req, res) => {
    await deleteUser(req.body._id);
    res.sendStatus(200);
  },
  blockUser: async (req, res) => {
    await blockUser(req.body._id,req.body.event);
    res.sendStatus(200);
  },
  getPosts: async (req, res, next) => {
    req._id = req.query.id;
    let reports =await reportGotForUser(req._id)
    req.query.reports = reports?.reports
    next();
  },
  deletePost: (req, res) => {
    deleteSpecificPost(req.params.userId, req.params.postId);
    res.sendStatus(200);
  },
  editPost: (req, res, next) => {
    req._id = req.body.userId;
    next();
  },
  updateUserHandle:(req,res,next)=>{
    console.log(req.body);
    req._id=req.body.userId
    next()
  },
  paid:async(req,res)=>{
    try{

      paid(req.body.withdrawId)
      res.sendStatus(200)
    }catch(err){
      console.log(err)
      res.send(500)
    }
  },
  chartDetails:async (req,res)=>{
  let data = await chart()
  res.send(data)
  }
};
