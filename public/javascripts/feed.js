// Function to toggle visibility of search results div
function toggleSearchResults() {
  var searchResults = document.getElementById("search-results");
  searchResults.classList.toggle("hidden");

  // Toggle blur effect on main content
  var mainContent = document.querySelector("main");
  mainContent.classList.toggle("blur-background");
  searchi();
}
// Function to simulate searching for matches
function searchi() {
  var namee = document.getElementById("courses-input").value;

  fetch(`/find?text=${namee}`)
    .then((response) => response.json())
    .then((data) => {
      displaySearchResults(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

var user = ""; // Declare user variable
var userId = "";
// Fetching user from server
fetch("/user")
  .then((response) => response.json())
  .then((data) => {
    userId = data; // Set user variable

    console.log("User data fetched:", user); // Debugging statement
  })
  .catch((error) => {
    console.error("Error fetching user data:", error);
  });

// Create a card for each user
function createCard(users) {
  console.log(users);
  console.log(user);
  var usersId = `${users._id}`;
  // var userId = `${user._id}`;
  console.log(usersId);
  console.log(userId);

  let card = document.createElement("div");
  card.className = "card-container";

  let img = document.createElement("img");
  img.src = `/images/uploads/${users.profileImage}`;

  let info = document.createElement("div");
  info.className = "info";

  let username = document.createElement("h3");
  username.textContent = users.username;

  let connectButton = document.createElement("button");
  connectButton.textContent = "Connect";
  connectButton.className = "connect-button";

  // Correctly set the onclick handler
  connectButton.onclick = function () {
    toggleFunction(this, usersId, userId);
  };

  var link = document.createElement("a");
  link.href = `/userprofile/${users._id}`;
  link.appendChild(username);

  let stream = document.createElement("p");
  stream.textContent = `Stream: ${users.major}`;

  let university = document.createElement("p");
  university.textContent = `Currently at: ${users.university}`;

  // Append elements to card
  info.appendChild(link);
  info.appendChild(stream);
  info.appendChild(university);
  card.appendChild(img);
  card.appendChild(info);
  card.appendChild(connectButton);
  info.style.display = "table";

  return card;
}

// Display search results
function displaySearchResults(data) {
  console.log("Displaying search results:", data); // Debugging statement
  var resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = ""; // Clear previous results

  // Display each user in the results container
  data.forEach((users) => {
    var card = createCard(users);
    card.classList.add("search-card");
    resultsContainer.appendChild(card);
  });
}

function CreateGroup() {
  var group = document.querySelector("#group");
  group.removeAttribute("hidden");
  var main = document.querySelector("main");
  main.style.filter = "blur(5px)";
}

// Function to toggle friend request status
function toggleFunction(button, requester_id, receiver_id) {
  if (button.innerHTML === "Connect") {
    sendFriendRequest(requester_id, receiver_id);
    button.innerHTML = "Sent";
  } else {
    disconnectFunction();
    button.innerHTML = "Connect";
  }
}

// Function to handle disconnect (not implemented here)
function disconnectFunction() {
  console.log("Disconnect");
}

// Function to send friend request
function sendFriendRequest(requester_id, receiver_id) {
  fetch("/sendRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requester_id, receiver_id }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Friend request response:", data)) // Debugging statement
    .catch((error) => {
      console.error("Error sending friend request:", error);
    });
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
    div.onclick = () => selectMember(searchuser);
    suggestions.appendChild(div);
  });
}

function selectMember(searchuser) {
  const membersInput = document.getElementById("members-input");
  const membersHidden = document.getElementById("members");
  const membersArray = membersHidden.value
    ? membersHidden.value.split(",")
    : [];
  if (!membersArray.includes(userId)) {
    membersArray.push(userId);
  }
  if (!membersArray.includes(`${searchuser._id}`)) {
    membersArray.push(`${searchuser._id}`);
    membersHidden.value = membersArray.join(",");

    // Clear the input field
    membersInput.value = "";
    // Set the input field value to the selected user's name
    // membersInput.value = `${searchuser.username}`;

    document.getElementById("suggestions").innerHTML = "";

    // Add visual representation of the selected member
    const selectedMembers = document.getElementById("selected-members");
    const div = document.createElement("div");
    div.classList.add("selected-member");
    div.innerText = `${searchuser.username}`;
    selectedMembers.appendChild(div);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const textElement = document.getElementById('animated-text');
  const text = textElement.innerText;
  textElement.innerHTML = '';

  text.split('').forEach((char, index) => {
    const span = document.createElement('span');
    span.innerText = char;
    span.classList.add('letter');
    textElement.appendChild(span);

    setTimeout(() => {
      span.style.opacity = 1;
    }, 60 * index);
  });
});