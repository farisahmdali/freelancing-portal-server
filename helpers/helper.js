var db = require("../config/mongodb");
var decode = require("jwt-decode");
var bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

module.exports = {
  checkEmail: async (data) => {
    let user = await db.get().collection("users").findOne({ username: data });

    user ? (user = "user exist") : (user = data);
    return user;
  },
  Register: async (data) => {
    let { password, key } = data;
    let cred = decode(data.cred);
    cred = {
      username: cred.email,
      pic: cred.picture,
      name: cred.name,
      password: "",
    };
    cred.password = await bcrypt.hash(password, 2);
    db.get()
      .collection("users")
      .insertOne(cred)
      .then((res) => (cred._id = res.insertedId));
    return cred;
  },
  loginGoogle: async (username) => {
    let user = await db.get().collection("users").findOne({ username });
    let reports = await db
      .get()
      .collection("reports")
      .findOne({ _id: ObjectId(user._id) });
    user.reports = reports;
    return { valid: true, user };
  },
  login: async (username, passwod) => {
    let user = await db.get().collection("users").findOne({ username });
    let reports = await db
      .get()
      .collection("reports")
      .findOne({ _id: ObjectId(user._id) });
    user.reports = reports;
    if (user) {
      let valid = await bcrypt.compare(passwod, user.password);
      // delete user.password
      return { valid, user };
    } else {
      return false;
    }
  },
  checkEmailjwt: async (data) => {
    let user = await db
      .get()
      .collection("users")
      .findOne({ _id: ObjectId(data) });
    let reports = await db
      .get()
      .collection("reports")
      .findOne({ _id: ObjectId(user._id) });
    user.reports = reports;
    return user;
  },
  updateUser: async (_id, data) => {
    if (data?._id) {
      delete data._id;
    }
    if (data?.username) {
      delete data.username;
    }

    await db
      .get()
      .collection("users")
      .updateOne({ _id: ObjectId(_id) }, { $set: data });
  },
  addPosts: async (id, data) => {
    let exist;
    exist = await db
      .get()
      .collection("posts")
      .findOne({ _id: ObjectId(id) });
    let _id = ObjectId();
    if (exist) {
      await db
        .get()
        .collection("posts")
        .updateOne(
          { _id: ObjectId(id) },
          {
            $push: {
              posts: {
                _id: ObjectId(_id),
                ...data,
              },
            },
          }
        );
    } else {
      await db
        .get()
        .collection("posts")
        .insert({
          _id: ObjectId(id),
          posts: [
            {
              _id,
              ...data,
            },
          ],
        });
    }
    return _id;
  },
  updatePost: (data, _id, userid) => {
    console.log(data, _id, userid);
    const update = {
      $set: {},
    };
    Object.entries(data).forEach(([key, value]) => {
      update.$set[`posts.$.${key}`] = value;
    });
    db.get()
      .collection("posts")
      .updateOne({ _id: ObjectId(userid), "posts._id": ObjectId(_id) }, update);
  },
  getPosts: async (userId) => {
    let posts = [];
    let result = await db
      .get()
      .collection("posts")
      .findOne({ _id: ObjectId(userId) });

    let a = result.posts.length;
    for (let i = 0; i < a; i++) {
      console.log(i);
      posts.push(result.posts.pop());
    }
    console.log(result?.posts.length);

    return posts;
  },
  getAdmin: async (username) => {
    let result = await db.get().collection("admins").findOne({ username });
    return result;
  },
  getAdminbyId: async (_id) => {
    let result = await db
      .get()
      .collection("admins")
      .findOne({ _id: ObjectId(_id) });
    return result;
  },
  getAllUsers: async () => {
    let result = await db.get().collection("users").find({}).toArray();
    let payment = await db.get().collection("withdraw").find({}).toArray();
    return { result, payment };
  },
  deleteUser: async (_id) => {
    await db
      .get()
      .collection("users")
      .deleteOne({ _id: ObjectId(_id) });

    db.get()
      .collection("posts")
      .deleteOne({ _id: ObjectId(_id) });
  },
  blockUser: async (_id, event) => {
    await db
      .get()
      .collection("users")
      .updateOne({ _id: ObjectId(_id) }, { $set: { blocked: event } });

    db.get()
      .collection("posts")
      .deleteOne({ _id: ObjectId(_id) });
  },
  reportGotForUser: async (_id) => {
    let a = await db
      .get()
      .collection("reports")
      .findOne({ _id: ObjectId(_id) });
    return a;
  },
  getAllPosts: async () => {
    let result = await db
      .get()
      .collection("posts")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "data",
          },
        },
      ])
      .toArray();
    let posts = [];
    for (const i of result) {
      for (const j of i.posts) {
        j.username = i.data[0].username;
        j.userId = i._id;
        posts.push(j);
      }
    }

    return posts;
  },
  getSpecificPost: async (userId, _id) => {
    let post = await db
      .get()
      .collection("posts")
      .aggregate([
        { $match: { _id: ObjectId(userId) } },
        { $unwind: "$posts" },
        { $match: { "posts._id": ObjectId(_id) } },
      ])
      .toArray();
    return post[0].posts;
  },
  getBrowseData: async (userId, _id) => {
    let post = await db
      .get()
      .collection("posts")
      .aggregate([
        { $match: { _id: ObjectId(userId) } },
        { $unwind: "$posts" },
        { $match: { "posts._id": ObjectId(_id) } },
      ])
      .toArray();
    let username = await db
      .get()
      .collection("users")
      .findOne({ _id: ObjectId(userId) });
    post[0].posts.user = username;
    return post[0].posts;
  },
  deleteSpecificPost: (userId, id) => {
    try {
      db.get()
        .collection("posts")
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $pull: {
              posts: { _id: ObjectId(id) },
            },
          }
        );
      db.get()
        .collection("users")
        .updateMany({}, { $pull: { requestsSended: { postId: postId } } })
        .then((res) => console.log(res));
    } catch (err) {
      console.log(err);
    }
  },
  getPostsforDashBoard: async (id, applied) => {
    try {
      const page = 1;
      const limit = 8;
      const skip = (page - 1) * limit;
      const totalPosts = await db
        .get()
        .collection("posts")
        .aggregate([
          {
            $group: {
              _id: null,
              totalPosts: {
                $sum: { $size: "$posts" },
              },
            },
          },
        ])
        .toArray();
      if (totalPosts) {
        const shuffledPosts = await db
          .get()
          .collection("posts")
          .aggregate([
            { $match: { _id: { $ne: ObjectId(id) } } },
            { $unwind: "$posts" },
            {
              $match: {
                "posts.approvedTo": { $exists: 0 },
                "posts.requests._id": { $ne: id },
              },
            },
            { $sample: { size: totalPosts[0].totalPosts } }, // Shuffle the order of the posts
            { $skip: skip },
            { $limit: limit },
            {
              $group: {
                _id: 0,
                combinedArray: {
                  $push: {
                    _id: "$posts._id",
                    head: "$posts.head",
                    description: "$posts.description",
                    links: "$posts.links",
                    pic: "$posts.pic",
                    type: "$posts.type",
                    price: "$posts.price",
                    userId: "$_id",
                    requests: "$posts.requests",
                  },
                },
              },
            },
          ])
          .toArray();
        return shuffledPosts[0].combinedArray;
      } else {
        return;
      }
    } catch (e) {
      console.log(e);
      return [];
    }
  },
  requestPost: async (postId, userId, _id, offered, desOfOffered, username) => {
    try {
      await db
        .get()
        .collection("posts")
        .updateOne(
          { _id: ObjectId(userId), "posts._id": ObjectId(postId) },
          {
            $addToSet: {
              "posts.$.requests": { _id, offered, desOfOffered, username },
            },
          }
        );

      await db
        .get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(_id) },
          { $addToSet: { requestsSended: { postId: postId, userId: userId } } }
        );
    } catch (err) {
      console.log(err);
    }

    return;
  },

  approvePost: async (userId, postId, id, amount) => {
    console.log(userId, postId, id, amount);
    await db
      .get()
      .collection("posts")
      .updateOne(
        { _id: ObjectId(userId), "posts._id": ObjectId(postId) },
        { $set: { "posts.$.price": amount } }
      );
    let user = await db
      .get()
      .collection("users")
      .aggregate([
        { $match: { _id: ObjectId(id) } },
        { $project: { username: 1, pic: 1, name: 1, workAs: 1, rating: 1 } },
      ])
      .toArray();

    await db
      .get()
      .collection("posts")
      .updateOne(
        { _id: ObjectId(userId), "posts._id": ObjectId(postId) },
        {
          $set: { "posts.$.approvedTo": user },
          $unset: { "posts.$.requests": 1 },
        }
      );

    await db
      .get()
      .collection("users")
      .updateMany({}, { $pull: { requestsSended: { postId: postId } } })
      .then((res) => console.log(res));

    // let a = await db
    //   .get()
    //   .collection("Connection")
    //   .findOne({
    //     $or: [{ user1: ObjectId(userId) }, { user2: ObjectId(userId) }],
    //     $or: [{ user1: ObjectId(id) }, { user2: ObjectId(id) }],
    //   });
    // if (!a) {
    console.log(userId, id, "new");
    await db
      .get()
      .collection("Connection")
      .insertOne({
        user1: ObjectId(userId),
        user2: ObjectId(id),
        ConnectionPosts: { $push: ObjectId(postId) },
      });
    // } else {
    //   console.log(userId,id,"old");

    //   db.get()
    //     .collection("Connection")
    //     .updateOne(
    //       {
    //         $or: [{ user1: ObjectId(userId) }, { user2: ObjectId(id) }],
    //         $or: [{ user1: ObjectId(id) }, { user2: ObjectId(userId) }],
    //       },
    //       {
    //         $addToSet: { ConnectionPosts: ObjectId(postId) },
    //       }
    //     );
    // }
  },
  getUserDetails: async (userId) => {
    let user = await db
      .get()
      .collection("users")
      .aggregate([
        { $match: { _id: ObjectId(userId) } },
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "_id",
            as: "posts",
          },
        },
        {
          $project: {
            username: 1,
            pic: 1,
            name: 1,
            workAs: 1,
            rating: 1,
            posts: 1,
            rate: 1,
          },
        },
      ])
      .toArray();

    return user[0];
  },
  notification: async (id) => {
    let value = await db
      .get()
      .collection("posts")
      .aggregate([
        { $unwind: "$posts" },
        { $match: { "posts.approvedTo._id": ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
      .toArray();

    let a = await db
      .get()
      .collection("posts")
      .aggregate([
        { $unwind: "$posts" },
        { $match: { "posts.requests._id": id } },
      ])
      .toArray();

    let connection = await db
      .get()
      .collection("Connection")
      .aggregate([
        { $match: { $or: [{ user1: ObjectId(id) }, { user2: ObjectId(id) }] } },
        { $project: { user1: 1, user2: 1 } },
      ])
      .toArray();

    let users = [];

    for (let i in connection) {
      users.push(connection[i].user1);
      users.push(connection[i].user2);
    }

    let connectUsers = await db
      .get()
      .collection("users")
      .aggregate([
        {
          $match: {
            _id: { $ne: ObjectId(id) },
            _id: { $in: users, $ne: ObjectId(id) },
          },
        },
        {
          $project: {
            password: 0,
          },
        },
      ])
      .toArray();

    return { workFlow: value, requests: a, connectUsers };
  },
  postUpdationOfWork: async (postId, data) => {
    try {
      await db
        .get()
        .collection("posts")
        .updateOne(
          { "posts._id": ObjectId(postId) },
          {
            $set: { "posts.$.updation": { ...data } },
          }
        );
    } catch (err) {
      console.log(err);
    }
  },
  deleteRequestOfAPost: async (userId, postId, deletingReqId) => {
    await db
      .get()
      .collection("posts")
      .updateOne(
        { _id: ObjectId(userId), "posts._id": ObjectId(postId) },
        { $pull: { "posts.$.requests": { _id: deletingReqId } } }
      )
      .then((res) => console.log(res));

    db.get()
      .collection("users")
      .updateOne(
        { _id: ObjectId(deletingReqId) },
        { $pull: { requestsSended: { postId: postId } } }
      )
      .then((res) => console.log(res));
  },
  getRoomId: async (user1, user2) => {
    try {
      let roomId = await db
        .get()
        .collection("Connection")
        .aggregate([
          {
            $match: {
              user1: { $in: [ObjectId(user1), ObjectId(user2)] },
              user2: { $in: [ObjectId(user1), ObjectId(user2)] },
            },
          },
        ])
        .toArray();

      console.log("hello", roomId);
      return roomId[0];
    } catch (e) {
      console.log(e);
    }
  },
  chatSaver: (room, user, chat) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay();
    const currentHour = currentDate.getHours();
    let currentMinute = currentDate.getMinutes() + "";
    if (currentMinute.length < 2) {
      currentMinute = 0 + currentMinute;
    }
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Month is zero-based, so we add 1
    const currentDay = currentDate.getDate();

    const currentTime =
      days[currentDayOfWeek] + " , " + currentHour + ":" + currentMinute;
    console.log(currentTime);

    db.get()
      .collection("Connection")
      .updateOne(
        { _id: ObjectId(room) },
        {
          $push: {
            chat: {
              user,
              chat,
              week: days[currentDayOfWeek],
              time: currentHour + ":" + currentMinute,
              date: `${currentYear}-${currentMonth
                .toString()
                .padStart(2, "0")}-${currentDay.toString().padStart(2, "0")}`,
            },
          },
        }
      );
  },

  savedData: async (postId) => {
    for (let i in postId) {
      postId[i] = ObjectId(postId[i]);
    }
    let value = await db
      .get()
      .collection("posts")
      .aggregate([
        { $unwind: "$posts" },
        { $match: { "posts._id": { $in: postId } } },
      ])
      .toArray();

    console.log(value);
    return value;
  },
  addCredit: async (_id, amount) => {
    let credit = await db
      .get()
      .collection("credits")
      .findOne({ _id: ObjectId(_id) });
    if (credit) {
      credit.amount += amount;
    } else {
      credit = {
        amount: amount,
      };
    }
    await db
      .get()
      .collection("credits")
      .updateOne(
        { _id: ObjectId(_id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("users")
      .updateOne(
        { _id: ObjectId(_id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    return;
  },
  withdrawCash: async (_id, amount, data) => {
    let credit = await db
      .get()
      .collection("credits")
      .findOne({ _id: ObjectId(_id) });
    if (credit) {
      if (credit.amount > amount) {
        credit.amount -= amount;
      }
    } else {
      return;
    }
    await db
      .get()
      .collection("credits")
      .updateOne(
        { _id: ObjectId(_id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("users")
      .updateOne(
        { _id: ObjectId(_id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("withdraw")
      .insertOne({ ...data });
    return;
  },

  payment: async (id, clientId, amount, postId) => {
    let credit = await db
      .get()
      .collection("credits")
      .findOne({ _id: ObjectId(id) });
    if (credit) {
      if (credit.amount > amount) {
        credit.amount -= amount;
      } else {
        throw new Error();
      }
    } else {
      throw new Error();
    }
    await db
      .get()
      .collection("credits")
      .updateOne(
        { _id: ObjectId(id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("users")
      .updateOne(
        { _id: ObjectId(id) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );

    let otherCredit = await db
      .get()
      .collection("credits")
      .findOne({ _id: ObjectId(clientId) });
    if (otherCredit) {
      otherCredit.amount += amount;
    } else {
      otherCredit = {
        amount: amount,
      };
    }
    await db
      .get()
      .collection("credits")
      .updateOne(
        { _id: ObjectId(clientId) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("users")
      .updateOne(
        { _id: ObjectId(clientId) },
        { $set: { amount: credit.amount } },
        { upsert: true }
      );
    await db
      .get()
      .collection("posts")
      .updateOne(
        { _id: ObjectId(id), "posts._id": ObjectId(postId) },
        { $set: { "posts.$.paid": true } }
      );
    return;
  },
  isPaid: async (postId) => {
    let value = await db
      .get()
      .collection("posts")
      .aggregate([
        { $unwind: "$posts" },
        { $match: { "posts._id": ObjectId(postId) } },
      ])
      .toArray();
    console.log(value);
    return value[0]?.posts?.paid || false;
  },
  reportHelpers: (userId, msg) => {
    db.get()
      .collection("reports")
      .updateOne(
        { _id: ObjectId(userId) },
        { $push: { reports: msg } },
        { upsert: true }
      )
      .then((res) => console.log(res));
  },
  changePass: async (email, password) => {
    password = await bcrypt.hash(password, 2);
    console.log(password);
    await db
      .get()
      .collection("users")
      .updateOne({ username: email }, { $set: { password: password } })
      .then((res) => console.log(res));
    return;
  },
  paid: (id) => {
    db.get()
      .collection("withdraw")
      .deleteOne({ _id: ObjectId(id) });
  },
  rate: async (value, user) => {
    console.log(value, user);

    let isUser = await db
      .get()
      .collection("users")
      .findOne({ _id: ObjectId(user) });
    if (isUser.rate) {
      db.get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(user) },
          {
            $set: {
              "rate.val": isUser.rate.val + value,
              "rate.count": isUser.rate.count + 1,
            },
          }
        );
    } else {
      db.get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(user) },
          { $set: { "rate.val": value, "rate.count": 1 } }
        );
    }
  },
  chart: async () => {
    const types = [
      "Web Development",
      "UI/UX Design",
      "Civil Engineer",
      "Graphic Designer",
      "App Development",
      "Game Development",
      "Cybersecurity",
      "DevOps",
      "Data Science",
      "Digital Marketing",
      "Content Writing",
      "Mobile Development",
      "Cloud Computing",
      "Machine Learning",
      "Network Engineering",
      "Software Testing",
      "Blockchain Development",
      "Social Media Management",
      "Video Editing",
      "IT Support",
      "Copywriting",
      "E-commerce Development",
      "Motion Graphics",
      "Database Administration",
      "SEO Specialist",
      "AR/VR Development",
      "Product Design",
      "Network Security",
      "Illustration",
      "Email Marketing",
    ];
    let value = [["Task", "Hours per Day"]];
    for (let i in types) {
      let data = await db
        .get()
        .collection("posts")
        .aggregate([
          { $unwind: "$posts" },
          { $match: { "posts.type": types[i] } },
        ])
        .toArray();
      value.push([types[i], data.length]);
    }
    console.log(value);
    return value;
  },
};
