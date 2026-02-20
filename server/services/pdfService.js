const PDFDocument = require('pdfkit');

const generatePassPDF = async (pass, outputStream) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [400, 600], margin: 0 });
        doc.pipe(outputStream);

        // Background
        doc.rect(0, 0, 400, 600).fill('#1a1a2e');

        // Header strip
        doc.rect(0, 0, 400, 90).fill('#0f3460');
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('VISITOR PASS', 0, 20, { align: 'center' });
        doc.fontSize(11).font('Helvetica').text('VisitPass Management System', 0, 50, { align: 'center' });

        // Status badge
        const statusColor = pass.status === 'active' ? '#27ae60' : pass.status === 'used' ? '#f39c12' : '#e74c3c';
        doc.rect(140, 68, 120, 22).fill(statusColor);
        doc.fillColor('#ffffff').fontSize(10).text(pass.status.toUpperCase(), 140, 74, { width: 120, align: 'center' });

        // Visitor photo placeholder or name circle
        doc.circle(200, 145, 45).fill('#16213e').stroke('#e94560');
        doc.fillColor('#e94560').fontSize(28).font('Helvetica-Bold');
        const initials = (pass.visitor?.name || 'V').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        doc.text(initials, 175, 128);

        // Visitor name
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
            .text(pass.visitor?.name || 'Visitor', 0, 200, { align: 'center' });
        doc.fillColor('#a0a0b0').fontSize(11).font('Helvetica')
            .text(pass.visitor?.company || pass.visitor?.email || '', 0, 222, { align: 'center' });

        // Divider
        doc.moveTo(40, 248).lineTo(360, 248).stroke('#e94560');

        // Details
        const details = [
            ['Pass ID', pass.passId ? pass.passId.slice(0, 16).toUpperCase() : 'N/A'],
            ['Host', pass.host?.name || 'N/A'],
            ['Department', pass.host?.department || 'Main Office'],
            ['Location', pass.location || 'Main Office'],
            ['Valid From', pass.validFrom ? new Date(pass.validFrom).toLocaleString('en-IN') : 'N/A'],
            ['Valid To', pass.validTo ? new Date(pass.validTo).toLocaleString('en-IN') : 'N/A']
        ];

        let y = 265;
        details.forEach(([label, value]) => {
            doc.fillColor('#a0a0b0').fontSize(9).font('Helvetica').text(label, 40, y);
            doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(value, 150, y, { width: 210 });
            y += 24;
        });

        // QR Code section
        doc.moveTo(40, 420).lineTo(360, 420).stroke('#333355');
        doc.fillColor('#a0a0b0').fontSize(10).text('SCAN QR CODE TO VERIFY', 0, 430, { align: 'center' });

        if (pass.qrCode && pass.qrCode.startsWith('data:image')) {
            try {
                const qrBuffer = Buffer.from(pass.qrCode.split(',')[1], 'base64');
                doc.image(qrBuffer, 145, 445, { width: 110, height: 110 });
            } catch (e) {
                doc.fillColor('#555577').rect(145, 445, 110, 110).fill();
                doc.fillColor('#aaaacc').fontSize(9).text('QR Code', 145, 495, { width: 110, align: 'center' });
            }
        }

        // Footer
        doc.rect(0, 570, 400, 30).fill('#0f3460');
        doc.fillColor('#a0a0b0').fontSize(8).text(
            `Generated: ${new Date().toLocaleString('en-IN')}  |  VisitPass System`,
            0, 578, { align: 'center' }
        );

        doc.end();
        outputStream.on('finish', resolve);
        outputStream.on('error', reject);
        doc.on('error', reject);
    });
};

module.exports = { generatePassPDF };
