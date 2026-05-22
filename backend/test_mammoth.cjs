const mammoth = require("mammoth");
const fs = require("fs");

async function test() {
    try {
        console.log("Testing mammoth...");
        // result = await mammoth.extractRawText({ path: "test.docx" });
        // console.log("Result:", result.value);
        console.log("Mammoth required successfully");
    } catch (e) {
        console.error("Mammoth error:", e);
    }
}

test();
