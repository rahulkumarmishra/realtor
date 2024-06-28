const { Op } = require("sequelize");
const db = require("./models");
const helper = require('./helper/helper');
db.chats.belongsTo(db.users, {
    'foreignKey': 'sender_id', as: 'sender'
});

db.chats.belongsTo(db.users, {
    'foreignKey': 'reciver_id', as: 'reciver'
});

module.exports = (io) => {

    io.on('connection', (socket) => {
        console.log('Socket connected.');

        socket.on('connect_user', async (connect_user) => {
            try {

                let adminTime = await db.admin_timing.findOne({
                    attributes: ['start_time', 'end_time'],
                    where: { user_id: 1 }
                });

                adminTime.dataValues.curruntTime = new Date();

                var userId = connect_user.userId;
                var socketId = socket.id;

                const checkUser = await db.socket_user.findOne({
                    where: { user_id: connect_user.userId }
                });

                if (checkUser) {
                    const updateOnlineUser = await db.socket_user.update({
                        is_online: 1,
                        socket_id: socket.id

                    }, {
                        where: { user_id: userId }
                    })
                } else {
                    const saveOnlineUser = await db.socket_user.create({
                        user_id: connect_user.userId,
                        socket_id: socketId,
                        is_online: 1
                    })
                }

                const userList = await db.users.findAll({
                    attributes: ['id', 'name', 'image'],
                    where: { role: 1 },
                    raw: true,
                    nest: true
                });

                for (let user of userList) {
                    user.msgCount = await db.chats.count({
                        where: {
                            sender_id: user.id,
                            reciver_id: userId,
                            is_read: 0
                        },
                        raw: true,
                        nest: true
                    })
                }

                for (let user of userList) {
                    const latestMessage = await db.chats.findOne({
                        attributes: ['createdAt'],
                        where: {
                            [Op.or]: [
                                { sender_id: userId, reciver_id: user.id },
                                { sender_id: user.id, reciver_id: userId }
                            ],
                        },
                        order: [['createdAt', 'DESC']],
                        raw: true,
                        nest: true
                    });

                    user.latestMessageTimestamp = latestMessage ? latestMessage.createdAt : null;
                }

                // Order the user list based on the latest message timestamp
                userList.sort((a, b) => (b.latestMessageTimestamp || 0) - (a.latestMessageTimestamp || 0));

                let success_message = {
                    message: "online successfully",
                    adminTime: adminTime,
                    users: userList,

                }
                socket.emit('online_listner', success_message);


            } catch (error) {
                console.log(error);
            }
        });

        socket.on('disconnect_user', async (disconnect_user) => {
            const offlineUser = await db.users.update({
                is_online: 0
            }, {
                where: { userId: disconnect_user.userId }
            });

            if (offlineUser) {
                let success_message = {
                    message: "user disconnect successfully"
                }
                socket.emit('disconnect_user', success_message);
            }
        });

        socket.on('send_msg', async (send_msg) => {
            try {
                const findConstant = await db.chat_constant.findOne({
                    where: {
                        [Op.or]: [
                            { sender_id: send_msg.senderId, reciver_id: send_msg.reciverId },
                            { reciver_id: send_msg.senderId, sender_id: send_msg.reciverId }
                        ]
                    },
                    raw: true,
                    nest: true
                });

                if (!findConstant) {
                    var createConstant = await db.chat_constant.create({
                        sender_id: send_msg.senderId,
                        reciver_id: send_msg.reciverId,
                        last_message: send_msg.messages
                    });

                    if (!createConstant) {
                        console.log('Unable to create constant.');
                    }
                }



                var saveMsg = await db.chats.create({
                    constant_Id: createConstant ? createConstant.id : findConstant.id,
                    sender_id: send_msg.senderId,
                    reciver_id: send_msg.reciverId,
                    message: send_msg.messages,
                    type: 1,
                    is_read: 0
                });



                if (saveMsg) {
                    const updateLastMsg = await db.chat_constant.update({
                        last_message: saveMsg.message
                    }, {
                        where: { id: saveMsg.constant_Id }
                    });

                    if (!updateLastMsg) {
                        console.log('Unable to update last msg.');
                    }
                }

                let findSocketId = await db.socket_user.findOne({
                    where: {
                        user_id: send_msg.reciverId
                    },
                    raw: true,
                    nest: true
                });

                if (saveMsg.reciver_id) {
                    var adminDetails = await db.users.findOne({
                        attributes: ['id', 'name', 'image'],
                        where: { id: saveMsg.sender_id },
                        raw: true,
                        nest: true
                    })
                }
                saveMsg.dataValues.admin = adminDetails;

                let finaldata = {
                    response: "message sent successfully",
                    saveMessage: saveMsg
                }

                const userDetails = await db.users.findOne({
                    where: { id: saveMsg.reciver_id }
                });

                const senderDetails = await db.users.findOne({
                    where: { id: saveMsg.sender_id }
                });

                if (saveMsg.reciver_id != 1) {
                    var getNotiDataForOther = {
                        title: `Realtor360`,
                        message: `Admin sent a message.`,
                        type: 1,
                        device_token: userDetails.device_token,

                    };
                    await helper.send_push_notifications(
                        getNotiDataForOther
                    );
                }

                if (saveMsg.reciver_id == 1) {

                    const createNoti = await db.notifications.create({
                        sender_id: saveMsg.sender_id,
                        reciver_id: saveMsg.reciver_id,
                        message: `${senderDetails.name} send a message.`,
                        notification_type: 3
                    });

                    if (!createNoti) {
                        console.log('Unable to create notification');
                    }
                }

                socket.emit('send_msg_listener', finaldata)
                socket.to(findSocketId.socket_id).emit("send_msg_listener", finaldata);

            } catch (error) {
                console.log("🚀 ~ file: socket.js:86 ~ socket.on ~ socket error:", error)
            }
        });

        socket.on('get_chat', async (get_chat) => {
            try {

                const adminData = await db.users.findOne({
                    attributes: ['id', 'name', 'image'],
                    where: { id: 1 },
                    raw: true,
                    nest: true
                });

                var findConstant = await db.chat_constant.findOne({
                    where: {
                        [Op.or]: [
                            { sender_id: get_chat.senderId, reciver_id: get_chat.reciverId },
                            { reciver_id: get_chat.senderId, sender_id: get_chat.reciverId }
                        ]
                    },
                    raw: true,
                    nest: true
                });

                if (findConstant) {
                    var getAllChat = await db.chats.findAll({
                        include: [
                            {
                                attributes: ['id', 'name', 'image'],
                                model: db.users, as: 'sender'
                            },

                            {
                                attributes: ['id', 'name', 'image'],
                                model: db.users, as: 'reciver'
                            }
                        ],
                        where: {
                            constant_Id: findConstant.id
                        },
                        raw: true,
                        nest: true
                    })

                }

                let getChat = {
                    admin_info: adminData,
                    message: getAllChat
                }
                socket.emit('get_messages', getChat);

            } catch (error) {
                console.log("Error in get_chat", error)
            }
        });


        socket.on('notification', async (notification) => {
            try {
                const adminNotification = await db.notifications.findAll({
                    where: { reciver_id: notification.userId, status: 0 },
                    order: [['createdAt', 'DESC']],
                    raw: true,
                    nest: true
                });

                socket.emit('notification', adminNotification);
            } catch (error) {
                console.log('Socket error of notification');
            }
        });
    })
}