const bcrypt = require("bcryptjs");
const mammoth = require("mammoth");

async function test() {
    try {
        console.log("Testing bcryptjs...");
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("password123", salt);
        console.log("Hash:", hash);

        console.log("Testing mammoth...");
        // This will fail if file doesn't exist, but we just want to see if the require works
        console.log("Mammoth exists:", !!mammoth.extractRawText);
        
        console.log("All tests passed");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
