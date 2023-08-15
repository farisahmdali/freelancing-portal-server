var express = require("express");

var router = express.Router();
const { adminLogin, getUser, deleteUser, getPosts, deletePost, editPost, updateUserHandle, blockUser, paid, chartDetails } = require("../controller/adminContoler");
const { verifyJwtAdmin } = require("../middleware/middleware");
const { getAllPosts, getUserPost, updatePosts, updateUser } = require("../controller/userControler");

/* GET users listing. */
router.get("/",adminLogin );
router.get("/user",verifyJwtAdmin,getUser);
router.post("/updateUser",verifyJwtAdmin,updateUserHandle,updateUser)
router.post("/delete",verifyJwtAdmin,deleteUser);
router.post("/block",verifyJwtAdmin,blockUser);
router.get("/userPosts",verifyJwtAdmin,getPosts,getUserPost);
router.delete('/deletePost/:userId/:postId',verifyJwtAdmin,deletePost)
router.patch('/editPost/:postId',verifyJwtAdmin,editPost,updatePosts)
router.post('/paid',verifyJwtAdmin,paid)
router.get('/chart',chartDetails)


module.exports = router;
