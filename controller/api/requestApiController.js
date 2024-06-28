const { Validator } = require('node-input-validator');
const helper = require('../../helper/helper');
const db = require('../../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

db.requested_services.belongsTo(db.services, {
    'foreignKey': 'service_id'
});

db.requests.belongsTo(db.properties, {
    'foreignKey': 'property_id'
});

db.properties.hasMany(db.property_images, {
    'foreignKey': 'property_id'
});

db.requests.hasMany(db.requested_services, {
    'foreignKey': 'request_id'
});

db.reviews.belongsTo(db.properties, {
    'foreignKey': 'propertyId'
});

module.exports = {

    addRequest: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                property_id: 'required',
                total_amount: 'required',
                date: 'required',
                time: 'required',
                serviceId: 'required'
            });

            let serviceIds = (req.body.serviceId).split(',');

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            var propertieDetails = await db.properties.findOne({ where: { id: req.body.property_id }, raw: true, nest: true });

            const saveRequest = await db.requests.create({
                user_id: req.user.id,
                property_id: req.body.property_id,
                total_amount: req.body.total_amount,
                date: req.body.date,
                time: req.body.time,
            });

            if (!saveRequest) {
                return helper.failed(res, 'Unable to create service request.');
            }

            for (let s in serviceIds) {
                const requstedServices = await db.requested_services.create({
                    request_id: saveRequest.id,
                    service_id: serviceIds[s]
                });

                if (!requstedServices) {
                    await db.requests.destroy({
                        where: { id: saveRequest.id }
                    });
                    return helper.failed(res, 'Error while saving services.');
                }
            }

            const selectedServices = await db.requested_services.findAll({
                attributes: ['id', 'request_id', 'service_id'],
                include: [
                    {
                        attributes: ['id', 'service_name', 'status', 'price'],
                        model: db.services
                    }
                ],
                where: { request_id: saveRequest.id },
                raw: true,
                nest: true
            });

            saveRequest.dataValues.selectedServices = selectedServices;

            const createNoti = await db.notifications.create({
                sender_id: req.user.id,
                reciver_id: 1,
                message: `${req.user.name} sent you a service request.`,
                status: 0,
                notification_type: 1
            });

            if (!createNoti) {
                res.failed(res, 'Unable to send notification.');
            }

//             let html = `

//             <table border="0" cellpadding="0" cellspacing="0" style="font-family:'Open Sans',sans-serif; url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); width:100%">
//   <tbody>
//     <tr>
//       <td>
//         <table align="center" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f8; margin:0 auto; max-width:670px; width:100%">
//           <tbody>
//             <tr>
//               <td style="height:80px">&nbsp;</td>
//             </tr>
//             <tr>
//               <td style="height:20px">&nbsp;</td>
//             </tr>
//             <tr>
//               <td>
//                 <table align="center" border="0" cellpadding="0" cellspacing="0" style="-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06); -webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06); background:#ffffff; border-radius:3px; box-shadow:0 6px 18px 0 rgba(0,0,0,.06); max-width:670px; text-align:center; width:95%">
//                   <tbody>
//                     <tr>
//                       <td style="height:40px">&nbsp;</td>
//                     </tr>
//                     <tr>
//                       <td>
//                         <h1>New Service Request</h1>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td>
//                         <h3 style="margin-left:0; margin-right:0">Request Details</h3>
//                         <p>
//                           <strong>User Name:</strong> ${req.user.name}
//                         </p>
//                         <p>
//                           <strong>Property Name:</strong> ${propertieDetails.title}
//                         </p>
//                         <p>
//                           <strong>Property Type:</strong> ${propertieDetails.property_type}
//                         </p>
//                         <p>
//                           <strong>Selected Services</strong>
//                         </p>
//                         <ul style="list-style-position: inside; padding-left: 0;">
//                         ${selectedServices.map(service => `<li>${service.service.service_name}</li>`).join('')}
//                         </ul>
//                       </td>
//                     </tr>
//                     <tr>
//                       <td style="height:40px">&nbsp;</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </td>
//             </tr>
//             <tr>
//               <td style="height:20px">&nbsp;</td>
//             </tr>
//             <tr>
//               <td style="height:80px">&nbsp;</td>
//             </tr>
//           </tbody>
//         </table>
//       </td>
//     </tr>
//   </tbody>
// </table>

// `

//             var transport = nodemailer.createTransport({
//                 host: "sandbox.smtp.mailtrap.io",
//                 port: 2525,
//                 auth: {
//                     user: "0a816fc66cb8dd",
//                     pass: "1fa47ee666e5d8"
//                 }
//             });

//             const data = await transport.sendMail({
//                 from: 'admin@realtor.com',
//                 to: 'admin@realtor.com',
//                 subject: `New service request from ${req.user.name}`,
//                 html: html
//             });

