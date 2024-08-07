document.addEventListener("DOMContentLoaded", () => {
  var socket = io("/user-namespace", {
    auth: {
      token: sender_id,
    },
  });
  function scrollToBottom() {
    var chatContainer = document.getElementById("message-box");
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  // Handle receiving new messages
  let lastSenderId = null;
  socket.on("messageReceived", function (message) {
    console.log(message);
    const groupId = document
      .querySelector(".groupName")
      .getAttribute("data-group-id");
    if (message.groupId === groupId) {
      const messageElement = document.createElement("div");
      messageElement.classList.add("chat-bubble", "distance-user-chat");
      // console.log(message.senderId.username);
      if (message.senderId !== lastSenderId) {
        messageElement.innerHTML = `<div class="message-body"><p class="sender-name">${message.senderUsername}</p> <p>${message.message}</p></div>`;
      } else {
        messageElement.innerHTML = `<p>${message.message}</p>`;
      }
      document.getElementById("message-box").appendChild(messageElement);
      lastSenderId = message.senderId;
    }
    scrollToBottom();
  });

  document.querySelector("#upload-icon").addEventListener("click", function () {
    document.querySelector("#upload-form input").click();
  });

  document.querySelector("#upload-form input").addEventListener("change", function () {
      const fileName = this.files[0] ? this.files[0].name : "";
      document.querySelector("#file-name").textContent = fileName;
      document.querySelector("#upload-form").onsubmit = submitMessage;
    });
  // Function to fetch messages from the server
  async function fetchMessages(groupId, loggedInUser) {
    try {
      const response = await fetch(`/groups/${groupId}/messages`);
      const messages = await response.json();
      const messageBox = document.getElementById("message-box");
      
      // Clear previous messages
      messageBox.innerHTML = "";
      let lastSenderId = null;

      // Append new messages
      messages.forEach((message) => {
        const messageElement = document.createElement("div");
        const isCurrentUser = message.senderId._id === loggedInUser;

        messageElement.classList.add(
          "chat-bubble",
          isCurrentUser ? "current-user-chat" : "distance-user-chat"
        );
        if (!isCurrentUser && message.senderId._id !== lastSenderId) {
          messageElement.innerHTML = `<div class="message-body"><p class="sender-name">${message.senderId.username}</p> <p>${message.message}</p></div>`;
        } else {
          messageElement.innerHTML = `<p>${message.message}</p>`;
        }
        messageBox.appendChild(messageElement);
        lastSenderId = message.senderId._id;
      });
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }
  document.querySelectorAll(".group-item").forEach((groupItem) => {
    groupItem.addEventListener("click", async () => {
      const groupId = groupItem.getAttribute("data-group-id");
      const groupName = groupItem.getAttribute("data-group-name");
      const description = groupItem.getAttribute("data-group-description");

      // Displaying the name of the group in the nav bar
      const groupname = document.querySelector(".groupName");
      groupname.innerHTML = groupName;
      groupname.setAttribute("data-group-id", groupId);
      document.querySelector(".description").innerHTML = description;

      // Fetch logged-in user
      const loggedInUserRespon = await fetch("/user");
      const loggedInUser = await loggedInUserRespon.json();
      // Fetch and display messages for the selected group
      await fetchMessages(groupId, loggedInUser);
      // Fetch members for the selected group
      fetchMembers(groupId, loggedInUser);

      function submitMessage(event) {
        event.preventDefault();

        const messageInput = document.getElementById("message-input");
        const message = messageInput.value;
        const fileInput = document.getElementById("file-input");
        const formData = new FormData();
        formData.append("message", message);
        formData.append("senderId", loggedInUser);
        formData.append("groupId", groupId);
        if (fileInput.files.length > 0) {
          formData.append("file", fileInput.files[0]);
        }

        fetch("/uploadGroupMessage", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              
              const senderUsername =data.data.populatedMessage.senderId.username;
              senderId = data.data.senderId;
              // Append the new message to the chat box
              const messageElement = document.createElement("div");
              messageElement.classList.add("chat-bubble", "current-user-chat");
              messageElement.innerHTML = `<p>${message}</p>`;
              document
                .getElementById("message-box")
                .appendChild(messageElement);

              // Clear the input field
              messageInput.value = "";
              messageInput.value = "";
              fileInput.value = "";
              document.querySelector("#file-name").textContent = "";
              scrollToBottom();
              // Emit the new message event to the server
              socket.emit("newMessage", {
                senderUsername,
                groupId,
                senderId,
                message,
              });
            } else {
              console.error("Error uploading message:", data.message);
            }
          })
          .catch((error) => console.error("Error:", error));
      }

      document.getElementById("message-input").parentElement.onsubmit =
        submitMessage;
    });
  });

  document.querySelectorAll(".threeDot").forEach((threeDotIcon) => {
    threeDotIcon.addEventListener("click", function () {
      const parentElement = threeDotIcon.closest(".group-item");
      const removeDiv = parentElement.querySelector(".removeDiv");
      // Hide any other open logUserDiv
      document.querySelectorAll(".removeDiv").forEach((div) => {
        if (div !== removeDiv) {
          div.style.display = "none";
        }
      });
      // Toggle the display of the current logUserDiv
      removeDiv.style.display =
        removeDiv.style.display === "block" ? "none" : "block";
    });
  });

  document.querySelectorAll(".remove-member").forEach((removeLink) => {
    removeLink.addEventListener("click", async function (e) {
      e.preventDefault();
      const groupId = removeLink
        .closest(".group-item")
        .getAttribute("data-group-id");
      const memberId = removeLink.getAttribute("data-member-id");
      try {
        const response = await fetch("/group/remove-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ groupId, memberId }),
        });
        if (response.ok) {
          removeLink.closest("li").remove(); // Update UI to reflect member removal
        } else {
          alert("Only admin can remove members");
          console.error("Failed to remove member:", response.statusText);
        }
      } catch (err) {
        console.error("Error removing member:", err);
      }
    });
  });

  document.querySelectorAll(".leave-group").forEach((leaveLink) => {
    leaveLink.addEventListener("click", async function (e) {
      e.preventDefault();
      const groupId = this.closest(".group-item").getAttribute("data-group-id");
      try {
        const response = await fetch("/group/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ groupId }),
        });
        if (response.ok) {
          this.closest(".group-item").remove();
        } else {
          console.error("Failed to leave group:", response.statusText);
        }
      } catch (err) {
        console.error("Error leaving group:", err);
      }
    });
  });

  document.querySelectorAll(".delete-group").forEach((deletegroup) => {
    deletegroup.addEventListener("click", async function () {
      const groupId = deletegroup
        .closest(".group-item")
        .getAttribute("data-group-id");
      if (confirm("Are you sure you want to delete this group?")) {
        fetch(`/deleteGroup/${groupId}`, {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Group deleted successfully") {
              alert("Group deleted successfully");
              location.reload();
            } else {
              alert("Error deleting group");
            }
          })
          .catch((error) => alert("Error"));
      }
    });
  });
});

