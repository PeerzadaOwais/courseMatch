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
