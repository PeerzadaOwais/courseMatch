document.addEventListener('DOMContentLoaded', function() {
    fetchRoomList();

    const createRoomForm = document.getElementById('create-room-form');
    createRoomForm.addEventListener('submit', function(event) {
        event.preventDefault();
        createRoom();
    });
});

function fetchRoomList() {
    fetch('/api/rooms')
        .then(response => response.json())
        .then(rooms => {
            const roomList = document.getElementById('room-list').querySelector('ul');
            roomList.innerHTML = '';
            rooms.forEach(room => {
                const li = document.createElement('li');
                li.textContent = room.name;
                roomList.appendChild(li);
            });
        });
}

function createRoom() {
    const roomName = document.getElementById('room-name').value;
    const roomDescription = document.getElementById('room-description').value;

    fetch('/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: roomName, description: roomDescription })
    })
    .then(response => response.json())
    .then(room => {
        fetchRoomList();
        document.getElementById('create-room-form').reset();
    })
    .catch(error => {
        console.error('Error creating room:', error);
    });
}
