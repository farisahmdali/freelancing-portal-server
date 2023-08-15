var express = require("express");
var router = express.Router();
const { createMulter, verifyJwt, verifyJwtget, verifyJwtParams } = require("../middleware/middleware");
const { loginUser, register, checkUsername, otp, updateUser, imageUpload, createPost, updatePosts, getUserPost, getPostData, getAllPosts, deletePosts, PostDataBrowse, requestToAPost, approvePost, getUserDetails, notificaton, postUpdationOfWork, uploadFile, deleteRequestOfAPost, payment, saved, orderPayment, AddCredit, withdraw, transferMoney, folder, report, sendOtpGmail, changePassword, rate } = require("../controller/userControler");



const upload = createMulter();


router.get("/",(req,res)=>{
    console.log("hello");
    res.send("hello");
})
router.post("/login", loginUser);
router.post("/register",register);
router.post("/checkUsername",checkUsername);
router.post("/otp",otp);
router.patch("/updateUser/:token", verifyJwtParams,updateUser);
router.post("/imageUpload", upload.single("file"), imageUpload);
router.post("/createPosts",verifyJwt, createPost);
router.patch("/updatePost/:postId",verifyJwt, updatePosts);
router.delete("/deletePost/:postId",verifyJwtget, deletePosts);
router.get("/Posts", verifyJwtget, getUserPost);
router.get("/getPostData", verifyJwtget,getPostData);
router.get("/PostDataBrowse", verifyJwtget,PostDataBrowse);
router.get("/getPosts",verifyJwtget,getAllPosts)
router.post("/requestToAPost",verifyJwt,requestToAPost)
router.post("/approvePost",verifyJwt,approvePost)
router.get("/userDetails",verifyJwtget,getUserDetails)
router.get("/notifications",verifyJwtget,notificaton)
router.post("/postUpdationOfWork",verifyJwt,postUpdationOfWork)
router.post("/postFiles",upload.single("file"),uploadFile)
router.delete("/deleteRequestOfAPost/:usersId/:postId",verifyJwtget,deleteRequestOfAPost)
router.get('/getSavedPosts',verifyJwtget,saved);
router.get("/orderPayment",orderPayment);
router.post("/addCreditForUser",verifyJwt,AddCredit);
router.post("/withdraw",verifyJwt,withdraw);
router.post("/transferCredit",verifyJwt,transferMoney)
router.get("/folder",verifyJwtget,folder);
router.post("/report",verifyJwt,report);
router.post("/sendOtpGmail",sendOtpGmail);
router.post("/changePassword",changePassword);
router.post("/rate",verifyJwt,rate);


  
module.exports = router;
