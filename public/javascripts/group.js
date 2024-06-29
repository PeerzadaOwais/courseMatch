document.querySelector('#upload-icon').addEventListener("click",function(){
    document.querySelector('#upload-form input').click();
})

document.querySelector('#upload-form input').addEventListener( "change", function (){
document.querySelector('#upload-form').submit();
})
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.group-item').forEach(groupItem => {
        groupItem.addEventListener('click', async () => {
            const groupId = groupItem.getAttribute('data-group-id');
            const membersListDiv = document.getElementById('members-list');
            const chatMessagesDiv = document.getElementById('chat-messages');

            // Fetch members for the selected group
            try {
                const membersResponse = await fetch(`/groups/${groupId}/members`);
                const group = await membersResponse.json();
                const { members, creator } = group;
                // Clear the previous members list
                membersListDiv.innerHTML = '';

                // Populate the members list
                members.forEach(member => {
                    const memberElement = document.createElement('div');
                    const isAdmin = member._id === creator._id;
                    memberElement.innerHTML = `
                        <ul>
                            <li>
                                <img src="/images/uploads/${member.profileImage}" alt="">
                                <span>${member.username} ${isAdmin ? '(admin)' : ''}</span>
                                
                            </li>
                        </ul>
                    `;
                    membersListDiv.appendChild(memberElement);
                });

                // Fetch messages for the selected group
                const messagesResponse = await fetch(`/groups/${groupId}/messages`);
                const messages = await messagesResponse.json();

                // Clear the previous chat messages
                chatMessagesDiv.innerHTML = '';

                // Populate the chat messages
                messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message', 'sender');
                    messageElement.innerHTML = `
                        <p style="color: black;">${message.sender.username}:</p>
                        <p>${message.content}</p>
                    `;
                    chatMessagesDiv.appendChild(messageElement);
                });
            } catch (error) {
                console.error('Error fetching group members or messages:', error);
            }
        });
    });
});
