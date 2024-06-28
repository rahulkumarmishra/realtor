const db = require("../../models");
const { Op } = require('sequelize');
const helper = require("../../helper/helper")
const moment = require("moment")

db.chat_constant.belongsTo(db.users, {
  'foreignKey': 'sender_id', as: 'sender'
});

db.chat_constant.belongsTo(db.users, {
  'foreignKey': 'reciver_id', as: 'reciver'
});

module.exports = {

  chatPage: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");

      const adminId = global.adminData.id;
      const adminImg = global.adminData.image;

      const userChatList = await db.chat_constant.findAll({
        where: {
          [Op.or]: [
            { sender_id: global.adminData.id },
            { reciver_id: global.adminData.id }
          ]
        },
        raw: true,
        nest: true
      });

      let userIds = [];
      for (let i in userChatList) {
        if (userChatList[i].sender_id != global.adminData.id) {
          userIds.push(userChatList[i].sender_id);
        }

        if (userChatList[i].reciver_id != global.adminData.id) {
          userIds.push(userChatList[i].reciver_id);
        }
      }

      const userList = await db.users.findAll({
        attributes: ['id', 'name', 'image'],
        where: { id: userIds },
        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });

      // chat contacts

      const contacts = await db.users.findAll({
        attributes: ['id'],
        raw: true,
        nest: true
      });

      const ids = [];
      for (let id in contacts) {
        ids.push(contacts[id].id);
      }

      const contactIds = ids.filter(id => !userIds.includes(id));

      const contactList = await db.users.findAll({
        attributes: ['id', 'name', 'image'],
        where: { id: contactIds, role: 1 },
        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });

      res.render('chat/chat', { msg: req.flash('msg'), title: 'chat', adminId, adminImg, userList, contactList });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  },





  getChat: async (req, res) => {
    try {
      await db.chats.update(
        { is_read: 1 },
        {
          where: {
            sender_id: req.body.receiver_id,
            reciver_id: req.body.sender_id,
          },
        }
      );

      var checkConstant = await db.chat_constant.findOne({
        where: {
          [Op.or]: [
            {
              sender_id: req.body.sender_id,
              reciver_id: req.body.receiver_id,
            },
            {
              sender_id: req.body.receiver_id,
              reciver_id: req.body.sender_id,
            },
          ],
        },
      });

      var messages = null;

      var receiverDetail = await db.users.findOne({
        where: { id: req.body.receiver_id },
      });

      receiverDetail.is_online = receiverDetail.is_online != 1
        ? await helper.timeAgo(receiverDetail.is_online)
        : receiverDetail.is_online;

      var senderDetail = await db.users.findOne({
        where: { id: req.body.sender_id },
      });

      if (checkConstant) {
        var messagesArr = await db.chats.findAll({
          where: {
            constant_Id: checkConstant.id,
          },
          raw: true,
          nest: true,
        });

        var dateArr = [];
        for (let i in messagesArr) {
          if (
            dateArr.includes(
              moment(messagesArr[i].createdAt).format("YYYY-MM-DD")
            )
          ) {
            messagesArr[i].message_date = 0;
          } else {
            dateArr.push(moment(messagesArr[i].createdAt).format("YYYY-MM-DD"));
            var chat_date = helper.chatDate(messagesArr[i].createdAt);
            // console.log(chat_date,"????")

            messagesArr[i].message_date = await helper.chatDate(
              messagesArr[i].createdAt
            );
          }
        }

        messages = messagesArr;
      }

      // console.log(messages);


      return res.json({
        sender_id: req.body.sender_id,
        receiver_id: req.body.receiver_id,
        receiver_detail: receiverDetail,
        sender_detail: senderDetail,
        message: JSON.stringify(messages),
        // is_block: check_block ? check_block.status : 0,
      });
    } catch (error) {
      console.log(error);
    }
  },

}