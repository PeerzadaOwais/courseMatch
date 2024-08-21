document.addEventListener("DOMContentLoaded", function () {
  const closeBtn = document.querySelector(".close-btn");
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
   // JavaScript to toggle the report form visibility
   const reportButton = document.getElementById('reportButton');
   const reportForm = document.getElementById('modal');

   reportButton.addEventListener('click', function() {
       if (reportForm.style.display === 'none' || reportForm.style.display === '') {
           reportForm.style.display = 'block'; // Show the form
       } else {
           reportForm.style.display = 'none'; // Hide the form
       }
   });
  document.querySelectorAll(".threeDot").forEach((threeDotIcon) => {
    threeDotIcon.addEventListener("click", function () {
      const parentElement = threeDotIcon.closest(".current-user-chat");
      const removeDiv = parentElement.querySelector(".message-options");
      // Hide any other open logUserDiv
      document.querySelectorAll(".message-options").forEach((div) => {
        if (div !== removeDiv) {
          div.style.display = "none";
        }
      });
      // Toggle the display of the current logUserDiv
      removeDiv.style.display =
        removeDiv.style.display === "block" ? "none" : "block";
    });
  });
});

const commentBtn = document.querySelectorAll(".comment-btn");
commentBtn.forEach((commentBtn) => {
  commentBtn.addEventListener("click", function () {
    const feedContent = commentBtn.closest(".feedContent");
    const commentSection = feedContent.querySelector(".comment-section");
    // Hide any other open commentSection
    document.querySelectorAll(".commentSection").forEach((div) => {
      if (div !== commentSection) {
        div.style.display = "none";
      }
    });
    // Toggle the display of the current logUserDiv
    commentSection.style.display =
      commentSection.style.display === "block" ? "none" : "block";
  });
});
var socket = io("/user-namespace", {
  auth: {
    token: sender_id,
  },
});
socket.on("loadNewChat", function (data) {
  if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
    var newMessage = document.createElement("div");
    newMessage.className = "chat-bubble distance-user-chat";
    newMessage.innerHTML = data.message;
    newMessage.setAttribute("data-id", data.id);
    if (data.file && data.message) {
      newMessage.innerHTML = `<p>${data.message}</p> <a href="/uploads/chat/${data.file}" download>${data.file}</a>`;
    } else if (data.message) {
      newMessage.innerHTML = `<p>${data.message}</p>`;
    } else if (data.file) {
      newMessage.innerHTML = `<a href="/uploads/chat/${data.file}" download>${data.file}</a>`;
    }

    document.getElementById("message-box").appendChild(newMessage);

    scrollToBottom();
  }
});
socket.on("loadMessageDeleted", function (data) {
  // Check if the message belongs to the current chat between sender and receiver
  if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
    var messageElement = document.querySelector(
      `.chat-bubble[data-id='${data.messageId}']`
    );
    if (messageElement) {
      messageElement.remove();
    }
  }
});
function scrollToBottom() {
  var chatContainer = document.getElementById("message-box");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
function submitMessage(event) {
  event.preventDefault();

  var messageInput = document.getElementById("message-input");
  var message = messageInput.value;
  var fileInput = document.getElementById("file-input");
  var formData = new FormData();
  formData.append("sender_id", sender_id);
  formData.append("receiver_id", receiver_id);

  if (messageInput.value) {
    formData.append("message", messageInput.value);
  }

  if (fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  fetch("/uploadChatFile", {
    method: "post",
    body: formData,
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response.data);
      if (response.success) {
        messageInput.value = "";
        fileInput.value = "";
        var chatContainer = document.getElementById("message-box");
        var newMessage = document.createElement("div");
        newMessage.className = "chat-bubble current-user-chat";
        newMessage.setAttribute("data-id", response.data._id);
        if (response.data.message && response.data.file) {
          newMessage.innerHTML = `
      <p>${response.data.message}</p>&nbsp;
      <a href="/uploads/chat/${response.data.file}" download>${response.data.file}</a>&nbsp;
      <i class="threeDot fa-solid fa-ellipsis-vertical"></i>
      <div class="message-options" style="display: none;">
          <button onclick="removeMessage('${response.data._id}')">Remove message</button>
      </div>
  `;
        } else if (response.data.file) {
          newMessage.innerHTML = `
      <a href="/uploads/chat/${response.data.file}" download>${response.data.file}</a>&nbsp;
      <i class="threeDot fa-solid fa-ellipsis-vertical"></i>
      <div class="message-options" style="display: none;">
          <button onclick="removeMessage('${response.data._id}')">Remove message</button>
      </div>
  `;
        } else if (response.data.message) {
          newMessage.innerHTML = `
      <p>${response.data.message}</p>&nbsp;
      <i class="threeDot fa-solid fa-ellipsis-vertical" ></i>
      <div class="message-options" style="display: none;">
          <button onclick="removeMessage('${response.data._id}')">Remove message</button>
      </div>
  `;
        }
        // newMessage.innerHTML =  <i class="threeDot fa-solid fa-ellipsis-vertical"></i> <div class="message-options" style="display: none;"><button onclick="removeMessage('${response.data._id}')">Remove message</button></div>`;

        chatContainer.appendChild(newMessage);
        // Add event listener for threeDot icon in the newly created message
        var icon = newMessage.querySelector(".threeDot");
        if (icon) {
          icon.addEventListener("click", function () {
            const messageOptions = newMessage.querySelector(".message-options");
            messageOptions.style.display =
              messageOptions.style.display === "block" ? "none" : "block";
          });
        }
        scrollToBottom();
        socket.emit("newChat", {
          message: response.data.message,
          id: response.data._id,
          sender_id: sender_id,
          receiver_id: receiver_id,
          file: response.data.file,
        });
      } else {
        console.error("Server responded with an error:", response.message);
        alert(response.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function removeMessage(messageId) {
  fetch(`/deleteMessage/${messageId}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Remove the message from the DOM
        var messageElement = document.querySelector(
          `.chat-bubble[data-id='${messageId}']`
        );
        if (messageElement) {
          messageElement.remove();
          // Emit socket event for real-time deletion
          socket.emit("messageDeleted", { messageId, sender_id, receiver_id });
        }
      } else {
        console.error("Failed to delete message:", data.message);
      }
    })
    .catch((error) => {
      console.error("Error deleting message:", error);
    });
}

window.onload = scrollToBottom;
