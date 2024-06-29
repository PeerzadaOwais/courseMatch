document.querySelector("#upload-icon").addEventListener("click", function () {
  document.querySelector("#upload-form input").click();
});

document
  .querySelector("#upload-form input")
  .addEventListener("change", function () {
    document.querySelector("#upload-form").submit();
  });

document.querySelector("#circle").addEventListener("click", function () {
  var newdiv = document.createElement("div");
  newdiv.className = "circular-div";

  // Create the inner divs and inputs
  var infoDiv = document.createElement("div");
  infoDiv.className = "info";

  var cross = document.createElement("i");
  cross.className = "fa-solid fa-xmark";

  // Add event listener to the cross icon to remove the parent div
  cross.addEventListener("click", function () {
    newdiv.remove();
    // Send a request to delete the entry from the database
    const entryId = newdiv.dataset.entryId;
    if (entryId) {
      fetch(`/deleteEntry/${entryId}`, { method: "DELETE" });
    }
  });
  // let currentIndex = 0;
  // document.querySelector('.fa-xmark').addEventListener("click",function(){
  //   var ddiv=document.querySelector('.circular-div');
  //   ddiv.remove();
  //   // Send a request to delete the entry from the database
  //   const entryId = ddiv.dataset.entryId;
  //   if (entryId){
  //     fetch(`/deleteEntry/${entryId}`, { method: "DELETE" });
  //   }
  // });
  //   if (currentIndex < newdiv.length) {
  //     // Remove the current div from the DOM
  //     newdiv[currentIndex].remove();
  //     // Increment the index for the next div
  //     currentIndex++;
  //   }
  // });

  var studyInput = document.createElement("input");
  studyInput.className = "studyinput";
  studyInput.type = "text";
  studyInput.placeholder = "add school/college";

  infoDiv.appendChild(cross);
  infoDiv.appendChild(studyInput);

  var datesDiv = document.createElement("div");
  datesDiv.className = "dates";

  var dateInput = document.createElement("input");
  dateInput.className = "dateinput";
  dateInput.type = "text";
  dateInput.placeholder = "batch";

  datesDiv.appendChild(dateInput);

  // Append the inner divs to the new div
  newdiv.appendChild(infoDiv);
  newdiv.appendChild(datesDiv);

  // Append the new div to the second timelinediv element
  document.querySelector(".timeline").appendChild(newdiv);

  var timeline = document.querySelector(".timeline");
  var circlediv = document.querySelector("#circle");
  // Insert the new div before the add icon
  timeline.insertBefore(newdiv, circlediv);
});

function saveEntries() {
  const entries = Array.from(document.querySelectorAll(".circular-div")).map(
    (div) => {
      return {
        school: div.querySelector(".studyinput").value,
        batch: div.querySelector(".dateinput").value,
      };
    }
  );

  fetch("/saveEntries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  })
    .then((response) => response.json())
    .then((data) => {
      data.entries.forEach((entry, index) => {
        document.querySelectorAll(".circular-div")[index].dataset.entryId =
          entry._id;
      });
      alert("Entries saved successfully!");
    })
    .catch((error) => console.error("Error:", error));
}

var timeline = document.querySelector(".timeline");
while (timeline.children.length < 3) {
  document.querySelector("#circle").click();
}

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
// const body = document.body;
// body.addEventListener("click", function (event) {
//   if (event.target.id !== "commentSection") {
//     // Hide the div if it exists
//     const div = document.querySelector(".commentSection");
//     if (div) {
//       div.style.display = "none";
//     }
//   }
// });
 
const threeDotIcons = document.querySelectorAll(".threeDot");

threeDotIcons.forEach((threeDotIcon) => {
  threeDotIcon.addEventListener("click", function () {
    const postElement = threeDotIcon.closest(".feedContent");
    const logUserDiv = postElement.querySelector(".logUserDiv");

    // Hide any other open logUserDiv
    document.querySelectorAll(".logUserDiv").forEach((div) => {
      if (div !== logUserDiv) {
        div.style.display = "none";
      }
    });

    // Toggle the display of the current logUserDiv
    logUserDiv.style.display =
      logUserDiv.style.display === "block" ? "none" : "block";
  });
});
function hideDiv() {
  document.querySelectorAll(".logUserDiv").forEach((div) => {
    div.style.display = "none";
  });
}

function deletePost(postId) {
  // console.log(postId);
  if (confirm("Are you sure you want to delete this post?")) {
    fetch("/deletePost/" + postId, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Post deleted successfully") {
          location.reload();
        } else {
          alert("Error deleting post");
        }
      })
      .catch((error) => alert("Error deleting post"));
  }
}
