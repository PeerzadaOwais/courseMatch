
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


