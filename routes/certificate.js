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

        // Find registration by email (case-insensitive)
        const reg = await collection.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });

        if (!reg) {
            return res.render('certificate', {
                currentPage: '/certificate',
                error: 'No registration found with this email address.'
            });
        }

        let members = Array.isArray(reg.members) ? reg.members : [reg.members].filter(Boolean);

        members = members.filter(memberName => {
            if (!memberName) return false;
            const name = String(memberName).trim();
            const lowerName = name.toLowerCase();

            // Check for empty, dashes, "None", or length <= 5
            if (name === '' || name.includes('-') || lowerName.includes('none') || name.length <= 5) {
                return false;
            }
            return true;
        });

        if (members.length === 0) {
            return res.render('certificate', {
                currentPage: '/certificate',
                error: 'No valid team members found for this registration. Contact admin.'
            });
        }

        // Load background template
        const templatePath = path.join(__dirname, '../public/assets/certificate.png');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).send('Certificate template not found. Please contact admin.');
        }
        const templateBytes = fs.readFileSync(templatePath);

        // Create PDF
        const pdfDoc = await PDFDocument.create();

        // Embed fonts
        const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        // Embed the PNG template
        const templateImage = await pdfDoc.embedPng(templateBytes);

        // A4 Landscape: 841.89 x 595.28 pt
        // We'll use the image's natural aspect ratio scaled to A4 landscape
        const pageWidth = 841.89;
        const pageHeight = 595.28;

        for (const memberName of members) {
            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Draw background image stretched to full page
            page.drawImage(templateImage, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
            });

            // ─────────────────────────────────────────────────────────────
            // TEXT OVERLAY — coordinates tuned to match the certificate design
            //
            // The certificate layout (top→bottom):
            //   • Header logos/text (pre-printed on image)
            //   • "CERTIFICATE OF PARTICIPATION" (pre-printed)
            //   • "This is to certify that" (pre-printed)
            //   • "Mr/MS. ______[NAME]______ of"  ← NAME goes here
            //   • "______[COLLEGE]______ has"     ← COLLEGE goes here
            //   • Body paragraph (pre-printed)
            //   • Signature block (pre-printed)
            // ─────────────────────────────────────────────────────────────

            const name = String(memberName).trim();
            const college = String(reg.collegeName || '').trim();

            // pdf-lib coordinate system: Y=0 is BOTTOM of page, Y=pageHeight is TOP
            // Page height = 595.28pt (A4 landscape)
            //
            // From the certificate image (top→bottom):
            //   "Mr/MS. ___[NAME]___ of"   → ~57% from top → y ≈ 595 * 0.43 ≈ 256
            //   "___[COLLEGE]___ has"       → ~65% from top → y ≈ 595 * 0.35 ≈ 208

            const nameFontSize = 22;
            const collegeFontSize = 22;

            // --- NAME LINE (Mr/MS. line) ---
            // Underline runs from after "Mr/MS. " (~x=155) to before "of" (~x=770)
            const nameLineLeft = 10;
            const nameLineRight = 700;
            const nameLineY = 290;   // y from bottom

            const nameWidth = fontBold.widthOfTextAtSize(name, nameFontSize);
            const nameX = nameLineLeft + (nameLineRight - nameLineLeft) / 2 - nameWidth / 2;

            page.drawText(name, {
                x: nameX,
                y: nameLineY,
                size: nameFontSize,
                font: fontBold,
                color: rgb(0, 0, 0),
            });

            // --- COLLEGE LINE (second blank line) ---
            // Underline runs from ~x=60 to before "has" (~x=750)
            const collegeLineLeft = 60;
            const collegeLineRight = 700;
            const collegeLineY = 240;   // y from bottom

            const collegeWidth = fontBold.widthOfTextAtSize(college, collegeFontSize);
            const collegeX = collegeLineLeft + (collegeLineRight - collegeLineLeft) / 2 - collegeWidth / 2;

            page.drawText(college, {
                x: collegeX,
                y: collegeLineY,
                size: collegeFontSize,
                font: fontBold,
                color: rgb(0, 0, 0),
            });
        }

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${(reg.teamName || 'Team').replace(/\s+/g, '_')}_Certificates.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Certificate Generation Error:', error);
        res.status(500).send('An error occurred while generating certificates.');
    }
});

module.exports = router;
