var express = require("express");
var router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const upload = require("./multer");
const userModel = require("./users");
const contactModel = require("./feedback");
const reportModel = require("./reports");
const PostModel = require("./posts");
const messageModel = require("./messages");
const mongoose = require("mongoose");
const CommentModel = require("./comment");
const GroupModel = require("./groups");
const nodemailer = require("nodemailer");
const ConnectionModel = require("./connections");
require("dotenv").config();
const passport = require("passport");
const localStrategy = require("passport-local");
const { group } = require("console");
passport.use(new localStrategy(userModel.authenticate()));
router.use(express.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send("No user with that email");
  }
  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL,
    subject: "Password Reset",
    text: `Please click on the following link to reset your password:\n\nhttp://${req.headers.host}/reset/${token}\n\nIf you did not request this, please ignore this email.`,
  };
  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error("Error sending email:", err);
      return res.status(500).send("Error sending email");
    }
    res.status(200).send("An email has been sent to " + user.email);
  });
});
router.get("/reset/:token", async (req, res) => {
  const user = await userModel.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .send("Password reset token is invalid or has expired.");
  }

  res.render("resetpassword", { token: req.params.token });
});

router.post("/reset/:token", async (req, res) => {
  try {
    const user = await userModel.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired.");
    }

    // Using setPassword method
    user.setPassword(req.body.password, async (err) => {
      if (err) {
        return res.status(500).send("Error setting password");
      }
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      // Sending response with a login button
      res.send(`
  <html>
    <body>
      <p>Password has been reset successfully.</p>
      <a href="/login"><button>Login again</button></a>
    </body>
  </html>
`);
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Error resetting password");
  }
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/feeds", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  const users = await userModel.find();
  const posts = await PostModel.find()
    .populate("user")
    .populate({
      path: "comments",
      populate: [
        { path: "user" },
        { path: "replies", populate: { path: "user" } }, // Fetching replies and their users
      ],
    })
    .sort({ createdAt: -1 }); // Fetch all posts and populate user details
  res.render("feeds", { user, posts, users, loggedInUser: user });
});
//route for render forgot password page
router.get("/forgot-password", function (req, res, next) {
  res.render("forgotpassword");
});
// Route to get groups for the logged-in user
router.get("/groups", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("groups")
      .populate({
        path: "groups",
        populate: {
          path: "members creator",
        },
      });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const chats = await messageModel.find({
      senderId: user._id,
      groupId: group._id,
    });
    res.render("group", { user, loggedInUser: user });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// group route
router.post(
  "/create",
  isLoggedIn,
  upload.single("picture"),
  async (req, res) => {
    const username = req.session.passport.user;
    try {
      const user = await userModel.findOne({ username });
      if (!user) {
        return res.status(404).send("User not found");
      }

      const { name, description, members } = req.body;
      const membersArray = members ? members.split(",") : [];

      // Use a Set to ensure unique members
      const uniqueMembersArray = [...new Set(membersArray)];

      // Check if the group name already exists for the user
      const existingGroup = await GroupModel.findOne({ name, creator: user });
      if (existingGroup) {
        return res.status(400).send("Group with this name already exists");
      }

      // Create the new group
      const newGroup = new GroupModel({
        name,
        description,
        creator: user,
        picture: req.file ? req.file.filename : null,
        members: [...uniqueMembersArray],
      });

      // Add the new group to the creator's groups if not already added
      if (!user.groups.includes(newGroup._id)) {
        user.groups.push(newGroup._id);
      }

      // Save the user with updated groups
      await user.save();

      // Add the new group to each member's groups if not already added
      await userModel.updateMany(
        { _id: { $in: uniqueMembersArray } },
        { $addToSet: { groups: newGroup._id } } // Use $addToSet to ensure uniqueness
      );

      // Save the new group
      await newGroup.save();
      res.redirect("/groups"); // Redirect to groups page after creation
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

// Remove a member from a group
router.post("/group/remove-member", async (req, res) => {
  const { groupId, memberId } = req.body;
  // console.log(groupId);
  try {
    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    // Ensure only admin can remove members
    if (!group.creator.equals(req.user._id)) {
      return res.status(403).send("Only admin can remove members");
    }
    group.members.pull(memberId);
    await group.save();
    await userModel.updateOne(
      { _id: memberId },
      { $pull: { groups: groupId } }
    );
    res.status(200).send("Member removed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Leave a group
router.post("/group/leave", async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user._id;
  try {
    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    group.members.pull(userId);
    await group.save();
    await userModel.updateOne({ _id: userId }, { $pull: { groups: groupId } });
    res.status(200).send("Left the group successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// Delete a group
router.delete("/deleteGroup/:groupId", async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    // Ensure only admin can delete the group
    if (!group.creator.equals(req.user._id)) {
      return res.status(403).send(alert("Only admin can delete the group"));
    }
    await userModel.updateMany(
      { _id: { $in: group.members } },
      { $pull: { groups: groupId } }
    );

    await group.deleteOne(group);
    res.send({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error deleting group" });
  }
});

// Route to add a member to an existing group
router.post("/group/add-member", async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    // Find the group by ID
    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    // Check if the user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }
    // Add group to user
    await userModel.findByIdAndUpdate(userId, {
      $addToSet: { groups: groupId },
    });
    // Add the user to the group's members list
    group.members.push(userId);
    await group.save();

    res.status(200).json({ message: "Member added successfully" });
  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Route to get members of a specific group
router.get("/groups/:groupId/members", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await GroupModel.findById(groupId).populate(
      "members creator"
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json({ members: group.members, creator: group.creator });
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/uploadGroupMessage", upload.single("file"), async (req, res) => {
  const { message, senderId, groupId } = req.body;
  const file = req.file ? req.file.filename : null;

  const newMessage = new messageModel({
    message: message,
    senderId: senderId,
    groupId: groupId,
    file: file,
    createdAt: new Date(),
  });
  // console.log(newMessage);
  await newMessage.save();
  const populatedMessage = await newMessage.populate("senderId", "username");
  res
    .status(200)
    .json({ success: true, data: { message, senderId, populatedMessage } });
});
// Fetch messages for a specific group
router.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await messageModel
      .find({ groupId })
      .populate("senderId")
      .sort({ createdAt: 1 });
    // console.log(messages);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/uploadPost", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const postData = await PostModel.create({
    fullname: user.fullname,
    profileImage: user.profileImage,
    content: req.body.textPost,
    user: user._id,
  });
  user.posts.push(postData._id);
  await user.save();
  res.redirect("/feeds");
});

// DELETE route to delete a post by ID
router.delete("/deletePost/:postId", isLoggedIn, async (req, res) => {
  const postId = req.params.postId;
  console.log(postId);
  const user = await userModel.findOne({ username: req.session.passport.user });

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    await post.deleteOne(post);
    user.posts.remove(post);
    await user.save();

    res.send({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error deleting post" });
  }
});
router.get("/searcht", async (req, res) => {
  try {
    // Get the logged-in user's data
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const searchQuery = req.query.q;
    const searchusers = await userModel
      .find({
        _id: { $in: user.friends }, // Filter by friends
        username: new RegExp(searchQuery, "i"),
      })
      .select("username _id");
    res.json(searchusers);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
// Add a comment to a post
router.post("/comment", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await PostModel.findById(req.body.postId);
    const comment = await CommentModel.create({
      fullname: user.fullname,
      user: user._id,
      post: post._id,
      content: req.body.comment,
    });

    post.comments.push(comment._id);
    await post.save();
    res.redirect("/feeds");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Reply to a comment
router.post("/reply", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const comment = await CommentModel.findById(req.body.commentId);
    const reply = await CommentModel.create({
      fullname: user.fullname,
      user: user._id,
      post: comment.post,
      content: req.body.reply,
    });

    comment.replies.push(reply._id);
    await comment.save();
    res.redirect("/feeds");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Edit a comment
router.post("/editComment", isLoggedIn, async (req, res) => {
  try {
    const comment = await CommentModel.findById(req.body.commentId);
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }
    comment.content = req.body.content;
    await comment.save();
    res.redirect("/feeds");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/about", function (req, res, next) {
  res.render("about");
});
router.get("/admin", async function (req, res, next) {
  const posts = await PostModel.find({});
  const users = await userModel.find({});
  var groups = await GroupModel.find({})
    .populate("creator")
    .populate("members");
  const feedbacks = await contactModel.find({});
  res.render("admin", { users, posts, groups, feedbacks });
});
//delete a group by admin
router.delete("/deleteGroup/admin/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await GroupModel.findById(groupId);
    await group.deleteOne(group);
    res.send({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error deleting group" });
  }
});
// POST route to handle the user report
router.post("/reportUser/:id", async (req, res) => {
  const reportedUserId = req.params.id;
  const user = await userModel.findOne({ username: req.session.passport.user });
  const reportingUserId = user._id; // Assuming the logged-in user's ID is stored in req.user
  console.log(reportingUserId);
  const { reportType, reason } = req.body;
  console.log(reportType);
  console.log(reason);
  // Check if the report type and reason are provided
  if (!reportType || !reason) {
    return res.status(400).send("Report type and reason are required.");
  }

  // Create a new report
  const newReport = new reportModel({
    reportingUser: reportingUserId,
    reportedUser: reportedUserId,
    reportType: reportType,
    reason: reason,
    createdAt: Date.now(),
  });

  // Save the report to the database
  newReport
    .save()
    .then(() => {
      res.json({ success: true });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error submitting report.");
    });
});
// router.get('/api/group/:id', async (req, res) => {
//   const groupId = req.params.id;

//   try {
//       const group = await GroupModel.findById(groupId).populate('creator').populate('members');
//       const messages = await messageModel.find({ groupId: groupId }).populate('senderId', 'fullname');
//       res.json({ group, messages });
//   } catch (err) {
//       res.status(500).json({ error: 'Error retrieving group and messages' });
//   }
// });
router.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await messageModel
      .find({ groupId })
      .populate("senderId")
      .sort({ createdAt: 1 });
    // console.log(messages);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router.get("/contact", function (req, res, next) {
  res.render("contact", { successMessage: null });
});
router.post("/submit_contact", async (req, res) => {
  const { message } = req.body;

  const user = await userModel.findOne({
    username: req.session.passport.user,
  });

  // Create a new contact message document
  const newMessage = new contactModel({
    fullname: user.fullname,
    email: user.email,
    message: message,
  });

  // Save the message to the database
  newMessage
    .save()
    .then(() => {
      res.render("contact", {
        successMessage: "Thank you! Your message has been sent...",
      });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .render("contact", { success: false, error: "Error saving message" });
    });
});
router.get("/profile/:id", isLoggedIn, async function (req, res) {
  const user_id = req.params.id;
  const user = await userModel.findById(user_id);
  res.render("profile", { user, entries: user.entries });
});
router.get("/userprofile/:id", isLoggedIn, async function (req, res) {
  const currentUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  const user_id = req.params.id;
  const user = await userModel.findById(user_id).populate("posts").populate({
    path: "posts",
    populate: "comments",
  });
  const posts = await PostModel.find().populate("comments");
  const chats = await messageModel.find({
    $or: [
      { senderId: user._id, receiverId: currentUser._id },
      { senderId: currentUser._id, receiverId: user._id },
    ],
  });
  res.render("userprofile", {
    successMessage: null ,
    currentUser,
    user,
    entries: user.entries,
    posts,
    chats,
  });
});

router.post("/saveEntries", isLoggedIn, async function (req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.entries = req.body.entries;
    await user.save();

    res.json({ entries: user.entries });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/deleteEntry/:id", isLoggedIn, async function (req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.entries.id(req.params.id).remove();
    await user.save();

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/feed", async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  const userUniversity = req.user.university;
  const matchingUsers = await userModel
    .find({
      university: userUniversity,
      _id: { $ne: user._id },
    })
    .limit(5);
  const users = await userModel.find();

  res.render("feed", { user, matchingUsers, users });
});

router.get("/user", async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  const userId = user._id;
  res.json(userId);
});
router.get("/find", async function (req, res, next) {
  const text = req.query.text;
  var regex = new RegExp(text, "i");
  const users = await userModel.find({
    $or: [{ username: regex }, { university: regex }, { major: regex }],
  });
  res.json(users);
});

//sending request
router.post("/sendRequest", async (req, res) => {
  const { requester_id, receiver_id } = req.body;

  try {
    // Check if the connection already exists
    const precon = await ConnectionModel.findOne({ requester_id, receiver_id });
    if (precon) {
      // If a connection already exists, respond with a message indicating so
      return res.status(400).send("Connection already exists");
    }
    // If no existing connection, create a new one
    const connection = new ConnectionModel({
      requester_id,
      receiver_id,
      status: "pending",
    });

    await connection.save();
    res.status(200).send("Friend request sent");
  } catch (err) {
    res.status(500).send("Error sending friend request");
  }
});

module.exports = router;
//accepting request
router.post("/acceptRequest", async (req, res) => {
  const { connection_id } = req.body;

  try {
    const connection = await ConnectionModel.findById(connection_id);

    if (connection) {
      connection.status = "accepted";
      await connection.save();
      res.status(200).send("Friend request accepted");
    } else {
      res.status(404).send("Connection not found");
    }
  } catch (err) {
    res.status(500).send("Error accepting friend request");
  }
});

//rejecting request
router.post("/rejectRequest", async (req, res) => {
  const { connection_id } = req.body;
  try {
    await ConnectionModel.findByIdAndUpdate(connection_id, {
      status: "rejected",
    });
    res.status(200).send("Friend request rejected");
  } catch (err) {
    res.status(500).send("Error rejecting friend request");
  }
});

// Listing Requests and Connections
router.get("/connections/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const user = await userModel.findOne({ username: req.session.passport.user });
  try {
    // Fetch accepted connections
    const connections = await ConnectionModel.find({
      $or: [
        { requester_id: user_id, status: "accepted" },
        { receiver_id: user_id, status: "accepted" },
      ],
    })
      .populate("requester_id")
      .populate("receiver_id");

    // Deduplicate connections
    const uniqueConnections = [];
    const connectionSet = new Set();

    connections.forEach((connection) => {
      const connectionKey = [
        connection.requester_id._id.toString(),
        connection.receiver_id._id.toString(),
      ]
        .sort()
        .join("-");
      if (!connectionSet.has(connectionKey)) {
        connectionSet.add(connectionKey);
        uniqueConnections.push(connection);
      }
    });
    // Fetch pending requests
    const requests = await ConnectionModel.find({
      receiver_id: user_id,
      status: "pending",
    }).populate("requester_id");

    // Fetch sent requests excluding those already connected
    const sentRequests = await ConnectionModel.find({
      requester_id: user_id,
      status: "pending",
      // receiver_id: { $nin: connectionSet },
    }).populate("receiver_id");

    // Arrays to store connected user IDs
    const connectedUserIds = [];

    uniqueConnections.forEach((connection) => {
      if (connection.requester_id._id.toString() === user_id) {
        connectedUserIds.push(connection.receiver_id._id);
      } else {
        connectedUserIds.push(connection.requester_id._id);
      }
    });
    // Update the user's friends array
    await userModel.findByIdAndUpdate(user._id, {
      $addToSet: { friends: { $each: connectedUserIds } },
    });

    res.render("connections", {
      requests,
      sentRequests,
      user_id,
      connected: uniqueConnections,
    });
  } catch (err) {
    res.status(500).send("Error retrieving friend requests");
  }
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate({
      path: "posts",
      populate: "comments",
    });
  const posts = await PostModel.find().populate("comments");

  res.render("profile", { user, posts });
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post("/register", async function (req, res) {
  const { fullname, email, username, password } = req.body;

  try {
    // Check if the username contains spaces
    if (/\s/.test(username)) {
      return res
        .status(400)
        .json({ message: "Username should not contain spaces" });
    }
    let user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const userData = new userModel({
      username,
      email,
      fullname,
    });
    userModel.register(userData, password).then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/feed");
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});
router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.post(
  "/uploadChatFile",
  isLoggedIn,
  upload.single("file"),
  async (req, res) => {
    const { sender_id, receiver_id, message } = req.body;
    const file = req.file;
    const sender = await userModel.findById(sender_id);
    if (sender.friends.indexOf(receiver_id) !== -1) {
      try {
        let newChat = {
          senderId: sender_id,
          receiverId: receiver_id,
        };

        if (message) {
          newChat.message = message;
        }

        if (file) {
          newChat.file = file.filename;
        }

        const chatMessage = new messageModel(newChat);
        await chatMessage.save();

        res.status(200).json({ success: true, data: chatMessage });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    } else {
      res
        .status(403)
        .json({ success: false, message: "You can only message your friends" });
    }
  }
);
router.delete("/deleteMessage/:id", async (req, res) => {
  try {
    const messageId = req.params.id;
    await messageModel.findByIdAndDelete(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.json({ success: false, message: "Failed to delete message" });
  }
});
router.post("/edit", async function (req, res, next) {
  try {
    // Retrieve the logged-in user's information
    const loggedInUsername = req.session.passport.user;

    // Find the logged-in user using the username
    const user = await userModel.findOne({ username: loggedInUsername });

    if (!user) {
      return res.status(404).send("User not found");
    }
    // Check if the new email is already in use by another user
    const existingUserWithEmail = await userModel.findOne({
      email: req.body.email,
    });
    if (
      existingUserWithEmail &&
      existingUserWithEmail._id.toString() !== user._id.toString()
    ) {
      return res.status(400).send("Email address is already in use");
    }

    // Check if the new name is already in use by another user
    const existingUserWithName = await userModel.findOne({
      fullname: req.body.fullname,
    });
    if (
      existingUserWithName &&
      existingUserWithName._id.toString() !== user._id.toString()
    ) {
      return res.status(400).send("Name is already in use");
    }
    // Update the user's information
    const userData = await userModel.updateOne(
      { _id: user._id }, // Use user's _id for update
      {
        $set: {
          email: req.body.email,
          fullname: req.body.fullname,
          university: req.body.university,
          major: req.body.major,
          year: req.body.year,
          interests: req.body.interests,
        },
      }
    );

    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await userModel.findByIdAndDelete(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false });
  }
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
    failureFlash: true, // fail hone pe flash messages dikh payien gai
  }),
  function (req, res) {}
);
router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