//             if (data) {
//                 console.log('Mail sent.');
//             }

            return helper.success(res, 'Request Submitted successfully', saveRequest);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    currentRequest: async (req, res) => {
        try {

            const curruntRequestList = await db.requests.findAll({
                include: [
                    {
                        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                        model: db.properties,
                        include: [
                            {
                                model: db.property_images,
                                attributes: ['id', 'image'],
                                limit: 1
                            }
                        ]
                    },
                ],
                where: {
                    user_id: req.user.id,
                    status: {
                        [Op.or]: [0, 1]
                    }
                },
                order: [['id', 'DESC']]
            });

            if (curruntRequestList.length == 0) {
                return helper.success2(res, 'No records available');
            }

            return helper.success(res, 'Current requests list', curruntRequestList);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    pastRequest: async (req, res) => {
        try {

            const pastRequestList = await db.requests.findAll({
                include: [
                    {
                        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                        model: db.properties,
                        include: [
                            {
                                model: db.property_images,
                                attributes: ['id', 'image'],
                                limit: 1
                            }
                        ]
                    },
                ],
                where: {
                    user_id: req.user.id,
                    status: {
                        [Op.or]: [2, 3]
                    }
                },
                order: [['id', 'DESC']]
            });

            if (pastRequestList.length == 0) {
                return helper.success2(res, 'No records available');
            }

            return helper.success(res, 'Current requests list', pastRequestList);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    requestDetails: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                requestId: 'required',
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse);
            }

            const id = req.body.requestId;

            const requestDetails = await db.requests.findOne({
                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                include: [{
                    attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                    model: db.properties,
                    include: [{
                        attributes: ['id', 'property_id', 'image'],
                        model: db.property_images
                    }],
                },

                {
                    attributes: ['id', 'request_id', 'service_id'],
                    model: db.requested_services,
                    include: [{
                        attributes: ['id', 'service_name', 'price'],
                        model: db.services
                    }]
                }

                ],
                where: { id }
            });

            if (!requestDetails) {
                return helper.failed(res, 'Unable to get request details');
            }

            const checkReview = await db.reviews.findOne({ where: { request_id: req.body.requestId } });

            requestDetails.dataValues.isReview = checkReview ? 1 : 0;

            return helper.success(res, 'Request Details', requestDetails);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    requestActivites: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                requestId: 'required',
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }
            const id = req.body.requestId;

            let requestActivites = await db.requested_services.findAll({
                where: { request_id: id },
                raw: true,
                nest: true
            });

            if (requestActivites.length == 0) {
                return helper.success2(res, 'No file found.');
            }

            requestActivites = requestActivites.filter((data) => {
                if (data.service_file != null) {
                    return data;
                }
            })

            return helper.success(res, 'Activites', requestActivites);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    addRatings: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                requestId: 'required',
                propertyId: 'required',
                rating: 'required',
                description: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const createRating = await db.reviews.create({
                user_id: req.user.id,
                request_id: req.body.requestId,
                propertyId: req.body.propertyId,
                rating: req.body.rating,
                description: req.body.description
            });

            if (!createRating) {
                return helper.failed('Unable to save review.');
            }

            return helper.success(res, 'Your review submitted successfully.', createRating);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    reviewListing: async (req, res) => {
        try {
            const getReview = await db.reviews.findAll({
                attributes: { exclude: ['updatedAt'] },
                include: [
                    {
                        attributes: ['id', 'user_id', 'title'],
                        model: db.properties,
                        include: [
                            {
                                attributes: ['id', 'property_id', 'image'],
                                model: db.property_images,
                                limit: 1
                            }
                        ]
                    }
                ],
                where: { user_id: req.user.id },
                order: [['id', 'DESC']]
            });

            if (getReview.length == 0) {
                return helper.success2(res, 'No reviews available');
            }

            return helper.success(res, 'Review list', getReview);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    updateReview: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                id: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const id = req.body.id;

            const updateReview = await db.reviews.update({
                rating: req.body.rating,
                description: req.body.description
            }, {
                where: {
                    id: req.body.id
                }
            });

            if (!updateReview) {
                return helper.failed(res, 'Unable to update review');
            }

            const updatedReview = await db.reviews.findByPk(id);

            return helper.success(res, 'Updated Review', updatedReview);


        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    reviewDetails: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                requestId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const reviewDetails = await db.reviews.findOne({
                include: [
                    {
                        attributes: ['id', 'title', 'location'],
                        model: db.properties,
                        include: [
                            {
                                attributes: ['id', 'image'],
                                model: db.property_images,
                                limit: 1
                            }
                        ]
                    }
                ],
                where: {
                    request_id: req.body.requestId
                }
            });

            if (!reviewDetails) {
                return helper.failed(res, 'Unable to get review');
            }

            return helper.success(res, 'Review details', reviewDetails);


        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    complateMark: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                requestId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const updateRequest = await db.requests.update({
                status: 3
            }, {
                where: { id: req.body.requestId }
            });

            if (!updateRequest) {
                return helper.failed(res, 'Unable to mark complete.');
            }

            const updatedRequest = await db.requests.findOne(
                {
                    attributes: ['status'],
                    where: { id: req.body.requestId }
                }
            );

            return helper.success(res, 'Updated Status', updatedRequest);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}