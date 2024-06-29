document.querySelectorAll(".comment-button").forEach((button) => {
  button.addEventListener("click", () => {
    const postId = button.getAttribute("data-post-id");
    const commentSection = document.getElementById(`comment-section-${postId}`);
    commentSection.style.display =
      commentSection.style.display === "none" ? "block" : "none";
  });
}); 

document.querySelectorAll(".reply-button").forEach((button) => {
  button.addEventListener("click", () => {
    const commentId = button.getAttribute("data-comment-id");
    const replySection = document.getElementById(`reply-section-${commentId}`);
    replySection.style.display =
      replySection.style.display === "none" ? "block" : "none";
  });
});
const threeDotIcons = document.querySelectorAll('.threeDot');

threeDotIcons.forEach(threeDotIcon => {
  threeDotIcon.addEventListener('click', function() {
    const postElement = threeDotIcon.closest('.posts');
    const logUserDiv = postElement.querySelector('.logUserDiv');
 
    // Hide any other open logUserDiv
    document.querySelectorAll('.logUserDiv').forEach(div => {
      if (div !== logUserDiv) {
        div.style.display = 'none';
      }
    });

    // Toggle the display of the current logUserDiv
    logUserDiv.style.display = logUserDiv.style.display === 'block' ? 'none' : 'block';
 
  });
});

function deletePost(postId) {
  // console.log(postId);
  if (confirm("Are you sure you want to delete this post?")) {
    fetch('/deletePost/' + postId, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === "Post deleted successfully") {
        location.reload();
      } else {
        alert("Error deleting post");
      }
    })
    .catch(error => alert("Error deleting post"));
  }
}



//for getting loggedIn user
// fetch("/getuser")
//   .then((response) => response.json())
//   .then((data) => {
//     createDivForLogUser(data);
//   });

// function createDivForLogUser(data) {
//   if (data) {
//     document
//       .querySelector("#threeDot")
//       .addEventListener("click", function () {
//         let logUserDiv = document.createElement("div");
//         logUserDiv.className = "log-user";
//         let logUserInnerDiv = document.createElement("div");
//         logUserInnerDiv.className = "log-user-inner";
//         logUserInnerDiv.innerHTML="Delete post";
//         logUserDiv.appendChild(logUserInnerDiv);
//         return logUserDiv;
//       });

//   }
//   else{
//     document.querySelector("#threeDot").addEventListener("click",function(){
//       let nLogUserDiv= document.createElement("div");
//       nLogUserDiv.className="log-user";
//       let nLogUserInnerDiv=document.createElement("div");
//       nLogUserInnerDiv.className="log-user-inner";
//       nLogUserInnerDiv.innerHTML="report";
//       nLogUserDiv.appendChild(nLogUserInnerDiv);
//     })
//   }
// }

//   var icon =document.querySelector('.fa-pen-to-square').addEventListener("click",function(){
//     var hiddenTextarea = document.querySelector(".comment-textarea1");
//     var hiddenButton = document.querySelector(".comment-reply-button1");
//     hiddenTextarea.style.display="block";
//     hiddenButton.style.display="block";
//     icon.style.display='none';

// });
