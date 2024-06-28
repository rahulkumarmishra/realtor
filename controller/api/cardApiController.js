const { Validator } = require('node-input-validator');
const helper = require('../../helper/helper');
const db = require('../../models');

module.exports = {

    addCard: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                card_number: 'required',
                card_holder_name: 'required',
                expiration_date: 'required',
                cvv: 'required'
            });

            let errorsResponse = await helper.checkValidation(v)
            if (errorsResponse) {
                return await helper.failed(res, errorsResponse)
            }

            const allCards = await db.cards.findAll({ where: { user_id: req.user.id }, raw: true, nest: true });

            const cardExists = allCards.some(card => card.card_number == req.body.card_number);

            if (cardExists) {
                return helper.failed(res, 'This card already saved.');
            }

            let expiration_date = req.body.expiration_date;
            const [month, year] = expiration_date.split('/');
            expiration_date = `20${year}-${month.padStart(2, '0')}-01`;

            const addCard = await db.cards.create({
                user_id: req.user.id,
                card_number: req.body.card_number,
                card_holder_name: req.body.card_holder_name,
                expiration_date: expiration_date,
                cvv: req.body.cvv
            });

            if (!addCard) {
                return helper.failed(res, 'Unable to save card.');
            }

            return helper.success(res, 'Card added successfully', addCard);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    cardList: async (req, res) => {
        try {
            const allCards = await db.cards.findAll({
                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                where: { user_id: req.user.id },
                raw: true, nest: true
            });

            if (allCards.length == 0) {
                return helper.success(res, 'No card available');
            }

            return helper.success(res, 'Card list', allCards);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    

}