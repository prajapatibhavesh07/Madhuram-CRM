const fs = require('fs');
const pdf = require('pdf-parse');
const aiService = require('./aiService');

class ResumeParserService {
    /**
     * Extracts text from a file (PDF supported for now) and uses AI to structure it.
     * @param {String} filePath - Absolute path to the file on disk.
     */
    async parse(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found at path: ' + filePath);
            }

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            const extractedText = data.text;

            if (!extractedText || extractedText.trim().length === 0) {
                throw new Error('No text content found in resume.');
            }

            console.log('[PARSER] Sending extracted text to AI...');
            const structuredData = await aiService.parseResume(extractedText);
            
            return structuredData;
        } catch (error) {
            console.error('[PARSER] Error parsing resume:', error.message);
            throw error;
        }
    }
}

module.exports = new ResumeParserService();
