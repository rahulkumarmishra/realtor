const db = require("../../models");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const helper = require('../../helper/helper');
const FCM = require('fcm-node');

const serverKey = process.env.serverKey;

db.requests.belongsTo(db.users, {
    "foreignKey": "user_id"
});

db.requests.belongsTo(db.properties, {
    "foreignKey": "property_id"
});

db.requested_services.belongsTo(db.services, {
    "foreignKey": "service_id"
});

// db.requested_services.belongsTo(db.requests, {
//     "foreignKey": "request_id"
// });

module.exports = {

    requestList: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const requestList = await db.requests.findAll({
                include: [
                    {
                        attributes: ['id', 'name'],
                        model: db.users
                    },
                    {
                        attributes: ['id', 'title'],
                        model: db.properties
                    }
                ],
                order: [['id', 'DESC']]
            });
            res.render('request/request_list', { msg: req.flash('msg'), requestList, title: 'request', moment });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    viewRequest: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const requestDetails = await db.requests.findOne({
                include: [
                    {
                        attributes: ['name'],
                        model: db.users
                    },
                    {
                        attributes: ['id', 'title', 'property_type', 'location', 'area', 'description'],
                        model: db.properties
                    },

                ],
                where: { id: req.params.id },
                raw: true,
                nest: true
            });

            const getServiceData = await db.requested_services.findAll({
                attributes: ['id', 'request_id', 'service_id', 'service_file', 'service_file_type'],
                include: [
                    {
                        attributes: ['id', 'service_name', 'price'],
                        model: db.services
                    }
                ],
                where: { request_id: requestDetails.id },
                raw: true,
                nest: true
            });

            res.render('request/viewRequest', { msg: req.flash('msg'), title: 'request', requestDetails, moment, getServiceData });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    viewRating: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const getReview = await db.reviews.findOne({
                where: { request_id: req.params.id },
                raw: true,
                nest: true
            });

            res.render('request/viewRating', { msg: req.flash('msg'), title: 'request', getReview });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    requestStatus: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const updateStatus = await db.requests.update({
                status: req.body.selectedValue
            }, {
                where: { id: req.body.requestId }
            });

            if (!updateStatus) {
                req.flash('msg', 'Unable to update status.');
                return res.json(0);
            }

            const userData = await db.users.findOne({
                where: { id: req.body.id },
                raw: true,
            });


            let notiStatus = { 0: 'Pending', 1: 'Accepted', 2: 'Rejected', 3: 'Completed' };
            var getNotiDataForOther = {
                title: `Realtor360`,
                message: `Request status ${notiStatus[req.body.selectedValue]}`,
                type: 1,
                device_token: userData.device_token ? userData.device_token : "",
            };

            await helper.send_push_notifications(
                getNotiDataForOther
            );

            await db.notifications.create({
                sender_id: 1,
                reciver_id: req.body.id,
                message: `Request status ${notiStatus[req.body.selectedValue]}`,
                notification_type: 4
            })

            req.flash('msg', 'Status updated successfully.');
            return res.json(0);

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },

    uploadDoc: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const doc = await helper.fileUploaderWithName(req.files.docFile, '/uploads');

            const saveDoc = await db.requested_services.update({
                service_file: doc.name,
                service_file_type: doc.type
            }, {
                where: { id: req.body.id }
            });

            if (!saveDoc) {
                req.flash('msg', 'Unable to upload file');
                return res.json(0);
            }

            const rrData = await db.requested_services.findOne({
                where: { id: req.body.id },
                raw: true,
                nest: true
            });

            if (rrData) {
                var reuest = await db.requests.findOne({
                    include: [
                        { model: db.users }
                    ],
                    where: { id: rrData.request_id },
                    raw: true,
                    nest: true
                });
               
            }
           
            var getNotiDataForOther = {
                title: `Realtor360`,
                message: `Admin uploaded a file.`,
                type: 1,
                device_token: reuest.user.device_token ? reuest.user.device_token : "",
            };

            await helper.send_push_notifications(
                getNotiDataForOther
            );

            await db.notifications.create({
                sender_id: 1,
                reciver_id: reuest.user.id,
                message: `Admin uploaded a file.`,
                notification_type: 4
            })

            req.flash('msg', 'File uploaded successfully.');
            return res.json(1);


        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    removeFile: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const id = req.body.id;
            const findFile = await db.requested_services.findByPk(id);

            const filePath = path.join(__dirname, `../../public/uploads/${findFile.service_file}`);

            fs.unlink(filePath, (err) => {
                if (err) return console.log('Unable to delete image');
            })

            const delFile = await db.requested_services.update({
                service_file: null
            }, {
                where: { id: req.body.id }
            });

            if (!delFile) {
                req.flash('msg', "Unable to delete file.");
                return res.json(0);
            }



            req.flash('msg', "File removed successfully.");
            return res.json(1);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }


}