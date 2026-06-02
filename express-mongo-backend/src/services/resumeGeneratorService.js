const PDFDocument = require('pdfkit');
const Settings = require('../models/Settings');

class ResumeGeneratorService {
    async generateResume(candidate, aiData) {
        return new Promise(async (resolve, reject) => {
            try {
                const settings = await Settings.findOne();
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4'
                });

                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // --- Watermark (Company Logo) ---
                if (settings?.payroll?.logo) {
                    try {
                        const logoData = settings.payroll.logo;
                        // Handle base64 logo
                        const base64Data = logoData.includes('base64,') ? logoData.split('base64,')[1] : logoData;
                        const logoBuffer = Buffer.from(base64Data, 'base64');
                        
                        doc.save();
                        doc.opacity(0.1);
                        // Center watermark
                        doc.image(logoBuffer, doc.page.width / 2 - 150, doc.page.height / 2 - 150, { width: 300 });
                        doc.restore();
                    } catch (err) {
                        console.error('Error adding watermark:', err);
                    }
                }

                // --- Header ---
                doc.fillColor('#2563eb')
                   .fontSize(24)
                   .text(candidate.name.toUpperCase(), { align: 'center' });

                doc.fontSize(10)
                   .fillColor('#64748b')
                   .text(`${candidate.email}  |  ${candidate.phone || ''}  |  ${candidate.location || ''}`, { align: 'center' });

                doc.moveDown(2);

                // --- Professional Summary ---
                if (aiData.professionalSummary) {
                    this.drawSectionHeader(doc, 'PROFESSIONAL SUMMARY');
                    doc.fontSize(10)
                       .fillColor('#1e293b')
                       .text(aiData.professionalSummary, { align: 'justify', lineGap: 2 });
                    doc.moveDown(1.5);
                }

                // --- Experience ---
                const experience = aiData.polishedExperience || candidate.extractedExperience || [];
                if (experience.length > 0) {
                    this.drawSectionHeader(doc, 'PROFESSIONAL EXPERIENCE');
                    
                    experience.forEach(exp => {
                        doc.fontSize(11)
                           .fillColor('#1e293b')
                           .text(exp.title, { continued: true })
                           .fillColor('#64748b')
                           .text(` at ${exp.companyName || exp.company}`, { continued: false });
                        
                        doc.fontSize(9)
                           .italic()
                           .text(exp.duration || `${exp.startDate} - ${exp.endDate || 'Present'}`);
                        
                        doc.moveDown(0.5);

                        if (Array.isArray(exp.bulletPoints)) {
                            exp.bulletPoints.forEach(point => {
                                doc.fontSize(10)
                                   .fillColor('#334155')
                                   .text(`• ${point}`, { indent: 15, lineGap: 1 });
                            });
                        } else if (exp.description) {
                            doc.fontSize(10)
                               .fillColor('#334155')
                               .text(exp.description, { indent: 15, lineGap: 1 });
                        }
                        doc.moveDown(1);
                    });
                }

                // --- Skills ---
                if (aiData.polishedSkills) {
                    this.drawSectionHeader(doc, 'SKILLS & EXPERTISE');
                    
                    if (Array.isArray(aiData.polishedSkills)) {
                        doc.fontSize(10)
                           .fillColor('#1e293b')
                           .text(aiData.polishedSkills.join('  •  '), { lineGap: 2 });
                    } else if (typeof aiData.polishedSkills === 'object') {
                        Object.entries(aiData.polishedSkills).forEach(([category, skills]) => {
                            const skillsList = Array.isArray(skills) ? skills.join(', ') : skills;
                            doc.fontSize(10)
                               .fillColor('#1e293b')
                               .text(`${category}: `, { continued: true, bold: true })
                               .fillColor('#334155')
                               .text(skillsList, { continued: false });
                        });
                    }
                    doc.moveDown(1.5);
                }

                // --- Education ---
                const education = aiData.polishedEducation || candidate.extractedEducation || [];
                if (education.length > 0) {
                    this.drawSectionHeader(doc, 'EDUCATION');
                    
                    education.forEach(edu => {
                        doc.fontSize(11)
                           .fillColor('#1e293b')
                           .text(edu.qualification || edu.degree);
                        
                        doc.fontSize(10)
                           .fillColor('#64748b')
                           .text(`${edu.schoolName || edu.institution} | ${edu.date || edu.year || ''}`);
                        
                        doc.moveDown(0.8);
                    });
                }

                // --- Footer ---
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < (range.start + range.count); i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8)
                       .fillColor('#94a3b8')
                       .text(
                           `Generated by ${settings?.general?.companyName || 'CRM System'} AI Assistant`,
                           50,
                           doc.page.height - 50,
                           { align: 'center' }
                       );
                }

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    async generateCustomHtmlResume(candidate, settings) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 0, // We'll manage margins manually for full-width elements
                    size: 'A4'
                });

                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    let pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                const pageWidth = doc.page.width;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);

                // --- Watermark ---
                if (settings?.payroll?.logo) {
                    try {
                        const logoData = settings.payroll.logo;
                        const base64Data = logoData.includes('base64,') ? logoData.split('base64,')[1] : logoData;
                        const logoBuffer = Buffer.from(base64Data, 'base64');
                        doc.save();
                        doc.opacity(0.05);
                        doc.image(logoBuffer, pageWidth / 2 - 150, doc.page.height / 2 - 150, { width: 300 });
                        doc.restore();
                    } catch (err) {
                        console.error('Watermark error:', err);
                    }
                }

                // --- Header (Name & Title) ---
                doc.fillColor('#1a1a1a')
                   .fontSize(32)
                   .font('Helvetica-Bold')
                   .text(candidate.name.toUpperCase(), margin, 60);
                
                doc.fillColor('#4b5563')
                   .fontSize(16)
                   .font('Helvetica')
                   .text(candidate.currentProfile || candidate.designation || '', margin, 100);

                // 4. Contact Info Bar
                const contactItems = [
                    { label: 'Phone', value: candidate.phone },
                    { label: 'Location', value: candidate.location },
                    { label: 'Email', value: candidate.email }
                ].filter(i => i.value);

                if (contactItems.length > 0) {
                    const barY = 135;
                    const barHeight = 40;
                    doc.rect(margin, barY, pageWidth - (2 * margin), barHeight).fill('#f3f4f6');
                    
                    doc.fillColor('#4b5563').fontSize(10).font('Helvetica');
                    
                    const contactText = contactItems.map(i => `${i.label}: ${i.value}`).join('   |   ');
                    doc.text(contactText, margin, barY + 14, {
                        width: pageWidth - (2 * margin),
                        align: 'center'
                    });
                }

                let currentY = 180;

                // --- Sections ---
                const drawSection = (title, content, type = 'text') => {
                    // Section Header Box
                    doc.rect(margin, currentY, 120, 25)
                       .fillColor('#d1d5db')
                       .fill();
                    
                    doc.fillColor('#111827')
                       .fontSize(11)
                       .font('Helvetica-Bold')
                       .text(title.toUpperCase(), margin + 10, currentY + 7);
                    
                    currentY += 35;

                    if (type === 'text') {
                        if (!content) return; // Don't draw section if no content
                        doc.fillColor('#374151')
                           .fontSize(10)
                           .font('Helvetica')
                           .text(content, margin, currentY, { width: contentWidth, align: 'justify', lineGap: 3 });
                        currentY = doc.y + 20;
                    } else if (type === 'experience') {
                        content.forEach(exp => {
                            doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(exp.title, margin, currentY, { continued: true });
                            doc.fillColor('#4b5563').font('Helvetica').text(` - ${exp.companyName || exp.company}`, { continued: false });
                            
                            const dateStr = `${exp.startDate || ''} - ${exp.endDate || (exp.currentlyWorking ? 'NOW' : '')}`;
                            doc.fontSize(10).font('Helvetica-Bold').text(dateStr, margin, currentY, { align: 'right' });
                            
                            currentY = doc.y + 5;
                            if (exp.description) {
                                doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(exp.description, margin, currentY, { width: contentWidth, align: 'justify', lineGap: 2 });
                                currentY = doc.y + 15;
                            } else {
                                currentY += 10;
                            }
                        });
                    } else if (type === 'education') {
                        content.forEach(edu => {
                            doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(edu.qualification || edu.degree, margin, currentY, { continued: true });
                            doc.fillColor('#4b5563').font('Helvetica').text(` at ${edu.schoolName || edu.institution}`, { continued: false });
                            
                            const dateStr = `${edu.startDate || ''} - ${edu.endDate || ''}`;
                            doc.fontSize(10).font('Helvetica-Bold').text(dateStr, margin, currentY, { align: 'right' });
                            
                            currentY = doc.y + 15;
                        });
                    } else if (type === 'skills') {
                        const skills = Array.isArray(content) ? content : (content ? [content] : []);
                        doc.fillColor('#374151').fontSize(10).font('Helvetica');
                        
                        // Render in 3 columns
                        const colWidth = contentWidth / 3;
                        skills.forEach((skill, i) => {
                            const col = i % 3;
                            const row = Math.floor(i / 3);
                            doc.text(`• ${skill}`, margin + (col * colWidth), currentY + (row * 15));
                        });
                        currentY += (Math.ceil(skills.length / 3) * 15) + 20;
                    }
                };

                // About Me
                const summary = candidate.aiSummary || candidate.remark || (candidate.remarks && candidate.remarks.length > 0 ? candidate.remarks[0].text : '');
                if (summary) {
                    drawSection('About Me', summary);
                }

                // Education
                const education = candidate.extractedEducation || [];
                if (education.length > 0) {
                    drawSection('Education', education, 'education');
                }

                // Skills
                let skills = candidate.extractedSkills || [];
                if (skills.length === 0 && candidate.sector) {
                    skills = candidate.sector.split(',').map(s => s.trim()).filter(s => s);
                }
                
                if (skills.length > 0) {
                    drawSection('Skills', skills, 'skills');
                }

                // Work Experience
                const experience = candidate.extractedExperience || [];
                if (experience.length > 0) {
                    drawSection('Work Experience', experience, 'experience');
                }

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    drawSectionHeader(doc, title) {
        doc.fillColor('#2563eb')
           .fontSize(12)
           .text(title, { characterSpacing: 1 })
           .moveTo(doc.x, doc.y)
           .lineTo(550, doc.y)
           .strokeColor('#e2e8f0')
           .stroke();
        doc.moveDown(0.8);
    }
}

module.exports = new ResumeGeneratorService();
