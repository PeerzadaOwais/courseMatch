document.querySelector("#upload-icon").addEventListener("click", function () {
  document.querySelector("#upload-form input").click();
});

document
  .querySelector("#upload-form input")
  .addEventListener("change", function () {
    document.querySelector("#upload-form").submit();
  });
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".group-item").forEach((groupItem) => {
    groupItem.addEventListener("click", async () => {
      const groupId = groupItem.getAttribute("data-group-id");
      const membersListDiv = document.getElementById("members-list");
      const chatMessagesDiv = document.getElementById("chat-messages");

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
          memberElement.innerHTML = `
                        <ul>
                            <li>
                                <img src="/images/uploads/${
                                  member.profileImage
                                }" alt="">
                                <span>${member.username} ${
            isAdmin ? "(admin)" : ""
          }</span>
                                
                            </li>
                        </ul>
                    `;
          membersListDiv.appendChild(memberElement);
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
  });

  function propagation(event) {
    event.stopPropagation(); // Prevents the click event from bubbling up to the parent div
  }

  const threeDotIcons = document.querySelectorAll(".threeDot");
  threeDotIcons.forEach((threeDotIcon) => {
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
      const groupId = this.closest(".group-item").getAttribute("data-group-id");
      const memberId = this.getAttribute("data-member-id");
      try {
        const response = await fetch("/group/remove-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ groupId, memberId }),
        });
        if (response.ok) {
          // Update UI to reflect member removal
          this.closest("li").remove();
        } else {
          console.error("Failed to remove member:", response.statusText);
        }
      } catch (err) {
        console.error("Error removing member:", err);
      }
    });
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
              alert("Group deleted successfully")
              location.reload();
            } else {
              alert("Error deleting group");
            }
          })
          .catch((error) => alert("Error"));
      }
    });
  });

  // document.querySelectorAll(".leave-group").forEach((leaveLink) => {
  //   leaveLink.addEventListener("click", async function (e) {
  //     e.preventDefault();
  //     const groupId = this.closest(".group-item").getAttribute("data-group-id");
  //     try {
  //       const response = await fetch("/group/leave", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ groupId }),
  //       });
  //       if (response.ok) {
  //         // Update UI to reflect leaving the group
  //         this.closest(".group-item").remove();
  //       } else {
  //         console.error("Failed to leave group:", response.statusText);
  //       }
  //     } catch (err) {
  //       console.error("Error leaving group:", err);
  //     }
  //   });
  // });
});
