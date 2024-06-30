var express = require("express");
var router = express.Router();
const upload = require("./multer");
const userModel = require("./users");
const PostModel = require("./posts");
const CommentModel = require("./comment");
const GroupModel = require("./groups");
const ConnectionModel = require("./connections");

const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

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
    // const users = await userModel
    //   .find()
    //   .populate("groups")
    //   .populate({
    //     path: "groups",
    //     populate: {
    //       path: "members creator",
    //     },
    //   });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.render("group", { user, loggedInUser: user });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// group route
router.post("/create", upload.single("picture"), async (req, res) => {
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
});

// Remove a member from a group
router.post("/group/remove-member", async (req, res) => {
  const { groupId, memberId } = req.body;
  console.log(groupId);
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
    //  // Add the new group to each member's groups if not already added
    //  await userModel.updateMany(
    //   { _id: { $in: uniqueMembersArray } },
    //   { $addToSet: { groups: newGroup._id } } // Use $addToSet to ensure uniqueness
    // );
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

// Route to get messages of a specific group
router.get("/groups/:groupId/messages", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await GroupModel.findById(groupId).populate(
      "messages.sender"
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(group.messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Internal server error" });
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
  const user = await userModel.findOne({ username: req.session.passport.user });

  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    // if (post.user.toString() !== user._id.toString()) {
    //   return res
    //     .status(403)
    //     .send({ message: "You are not authorized to delete this post" });
    // }
    console.log(post);
    await post.deleteOne(post);
    user.posts.remove(post);
    // await user.deleteOne(post);
    //  await  post.remove();
    //   await post.save();
    await user.save();
    // await post.save();

    res.send({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error deleting post" });
  }
});
router.get("/searcht", async (req, res) => {
  try {
     // Get the logged-in user's data
     const user = await userModel.findOne({ username: req.session.passport.user });
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

router.get("/contact", function (req, res, next) {
  res.render("contact");
});

router.get("/profile/:id", isLoggedIn, async function (req, res) {
  const user_id = req.params.id;
  const user = await userModel.findById(user_id);
  res.render("profile", { user, entries: user.entries });
});
router.get("/userprofile/:id", isLoggedIn, async function (req, res) {
  const user_id = req.params.id;
  const user = await userModel.findById(user_id).populate("posts").populate({
    path: "posts",
    populate: "comments",
  });
  const posts = await PostModel.find().populate("comments");
  // const entries= await userModel.find(entries);
  res.render("userprofile", { user, entries: user.entries, posts });
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
    $or: [
      { username: regex },
      { university: regex },
      { major: regex },
      // Add more objects as needed
    ],
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

      // Create a reverse connection for bidirectional visibility
      // const reverseConnection = new ConnectionModel({
      //   requester_id: connection.receiver_id,
      //   receiver_id: connection.requester_id,
      //   status: "accepted",
      // });

      // await reverseConnection.save();

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
    // console.log(connectionSet);

    // Fetch pending requests
    const requests = await ConnectionModel.find({
      receiver_id: user_id,
      status: "pending",
    }).populate("requester_id");

    // Fetch sent requests
    const sentRequests = await ConnectionModel.find({
      requester_id: user_id,
      status: "pending",
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

module.exports = router;
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
router.post("/register", function (req, res) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,
  });
  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/feed");
    });
  });
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
  res.redirect("/");
}
module.exports = router;