async function fetchMembers(groupId, loggedInUser) {
  try {
    const membersResponse = await fetch(`/groups/${groupId}/members`);
    const group = await membersResponse.json();
    const { members, creator } = group;
    const membersListDiv = document.getElementById("members-list");

    // Clear the previous members list
    membersListDiv.innerHTML = "";

    // Populate the members list
    members.forEach((member) => {
      const memberElement = document.createElement("div");
      const isAdmin = member._id === creator._id;
      memberElement.classList.add("group-item");

      memberElement.innerHTML = `
        <ul>
          <li class="group-item" data-group-id="${groupId}" data-member-id="${
        member._id
      }">
            <img src="/images/uploads/${member.profileImage}" alt="">
            <span>${member.username} ${isAdmin ? "(admin)" : ""}</span>
            ${
              isAdmin
                ? creator._id === loggedInUser
                  ? '<button class="addMemberBtn">Add Members</button><br><div class="addMemberDiv">' +
                    '<label for="members">Add Members:</label>' +
                    '<div id="selected-members" class="selected-members"></div>' +
                    '<input type="text" id="members-input" name="members-input" oninput="searchMembers()" autocomplete="off">' +
                    '<div id="suggestions" class="suggestions"></div>' +
                    '<input type="hidden" id="members" name="members">' +
                    "</div>"
                  : ""
                : '<i class="threeDot fa-solid fa-ellipsis-vertical"></i>'
            }
            <div style="display:none;" class="removeMemberDiv removeDiv">
              <a href="#" class="remove-member" data-member-id="${
                member._id
              }">Remove</a>
            </div>
          </li>
        </ul>
      `;
      membersListDiv.appendChild(memberElement);
    });

    // Show add member div when clicking the add member button
    const addMemberBtn = document.querySelector(".addMemberBtn");
    const addMemberDiv = document.querySelector(".addMemberDiv");
    if (addMemberBtn) {
      addMemberBtn.addEventListener("click", function () {
        addMemberDiv.style.display = "block";
      });
    }

    document.querySelectorAll(".threeDot").forEach((threeDotIcon) => {
      threeDotIcon.addEventListener("click", function () {
        const parentElement = threeDotIcon.closest(".group-item");
        const removeDiv = parentElement.querySelector(".removeDiv");
        document.querySelectorAll(".removeDiv").forEach((div) => {
          if (div !== removeDiv) {
            div.style.display = "none";
          }
        });
        removeDiv.style.display =
          removeDiv.style.display === "block" ? "none" : "block";
      });
    });

    document.querySelectorAll(".remove-member").forEach((removeLink) => {
      removeLink.addEventListener("click", async function (e) {
        e.preventDefault();
        const groupId = removeLink
          .closest(".group-item")
          .getAttribute("data-group-id");
        const memberId = removeLink.getAttribute("data-member-id");
        try {
          const response = await fetch("/group/remove-member", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ groupId, memberId }),
          });
          if (response.ok) {
            removeLink.closest("li").remove(); // Update UI to reflect member removal
          } else {
            alert("Only admin can remove members");
            console.error("Failed to remove member:", response.statusText);
          }
        } catch (err) {
          console.error("Error removing member:", err);
        }
      });
    });
    window.onload = scrollToBottom;
    
  } catch (error) {
    console.error("Error fetching group members:", error);
  }
}

async function searchMembers() {
  const query = document.getElementById("members-input").value;
  if (query.length < 2) {
    document.getElementById("suggestions").innerHTML = "";
    return;
  }
  const response = await fetch(`/searcht?q=${query}`);
  const searchusers = await response.json();
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = "";
  searchusers.forEach((searchuser) => {
    const div = document.createElement("div");
    div.classList.add("suggestion");
    div.innerText = `${searchuser.username}`;
    div.addEventListener("click", () => addMemberToGroup(searchuser._id));
    suggestions.appendChild(div);
  });
}

async function addMemberToGroup(user_id) {
  var userId = user_id;
  const groupId = document
    .querySelector(".groupName")
    .getAttribute("data-group-id");
  try {
    const response = await fetch("/group/add-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId, userId }),
    });

    if (response.ok) {
      // Fetch logged-in user
      const loggedInUserRespon = await fetch("/user");
      const loggedInUser = await loggedInUserRespon.json();
      fetchMembers(groupId, loggedInUser);
    } else {
      alert("Failed to add member");
    }
  } catch (err) {
    console.error("Error adding member:", err);
  }
}
