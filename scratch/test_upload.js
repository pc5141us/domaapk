const axios = require('axios');

const GAS_URL = "https://script.google.com/macros/s/AKfycbwKw2kHthblC0gsMC0BQnEzITu1u1MkjR7B7smjq4pGNzuj4IRGUDGK1EiktSILdnjl/exec";
const adminId = 682572594;

async function testAdd() {
    const payload = {
        message: {
            chat: { id: adminId },
            text: "/add Subway Surfers https://subway.surfers/download"
        }
    };

    try {
        console.log("Sending mock Telegram update to GAS...");
        const response = await axios.post(GAS_URL, payload);
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testAdd();
