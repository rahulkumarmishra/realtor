var userId = document.querySelector('#adminId').value;

socket = io();

socket.emit('connect_user', { userId: userId });


socket.on('online_listner', (data) => {
    try {
        let userListContainer = document.querySelector('#userChatList');
        userListContainer.innerHTML = '';

        data.users.forEach(user => {
            const listItem = document.createElement('li');

            listItem.innerHTML = ` 
            <li id='user_${userId}' class="align-items-center" onclick="getChat('${user.id}',this)">
  <span class="avatar">
    <img src="/uploads/${user.image}" height="42" width="42" alt="Generic placeholder image">
  </span>
  <div class="chat-info flex-grow-1">
    <h5 class="mb-0">${user.name}</h5>
  </div>
  <div class="chat-meta text-nowrap ms-auto">
  ${user.msgCount !== 0 ? `<span class="badge bg-danger rounded-pill float-end" style="margin-left: 15px !important;">${user.msgCount}</span>` : ''}
  </div>
</li>
        `;
            userListContainer.appendChild(listItem);

        });


    } catch (error) {
        console.log('socket error', error.message);
    }
})


function getChat(receiver_id, dib) {
    try {


        $.ajax({
            type: "POST",
            url: "/getChat",
            data: { sender_id: userId, receiver_id: receiver_id },
            success: function (data) {
                var messagesArr = JSON.parse(data.message)
                // console.log(messagesArr, ">>>>>>>>>>>>>>>>>>>>>>>")

                var html = `<section class="chat-app-window">
    <!-- To load Conversation -->
    <div class="start-chat-area d-none">
        <div class="mb-1 start-chat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <h4 class="sidebar-toggle start-chat-text">Start Conversation</h4>
    </div>
    <!--/ To load Conversation -->

    <!-- Active Chat -->
    <div class="active-chat">
        <!-- Chat Header -->
        <div class="chat-navbar">
            <header class="chat-header">
                <div class="d-flex align-items-center">
                    <div class="sidebar-toggle d-block d-lg-none me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-menu font-medium-5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </div>
                    <div class="avatar avatar-border user-profile-toggle m-0 me-1">
                        <img src="/uploads/${data.receiver_detail.image}" alt="avatar" height="36" width="36">
                    </div>
                    <h6 class="mb-0">${data.receiver_detail.name}</h6>
                    <input type="hidden" id="chatUserId" name="chatUserId" value="${data.receiver_detail.id}">
                </div>
            </header>
        </div>
        <!--/ Chat Header -->

        <!-- User Chat messages -->
        <div class="user-chats ps ps--active-y">
            <div class="chats" id="demo">
                ${messagesArr.map(msg => {
                    console.log(msg, '8888888888888');
                    if (msg.sender_id == 1) {
                        return `
                            <div class="chat">
                                <div class="chat-avatar">
                                    <span class="avatar box-shadow-1 cursor-pointer">
                                        <img src="/uploads/${data.sender_detail.image}" alt="avatar" height="36" width="36">
                                    </span>
                                </div>
                                <div class="chat-body">
                                    <div class="chat-content">
                                        <p>${msg.message}</p>
                                        <span class="chat-time">${formatTimestamp(msg.createdAt)}</span>
                                    </div>
                                </div>
                            </div>`;
                    } else {
                        return `
                            <div class="chat chat-left">
                                <div class="chat-avatar">
                                    <span class="avatar box-shadow-1 cursor-pointer">
                                        <img src="/uploads/${data.receiver_detail.image}" alt="avatar" height="36" width="36">
                                    </span>
                                </div>
                                <div class="chat-body">
                                    <div class="chat-content">
                                        <p>${msg.message}</p>
                                        <span class="chat-time">${formatTimestamp(msg.createdAt)}</span>
                                    </div>
                                </div>
                            </div>`;
                    }
                }).join('')}
            </div>
            <div class="ps__rail-x" style="left: 0px; bottom: 0px;">
                <div class="ps__thumb-x" tabindex="0" style="left: 0px; width: 0px;"></div>
            </div>
            <div class="ps__rail-y" style="top: 0px; right: 0px; height: 367px;">
                <div class="ps__thumb-y" tabindex="0" style="top: 0px; height: 161px;"></div>
            </div>
        </div>
        <!-- User Chat messages -->

        <!-- Submit Chat form -->
        <form class="chat-app-form" action="javascript:void(0);">
            <div class="input-group input-group-merge me-1 form-send-message">
            <div class="input-group input-group-merge me-1 form-send-message">
            
            <input type="text" id="chatMsg" class="form-control message" placeholder="Type your message or use speech to text" required>
            <span class="input-group-text">
                <label for="attach-doc" class="attachment-icon form-label mb-0">
                    
                    <input type="file" id="attach-doc" hidden=""> </label></span>
        </div>
            </div>
            <button type="button" class="btn btn-primary send waves-effect waves-float waves-light" onclick="enterChat();">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send d-lg-none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span class="d-none d-lg-block">Send</span>
            </button>
        </form>
        <!--/ Submit Chat form -->
    </div>
    <!--/ Active Chat -->
</section>`;

                document.getElementById("chat_body").innerHTML = html;

            }
        })

    } catch (error) {
        console.log(error, '=-=-=-=-==thuiddd')
    }

}


function enterChat() {
    const msg = document.getElementById("chatMsg").value.trim();
    const reciverId = document.getElementById("chatUserId").value;
    const senderId = document.getElementById("adminId").value;
    const adminImg = document.getElementById("adminImg").value;
    if (/\S/.test(msg) && msg.length > 0) {
        const html = `<div class="chat chat-right">
                    <div class="chat-avatar float-end">
                    <span class="avatar box-shadow-1 cursor-pointer">
                    <img src="/uploads/${adminImg}" alt="avatar" height="36" width="36" />
                    </span>
                        </div>
                    <div class="chat-body">
                    <div class="chat-content">
                    <p>${msg}</p>
                    <span class="chat-time">${formatTimestamp(new Date())}</span>
                    </div>
                    </div>
                    </div>`;

        $('.user-chats > .chats').append(html);
        $('.message').val('');
        $('.user-chats').scrollTop($('.user-chats > .chats').height());

        let msgdata = {
            senderId: senderId,
            reciverId: reciverId,
            messages: msg
        };
    
        socket.emit('send_msg', msgdata);
    }

}

socket.on('send_msg_listener', (data) => {

    if (data.saveMessage.sender_id !== '1') {

        const message = data.saveMessage.message;
        const userImg = data.saveMessage.admin.image;

        const html = `<div class="chat chat-left">
                  <div class="chat-avatar float-start">
                  <span class="avatar box-shadow-1 cursor-pointer">
                  <img src="/uploads/${userImg}" alt="avatar" height="36" width="36" />
                  </span>
                      </div>
                  <div class="chat-body">
                  <div class="chat-content">
                  <p>${message}</p>
                      </div>
                  </div>
                  </div>`;

        $('.user-chats > .chats').append(html);
        $('.message').val('');
        $('.user-chats').scrollTop($('.user-chats > .chats').height());

    }

})


function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
}


