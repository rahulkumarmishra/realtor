const helper = require("../../helper/helper");
const { Validator } = require('node-input-validator');
const db = require("../../models");
const bcrypt = require('bcrypt');
const salt = 10;
const path = require('path');
const fs = require('fs');

db.notifications.belongsTo(db.users, {
    'foreignKey': 'sender_id', as: 'sender'
})


module.exports = {

    notification: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                status: 'required',
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const updateNotificationStatus = await db.users.update({
                is_notification: req.body.status
            }, {
                where: { id: req.user.id }
            });

            if (!updateNotificationStatus) {
                return helper.failed(res, 'Unable to update notification status.')
            }

            const notificationStatus = await db.users.findOne({
                attributes: ['id', 'name', 'is_notification'],
                where: { id: req.user.id }
            });

            return helper.success(res, 'Notification status updated successfully.', notificationStatus);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    cms: async (req, res) => {
        try {

            const v = new Validator(req.body, {
                type: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const getCms = await db.cms.findOne({
                where: { id: req.body.type }
            });

            if (!getCms) {
                return helper.failed(res, 'Unable to get cms data');
            }

            return helper.success(res, 'CMS Data', getCms);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    contactUs: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                name: 'required',
                email: 'required',
                country_code: 'required',
                phone_number: ['required', 'regex:^\\+?[0-9]+$', 'maxLength:15', 'minLength:10'],
                message: 'required',
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const saveContactUs = await db.contact_us.create({
                user_id: req.user.id,
                name: req.body.name,
                email: req.body.email,
                country_code: req.body.country_code,
                phone_number: req.body.phone_number,
                message: req.body.message,
            });

            if (!saveContactUs) {
                return helper.failed(res, 'Unable to send your message');
            }

            const createNoti = await db.notifications.create({
                sender_id: req.user.id,
                reciver_id: 1,
                message: `Contact us from ${req.user.name}`,
                status: 0,
                notification_type: 2
            });

            if (!createNoti) {
                res.failed(res, 'Unable to send notification.');
            }

            return helper.success(res, 'Your message has been sent successfully', saveContactUs);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    notificationList: async (req, res) => {
        try {
            const notifications = await db.notifications.findAll({
                include: [
                    {
                        attributes: ['id', 'name', 'image'],
                        model: db.users, as: 'sender'
                    }
                ],
                where: { reciver_id: req.user.id },
                order:[
                    [
                        'id','DESC'
                    ]
                ]
            });

            if (notifications.length == 0) {
                return helper.success2(res, 'No notification');
            }

            return helper.success(res, 'Notifications', notifications);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }
}