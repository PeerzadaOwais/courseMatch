document.addEventListener("DOMContentLoaded", function () {
  const threeDots = document.querySelectorAll(".threeDot");
  let currentPostId = null;
  let currentPostCard = null;

  threeDots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      const removeBtn = dot.nextElementSibling;
      if (removeBtn.classList.contains("hidden")) {
        removeBtn.classList.remove("hidden");
      } else {
        removeBtn.classList.add("hidden");
      }
    });
  });
  const groupRemoveBtn = document.querySelectorAll(".group-remove-btn");
  groupRemoveBtn.forEach((button) => {
    button.addEventListener("click", function () {
      currentGroupId = this.getAttribute("data-id");
      console.log(currentGroupId);
      currentGroupCard = this.closest(".inner-group-card");
      const popup = this.nextElementSibling; // Get the associated popup
      popup.classList.remove("hidden");
    });
  });
  document.querySelectorAll(".confirm-delete-group").forEach((btn) => {
    btn.addEventListener("click", function () {
      fetch(`/deleteGroup/admin/${currentGroupId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Group deleted successfully") {
            currentGroupCard.remove();
            alert("group deleted successfully!");
          } else {
            alert("Failed to remove group.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred.");
        });
    });
  });
  document.querySelectorAll(".cancel-delete-group").forEach((btn) => {
    btn.addEventListener("click", function () {
      const popup = this.closest(".group-confirmation-popup");
      popup.classList.add("hidden");
    });
  });
  const postRemoveBtns = document.querySelectorAll(".post-remove-btn");
  postRemoveBtns.forEach((button) => {
    button.addEventListener("click", function () {
      currentPostId = this.getAttribute("data-id");
      currentPostCard = this.closest(".post-card");
      const popup = this.nextElementSibling; // Get the associated popup
      popup.classList.remove("hidden");
    });
  });

  document.querySelectorAll(".confirm-delete-post").forEach((btn) => {
    btn.addEventListener("click", function () {
      fetch(`/deletePost/${currentPostId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          if (data.message === "Post deleted successfully") {
            currentPostCard.remove();
            alert("Post removed successfully!");
          } else {
            alert("Failed to remove post.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred.");
        });
    });
  });

  document.querySelectorAll(".cancel-delete-post").forEach((btn) => {
    btn.addEventListener("click", function () {
      const popup = this.closest(".post-confirmation-popup");
      popup.classList.add("hidden");
    });
  });

  const searchInput = document.getElementById("user-search");
  const userCards = document.querySelectorAll(".user-card");

  // Function to filter users based on the search input
  searchInput.addEventListener("input", function () {
    const filter = searchInput.value.toLowerCase();

    userCards.forEach((card) => {
      const userName = card
        .querySelector(".user-name")
        .textContent.toLowerCase();
      const userEmail = card
        .querySelector(".user-email")
        .textContent.toLowerCase();
      const userUniversity = card
        .querySelector(".user-university")
        .textContent.toLowerCase();

      // Check if any of the fields contain the search term
      if (
        userName.includes(filter) ||
        userEmail.includes(filter) ||
        userUniversity.includes(filter)
      ) {
        card.style.display = "flex"; // Show the user card if it matches any search query
      } else {
        card.style.display = "none"; // Hide the user card if it doesn't match any search query
      }
    });
  });
  const removeButtons = document.querySelectorAll(".remove-btn");
  const popup = document.getElementById("confirmation-popup");
  const confirmDeleteButton = document.getElementById("confirm-delete");
  const cancelDeleteButton = document.getElementById("cancel-delete");
  let currentUserId = null;
  let currentUserCard = null;

  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      currentUserId = this.getAttribute("data-id");
      // console.log(currentUserId);
      currentUserCard = this.parentElement;
      popup.classList.remove("hidden");
    });
  });

  confirmDeleteButton.addEventListener("click", function () {
    fetch(`/users/${currentUserId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          currentUserCard.remove();
          alert("User removed successfully!");
        } else {
          alert("Failed to remove user.");
        }
        popup.classList.add("hidden");
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred.");
        popup.classList.add("hidden");
      });
  });

  cancelDeleteButton.addEventListener("click", function () {
    popup.classList.add("hidden");
  });

  const detailsButtons = document.querySelectorAll(".details-btn");
  const modal = document.getElementById("group-modal");
  const closeBtn = document.querySelector(".close-btn");

  // Modal content elements
  const modalGroupName = document.getElementById("modal-group-name");
  const modalGroupAdmin = document.getElementById("modal-group-admin");
  const modalGroupMembersCount = document.getElementById(
    "modal-group-members-count"
  );
  const modalGroupMembers = document.getElementById("modal-group-members");
  // const modalGroupMessages = document.getElementById("modal-group-messages");

  // Add click event listeners to each "Details" button
  detailsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Retrieve the group details from the data attributes
      const groupName = button.getAttribute("data-group-name");
      const groupAdmin = button.getAttribute("data-group-admin");
      const groupMembers = JSON.parse(button.getAttribute("data-group-member"));
      const groupId = button.getAttribute("data-group-id");
      // console.log(groupMembers);
      // const groupMessages = JSON.parse(button.getAttribute("data-group-messages"));

      // Set the modal content
      modalGroupName.textContent = `Group Name: ${groupName}`;
      modalGroupAdmin.textContent = `Admin: ${groupAdmin}`;
      modalGroupMembersCount.textContent = groupMembers.length;

      // Clear any existing members and messages in the modal
      modalGroupMembers.innerHTML = "";

      // Append each member to the members list
      groupMembers.forEach((member) => {
        console.log(member);
        const memberItem = document.createElement("li");
        memberItem.textContent = member.fullname; // Assuming member has a fullname field
        modalGroupMembers.appendChild(memberItem);
      });
      modal.style.display = "block";
      fetch(`/groups/${groupId}/messages`)
        .then((response) => response.json())
        .then((data) => {
          // Assuming the response contains messages
          const messages = data;
          const modalGroupMessages = document.getElementById(
            "modal-group-messages"
          );

          // Clear any existing messages
          modalGroupMessages.innerHTML = "";

          messages.forEach((message) => {
            const messageItem = document.createElement("li");
            messageItem.textContent = `${message.senderId.fullname}: ${message.message}`;
            modalGroupMessages.appendChild(messageItem);
          });
        })
        .catch((error) => console.error("Error fetching messages:", error));
    });
  });

  // Close the modal when the 'x' button is clicked
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close the modal when clicking outside of the modal content
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
});
