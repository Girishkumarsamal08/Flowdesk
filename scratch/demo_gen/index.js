const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "Flowdesk - Corporate Policy Framework",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Confidential - For Internal Use Only",
                            bold: true,
                            color: "FF0000",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }), // Spacer
                new Paragraph({
                    text: "1. Overview",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "This document outlines the standard operating procedures and customer support policies for our organization. Flowdesk aims to provide a seamless experience for both our team and our clients.",
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "2. Shipping and Delivery Policy",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "We aim to process all orders within 2-3 business days. Shipping times vary by location:",
                }),
                new Paragraph({
                    text: "• Domestic (India): 3-5 business days\n• International: 7-14 business days",
                }),
                new Paragraph({
                    text: "Delivery partners include DHL, FedEx, and BlueDart. All shipments are tracked.",
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "3. Refund and Cancellation Policy",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "Customers may request a full refund within 30 days of purchase, provided the product/service has not been fully consumed. Cancellations must be made at least 24 hours before the scheduled service date.",
                }),
                new Paragraph({
                    text: "Refunds are processed within 7-10 business days to the original payment method.",
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "4. Data Privacy",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "We take data privacy seriously. All customer information is encrypted and stored according to GDPR and local compliance standards. We do not sell data to third parties.",
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "5. Contact Information",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "For support queries, please reach out to support@flowdesk.ai or visit our portal at https://flowdesk.ai/support.",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Flowdesk_Demo_Policy.docx", buffer);
    console.log("Document created successfully: Flowdesk_Demo_Policy.docx");
});
