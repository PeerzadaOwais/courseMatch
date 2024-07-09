document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#upload-icon").addEventListener("click", function () {
    document.querySelector("#upload-form input").click();
  });

  document
    .querySelector("#upload-form input")
    .addEventListener("change", function () {
      document.querySelector("#upload-form").submit();
    });

  document.querySelectorAll(".group-item").forEach((groupItem) => {
    groupItem.addEventListener("click", async () => {
      const groupId = groupItem.getAttribute("data-group-id");
      const groupName = groupItem.getAttribute("data-group-name");
      const description = groupItem.getAttribute("data-group-description");
      const membersListDiv = document.getElementById("members-list");

      const chatMessagesDiv = document.getElementById("chat-messages");

      //displaying the name of the group in the nav bar
      var groupname = document.querySelector(".groupName");
      groupname.innerHTML = groupName;
      groupname.setAttribute("data-group-id", groupId); // Set the data-group-id attribute

      document.querySelector(".description").innerHTML = description;

      //fetch loggedin User
      const loggedInUserRespon = await fetch("/user");
      const loggedInUser = await loggedInUserRespon.json();

      // Fetch members for the selected group
      try {
        const membersResponse = await fetch(`/groups/${groupId}/members`);
        const group = await membersResponse.json();
        const { members, creator } = group;
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

        //show add member div when clicking the add member button
        const addMemberBtn = document.querySelector(".addMemberBtn");
        const addMemberDiv = document.querySelector(".addMemberDiv");
        addMemberBtn.addEventListener("click", function () {
          addMemberDiv.style.display = "block";
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
            const groupId =
              this.closest(".group-item").getAttribute("data-group-id");
            try {
              const response = await fetch("/group/leave", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ groupId }),
              });
              if (response.ok) {
                // Update UI to reflect leaving the group
                this.closest(".group-item").remove();
              } else {
                console.error("Failed to leave group:", response.statusText);
              }
            } catch (err) {
              console.error("Error leaving group:", err);
            }
          });
        });

        // Fetch messages for the selected group
        const messagesResponse = await fetch(`/groups/${groupId}/messages`);
        const messages = await messagesResponse.json();

        // Clear the previous chat messages
        chatMessagesDiv.innerHTML = "";

        // Populate the chat messages
        messages.forEach((message) => {
          const messageElement = document.createElement("div");
          messageElement.classList.add("message", "sender");
          messageElement.innerHTML = `
                        <p style="color: black;">${message.sender.username}:</p>
                        <p>${message.content}</p>
                    `;
          chatMessagesDiv.appendChild(messageElement);
        });
      } catch (error) {
        console.error("Error fetching group members or messages:", error);
      }
    });

    // function propagation(event) {
    //   event.stopPropagation(); // Prevents the click event from bubbling up to the parent div
    // }
  });

  document.querySelectorAll(".delete-group").forEach((deletegroup) => {
    deletegroup.addEventListener("click", async function () {
      const groupId = deletegroup
        .closest(".group-item")
        .getAttribute("data-group-id");
      if (confirm("Are you sure you want to delete this group ?")) {
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
// search members
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
    div.addEventListener("click", () => addMemberToGroup(searchuser._id)); // Attach event listener to add member
    suggestions.appendChild(div);
  });
}
// Function to handle adding a member to the group
async function addMemberToGroup(userId) {
  const groupId = document.querySelector(".groupName").getAttribute("data-group-id");
  try {
    const response = await fetch("/group/add-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId,userId}),
    });

    if (response.ok) {
      location.reload(); 
    } else {
      alert("Failed to add member");
    }
  } catch (err) {
    console.error("Error adding member:", err);
  }
}
