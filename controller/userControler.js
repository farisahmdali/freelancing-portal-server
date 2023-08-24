const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
let otpOfGmails = new Map();
const {
  checkEmail,
  Register,
  login,
  checkEmailjwt,
  updateUser,
  addPosts,
  updatePost,
  getPosts,
  getSpecificPost,
  getPostsforDashBoard,
  deleteSpecificPost,
  getBrowseData,
  requestPost,
  approvePost,
  getUserDetails,
  notification,
  postUpdationOfWork,
  deleteRequestOfAPost,
  loginGoogle,
  savedData,
  addCredit,
  withdrawCash,
  payment,
  isPaid,
  reportHelpers,
  changePass,
  rate,
} = require("../helpers/helper");
const decode = require("jwt-decode");
const twilio = require("twilio");
const cloudinary = require("cloudinary");
const fs = require("fs");
const { verifyTokenGoogle } = require("../middleware/middleware");
const Razorpay = require("razorpay");
const message = async (phone) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000);
  const message = `Your otp number is ${otpCode}`;

  try {
    const response = await client.messages.create({
      body: message,
      from: "+1 217 628 7432",
      to: "+91" + phone,
    });

    console.log("OTP sent successfully:", response.sid);
    return otpCode;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};
const YOUR_DOMAIN = "http://localhost:5000";
const client = twilio(
  "ACa2ba1a7dec604f89d72dd41704d4ea19",
  "75a0d8bb2174bd0161e003f5fb2d5a3a"
);

