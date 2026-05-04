const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { mongoose } = require('../config/db');

// RENDER FORM
router.get('/', (req, res) => {
    res.render('certificate', { currentPage: '/certificate', error: null });
});

// GENERATE CERTIFICATE
router.post('/generate', async (req, res) => {
    try {
        const { email } = req.body;

        await mongoose.connection.asPromise();
        const collection = mongoose.connection.db.collection('registration-data');
        
        // Find registration by email (case-insensitive regex to handle mixed case inputs)
        const reg = await collection.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });

        if (!reg) {
            return res.render('certificate', { 
                currentPage: '/certificate', 
                error: 'No registration found with this email address.' 
            });
        }

        let members = Array.isArray(reg.members) ? reg.members : [reg.members].filter(Boolean);
        
        // If team members array is somehow empty but they have a team name or just registered,
        // we could fallback to email or something, but usually members array contains the names.
        if (members.length === 0) {
             return res.render('certificate', { 
                currentPage: '/certificate', 
                error: 'No team members found for this registration. Contact admin.' 
            });
        }

        // Create a new PDF Document
        const pdfDoc = await PDFDocument.create();

        // Standard Font as fallback
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const subFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Load background template if it exists
        const templatePath = path.join(__dirname, '../public/assets/certificate-template.png');
        let templateImage = null;
        if (fs.existsSync(templatePath)) {
            const templateBytes = fs.readFileSync(templatePath);
            templateImage = await pdfDoc.embedPng(templateBytes);
        }

        for (const memberName of members) {
            const page = templateImage 
                ? pdfDoc.addPage([templateImage.width, templateImage.height])
                : pdfDoc.addPage([841.89, 595.28]); // A4 landscape fallback

            const { width, height } = page.getSize();

            if (templateImage) {
                page.drawImage(templateImage, {
                    x: 0,
                    y: 0,
                    width,
                    height
                });
            } else {
                // Draw a fallback border if no template is provided
                page.drawRectangle({
                    x: 20, y: 20, width: width - 40, height: height - 40,
                    borderColor: rgb(0, 1, 1), borderWidth: 5
                });
                const titleText = 'CERTIFICATE OF PARTICIPATION';
                const titleWidth = font.widthOfTextAtSize(titleText, 35);
                page.drawText(titleText, {
                    x: width / 2 - titleWidth / 2,
                    y: height - 120,
                    size: 35,
                    font,
                    color: rgb(0, 0.8, 0.8),
                });
            }

            const nameText = String(memberName).toUpperCase();
            const collegeText = String(reg.collegeName || 'Unknown College').toUpperCase();
            const eventText = String(reg.eventName || 'Event').toUpperCase();

            // Overlay Text Logic - Assuming center alignment.
            // These coordinates will likely need adjustment based on the actual template image.
            const nameWidth = font.widthOfTextAtSize(nameText, 45);
            page.drawText(nameText, {
                x: (width / 2) - (nameWidth / 2),
                y: height / 2,
                size: 45,
                font: font,
                color: rgb(0, 0, 0)
            });

            const subText = `for successfully participating in ${eventText}`;
            const subWidth = subFont.widthOfTextAtSize(subText, 20);
            page.drawText(subText, {
                x: (width / 2) - (subWidth / 2),
                y: height / 2 - 50,
                size: 20,
                font: subFont,
                color: rgb(0.2, 0.2, 0.2)
            });

            const collegeLine = `from ${collegeText}`;
            const collegeWidth = subFont.widthOfTextAtSize(collegeLine, 20);
            page.drawText(collegeLine, {
                x: (width / 2) - (collegeWidth / 2),
                y: height / 2 - 80,
                size: 20,
                font: subFont,
                color: rgb(0.2, 0.2, 0.2)
            });
        }

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reg.teamName || 'Team'}_Certificates.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("Certificate Generation Error:", error);
        res.status(500).send("An error occurred while generating certificates.");
    }
});

module.exports = router;
