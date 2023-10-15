const express = require('express');
const router = express.Router();

const database = require('../shared/database');
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');
require('dotenv').config({ path: __dirname + '../../../.env' });

// Function to fetch the item count for a user based on their token
const fetchExpireCount = async (token, res) => {
    try {
        const tokenContent = token.split(" ")[1];

        jwt.verify(tokenContent, process.env.JWT_SIGN_SECRET, async (err, data) => {
            if (err) {
                return res.status(401).send({
                    ok: false, error: 'Unauthorized Request'
                });
            }

            console.log(data.user_id);

            const itemData = await database.executeQuery({
                query: 'SELECT COUNT(i.item_name) AS expireCount FROM items_info i INNER JOIN app_settings_info s ON i.user_id = s.user_id WHERE i.user_id = ?  AND i.expiry_date IN (CASE WHEN s.expire_3days = 1 THEN CURRENT_DATE + INTERVAL 3 DAY WHEN s.expire_5days = 1 THEN CURRENT_DATE + INTERVAL 5 DAY WHEN s.expire_1week = 1 THEN CURRENT_DATE + INTERVAL 7 DAY END )',
                values: [data.user_id]
            });

            if ('error' in itemData) {
                return res.status(500).send({
                    ok: false, error: itemData.error.userError
                });
            }

            console.log(itemData);

            return res.json({
                ok: true,
                expireCount: itemData[0].expireCount,
                data: itemData
            });            
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            ok: false, error: 'An error occurred while fetching item count.'
        });
    }
};

router.get('/', async (req, res, next) => {
    const tokenInput = req.headers.authorization;
    console.log("Request Auth Info: ", tokenInput);

    // Call the fetchExpireCount function to fetch the expire count
    fetchExpireCount(tokenInput, res);
});

module.exports = router;
