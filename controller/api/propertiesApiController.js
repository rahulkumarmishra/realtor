const { Validator } = require('node-input-validator');
const fs = require('fs');
const path = require('path');
const helper = require('../../helper/helper');
const db = require('../../models');

db.properties.hasMany(db.property_images, {
    'foreignKey': 'property_id'
});

module.exports = {

    addProperty: async (req, res) => {
        try {

            const v = new Validator({ ...req.body, ...req.files }, {
                title: 'required',
                property_type: 'required',
                location: 'required',
                area: 'required',
                description: 'required',
                images: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const createProperty = await db.properties.create({
                user_id: req.user.id,
                title: req.body.title,
                property_type: req.body.property_type,
                property_status: req.body.property_status,
                location: req.body.location,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                area: req.body.area,
                description: req.body.description
            });

            if (!createProperty) {
                return helper.failed(res, 'Unable to save property details.');
            }

            const imgArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

            for (let i in imgArray) {
                const image = await helper.fileUploader(imgArray[i], '/uploads');

                const savePropertyImg = await db.property_images.create({
                    property_id: createProperty.id,
                    image: image.name
                });

                if (!savePropertyImg) {
                    await db.properties.destroy({
                        where: { id: createProperty.id }
                    });
                    console.log('Unable to save property images.');
                }
            }

            const getAllImages = await db.property_images.findAll({
                attributes: ['id', 'property_id', 'image'],
                where: { property_id: createProperty.id }
            });

            createProperty.dataValues.images = getAllImages;

            return helper.success(res, 'Poperty Details', createProperty);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    propertyList: async (req, res) => {
        try {
            const propertList = await db.properties.findAll({
                attributes: ['id', 'user_id', 'title', 'property_type', 'location', 'latitude', 'longitude', 'area', 'description', 'property_status'],
                include: [{
                    attributes: ['id', 'property_id', 'image'],
                    model: db.property_images
                }],
                where: { user_id: req.user.id }
            });

            if (propertList.length == 0) {
                return helper.success2(res, 'No property of this user');
            }

            return helper.success(res, 'Properties List', propertList);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    propertyDetails: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                propertyId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const propertyDetails = await db.properties.findOne({
                attributes: ['id', 'user_id', 'title', 'property_type', 'location', 'latitude', 'longitude', 'area', 'description', 'property_status'],
                include: [{
                    attributes: ['id', 'property_id', 'image'],
                    model: db.property_images
                }],
                where: { id: req.body.propertyId }
            });

            if (!propertyDetails) {
                return helper.failed(res, 'Not found.');
            }

            const services = await db.services.findAll({
                attributes: ['id', 'service_name', 'status', 'price'],
                where: { status: 1 },
                raw: true,
                nest: true
            });

            propertyDetails.dataValues.services = services;

            return helper.success(res, 'Property Details with services list', propertyDetails);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    getPropertyDetails: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                propertyId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const propertyDetails = await db.properties.findOne({
                attributes: ['id', 'user_id', 'title', 'property_type', 'location', 'latitude', 'longitude', 'area', 'description', 'property_status'],
                include: [{
                    attributes: ['id', 'property_id', 'image'],
                    model: db.property_images
                }],
                where: { id: req.body.propertyId }
            });

            if (!propertyDetails) {
                return helper.failed(res, 'Not found.');
            }

            return helper.success(res, 'Property Details', propertyDetails);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    updateProperty: async (req, res) => {
        try {

            const v = new Validator(req.body, {
                title: 'required',
                property_type: 'required',
                location: 'required',
                area: 'required',
                description: 'required',
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const propertyData = await db.properties.findOne({
                where: { id: req.body.propertyId },
                raw: true,
                nest: true
            });

            const updateProperty = await db.properties.update({
                user_id: req.user.id,
                title: req.body.title ? req.body.title : propertyData.title,
                property_type: req.body.property_type ? req.body.property_type : propertyData.property_type,
                property_status: req.body.property_status  ? req.body.property_status : propertyData.property_status,
                location: req.body.location ? req.body.location : propertyData.location,
                latitude: req.body.latitude ? req.body.latitude : propertyData.location,
                longitude: req.body.longitude ? req.body.longitude : propertyData.longitude,
                area: req.body.area ? req.body.area : propertyData.area,
                description: req.body.description ? req.body.description : propertyData.description
            },
                { where: { id: req.body.propertyId } }
            );

            if (!updateProperty) {
                return helper.failed(res, 'Unable to update property details.');
            }

            if (req.files) {
                const imgArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

                for (let i in imgArray) {
                    const image = await helper.fileUploader(imgArray[i], '/uploads');

                    const savePropertyImg = await db.property_images.create({
                        property_id: req.body.propertyId,
                        image: image.name
                    });

                    if (!savePropertyImg) {
                        console.log('Error while saving images.');
                    }
                }
            }

            const updatedPropertyDetails = await db.properties.findOne({
                attributes: ['id', 'user_id', 'title', 'property_type', 'location', 'latitude', 'longitude', 'area', 'description', 'property_status'],
                include: [{
                    attributes: ['id', 'property_id', 'image'],
                    model: db.property_images
                }],
                where: {
                    id: req.body.propertyId
                }
            });

            return helper.success(res, 'Property updated successfully.', updatedPropertyDetails);

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    deleteProperty: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                propertyId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const deleteProperty = await db.properties.destroy({
                where: { id: req.body.propertyId }
            });

            if (!deleteProperty) {
                return helper.failed(res, 'Unable to delete property.');
            }

            const deletePropertyRequest = await db.requests.destroy({
                where: { property_id: req.body.propertyId }
            });

            const deletePropertyReview = await db.reviews.destroy({
                where: { propertyId: req.body.propertyId }
            });

            // if (!deletePropertyRequest) {
            //     return console.log('Unable to delete property request.');
            // }

            return helper.success(res, 'Property deleted successfully.');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    deleteImage: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                imageId: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }
            const id = req.body.imageId
            const getImg = await db.property_images.findByPk(id);
            if (!getImg) {
                return helper.failed(res, 'Invalid image id.');
            }
            const imgPath = path.join(__dirname, `../../public/uploads/${getImg.image}`);

            fs.unlink(imgPath, (err) => {
                if (err) return helper.failed(res, 'Unable to remove property images.');
            })

            const deletePropertyImg = await db.property_images.destroy({
                where: { id: req.body.imageId }
            });

            if (!deletePropertyImg) {
                return helper.failed(res, 'Unable to delete property images.');
            }

            return helper.success(res, 'Property image deleted successfully.');

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}