module.exports = {
  loginUser: async (req, res) => {
    let { username, password, token, cred } = req.body;
    console.log(req.body);
    try {
      let result;

      console.log(req.headers)
      if (req.headers.authorization) {
        try {
          let user = jwt.verify(req.headers.authorization, process.env.SECRET_CODE);
          result = await checkEmailjwt(user._id);
          if (result && !result?.blocked) {
            res.send({ userDetail: result });
          } else {
            res.sendStatus(403);
          }
        } catch (err) {
          res.sendStatus(403);
        }
      } else if (cred) {
        console.log(cred);
        result = await verifyTokenGoogle(cred);
        result = await loginGoogle(result.email);
        console.log(result);
        if (!result?.user?.blocked) {
          token = await jwt.sign(
            { _id: result.user._id },
            process.env.SECRET_CODE,
            {
              expiresIn: "7d",
            }
          );
          res.send({ token, userDetail: result.user });
        } else {
          res.sendStatus(403);
        }
      } else {
        result = await login(username, password);

        if (result?.valid && !result.user?.blocked) {
          token = await jwt.sign(
            { _id: result.user._id },
            process.env.SECRET_CODE,
            {
              expiresIn: "7d",
            }
          );
          res.send({ token, userDetail: result.user });
        } else {
          res.send(403);
        }
      }
    } catch (e) {
      console.log(e);
      res.sendStatus(403);
    }
  },
  register: async (req, res) => {
    let result = await Register(req.body);
    let token = await jwt.sign({ _id: result._id }, process.env.SECRET_CODE, {
      expiresIn: "7d",
    });
    res.send({ result, token });
  },
  checkUsername: async (req, res) => {
    let data = decode(req.body.cred);
    data = data.email;
    let result = await checkEmail(data);
    res.send(result);
  },
  otp: async (req, res) => {
    try {
      let otp = await message(req.body.phone);
      res.send({ otp });
    } catch (err) {
      console.log(err);
      res.send(304);
    }
  },
  updateUser: async (req, res) => {
    try {
      console.log(req._id, req.body.data);
      await updateUser(req._id, req.body.data);
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  },
  imageUpload: async (req, res) => {
    try{
    await cloudinary.config({
      cloud_name: "dmhnwx9jm",
      api_key: "998654874181288",
      api_secret: "HdNo37Mimu1T9ULaJAocqzY036c",
    });
    let url;
    await cloudinary.v2.uploader
      .upload(
        `./routes/file/${req?.file?.originalname}`,
        { public_id: req?.file?.originalname },
        function (error, result) {
          url = result?.url;
          if (error) {
            console.log(error);
          }
        }
      )
      .catch((err) => console.log(er));
    fs.unlink(`./routes/file/${req.file.originalname}`, (err) =>
      console.log(err)
    );
    res.send(200, { url });
      }catch(err) {
        console.log(err)
      }
  },
  createPost: async (req, res) => {
    let result = await addPosts(req._id, req.body.data);
    res.send({ result });
  },
  updatePosts: (req, res) => {
    try{
     updatePost(req.body.data, req.params.postId, req._id);
    res.sendStatus(200);
    }catch(err){
      console.log(err)
      res.send(500)
    }
  },
  getUserPost: async (req, res) => {
    try {
      let result = await getPosts(req._id);
      if (req.query.reports) {
        res.send(200, { result, reports: req.query.reports });
      } else {
        res.send(200, { result });
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(200);
    }
  },
  getPostData: async (req, res) => {
    let { id } = req.query;
    let post = await getSpecificPost(req._id, id);
    res.send({ post });
  },
  PostDataBrowse: async (req, res) => {
    try {
      let { id } = req.query;
      let post = await getBrowseData(req.query.userId, id);
      res.send({ post });
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  getAllPosts: async (req, res) => {
    let result = await getPostsforDashBoard(req._id, req.body.applied);
    res.send(200, { result });
  },
  deletePosts: async (req, res) => {
    deleteSpecificPost(req._id, req.params.postId);
    res.sendStatus(200);
  },
  requestToAPost: async (req, res) => {
    await requestPost(
      req.body.postId,
      req.body.userId,
      req._id,
      req.body.bargin,
      req?.body?.barginDes,
      req.body.username
    );
    res.sendStatus(200);
  },
  approvePost: async (req, res) => {
    try {
      console.log(req.body);
      await approvePost(
        req._id,
        req.body.postId,
        req.body.usersId,
        req.body.amount
      );
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  },
  getUserDetails: async (req, res) => {
    try {
      let user = await getUserDetails(req.query.userId);
      res.status(200).send({ user });
    } catch {
      console.log(err);
      res.sendStatus(500);
    }
  },
  notificaton: async (req, res) => {
    try {
      let data = await notification(req._id);
      res.send({ data });
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  postUpdationOfWork: async (req, res) => {
    try {
      await postUpdationOfWork(req.body.postId, req.body.data);
      res.send(200);
    } catch (err) {}
  },
  uploadFile: (req, res) => {
    res.send(200);
  },
  deleteRequestOfAPost: async (req, res) => {
    await deleteRequestOfAPost(req._id, req.params.postId, req.params.usersId);
    res.send(200);
  },
  saved: async (req, res) => {
    try {
      let data = await savedData(req.query.saved);
      res.send({ data });
    } catch (err) {
      console.log(err);
      res.send(400);
    }
  },
  orderPayment: async (req, res) => {
    try {
      console.log(req.query);
      let instance = new Razorpay({
        key_id: "rzp_test_SZISjiHbBlmqCl",
        key_secret: "gJVoxWoMLN2Q0aP4SftWc0RC",
      });
      instance.orders.create(
        {
          amount: parseInt(req.query.amount),
          currency: "INR",
        },
        (err, order) => {
          if (err) {
            console.log(err);
            return res.send(500)
          } else {
            console.log(order);
            res.send(order);
          }
        }
      );
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  AddCredit: async (req, res) => {
    try {
      console.log(req.body);
      await addCredit(req._id, req.body.amount);
      res.send(200);
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  withdraw: async (req, res) => {
    try {
      console.log(req.body);
      await withdrawCash(req._id, req.body.amount, req.body.data);
      res.send(200);
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  transferMoney: async (req, res) => {
    try {
      console.log(req.body, req._id);
      await payment(req._id, req.body.userId, req.body.amount, req.body.postId);
      res.send(200);
    } catch (er) {
      console.log(er);
      res.send(500);
    }
  },
  folder: async (req, res) => {
    try {
      let a = await isPaid(req.query.postId);
      if (a) {
        console.log(req.query);
        fs.readFile(`./routes/file/${req.query.postId}.zip`, (err, data) => {
          if (err) {
            console.log(err);
            res.status(500).send("Error reading the file.");
          } else {
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${req.query.postId}.zip"`
            );
            res.setHeader("Content-Type", "application/zip");
            res.send(data);
          }
        });
      } else {
        throw new Error();
      }
    } catch (err) {
      console.log(err);
      res.send(401);
    }
  },
  report: async (req, res) => {
    reportHelpers(req.body.userId, req.body.msg,req._id);
  },
  sendOtpGmail: (req, res) => {
    let otp = Math.floor(Math.random() * 5000);
    console.log(otp, process.env.PASS);
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Replace with your email service provider
      auth: {
        user: "mailer22361@gmail.com", // Replace with your email address
        pass: process.env.PASS, // Replace with your email password or an app-specific password
      },
    });

    // Email data
    const mailOptions = {
      from: "mailer22361@gmail.com", // Sender email address
      to: req.body.email, // Recipient email address
      subject: "OTP", // Email subject
      text: `this is the otp fro changing password in your GETDONE website please don't share ${otp}`, // Email body
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    otpOfGmails.set(req.body.email, otp);
  },
  changePassword: async (req, res) => {
    try {
      console.log(otpOfGmails, req.body);
      if (otpOfGmails.get(req.body.email) == req.body.otp) {
        await changePass(req.body.email, req.body.password);
        res.send(200);
      } else {
        res.send(401);
      }
    } catch (err) {
      console.log(err);
      res.send(500);
    }
  },
  rate:(req,res)=>{
    rate(req.body.rating,req.body.userId)
    res.send(200)
  }
};
