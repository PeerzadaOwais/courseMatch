async function acceptFriendRequest(connection_id) {
    try {
        const response = await fetch('/acceptRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ connection_id })
        });

        if (response.ok) {
            location.reload();
        } else {
            console.error('Error accepting friend request');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

async function rejectFriendRequest(connection_id) {
    try {
        const response = await fetch('/rejectRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ connection_id })
        });

        if (response.ok) {
            location.reload();
        } else {
            console.error('Error rejecting friend request');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}