require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Multer setup for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;

        if (!resumeFile) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }

        if (!jobDescription) {
            return res.status(400).json({ error: 'No job description provided' });
        }

        // Extract text from PDF
        const pdfData = await pdf(resumeFile.buffer);
        const resumeText = pdfData.text;

        // Prepare prompt for Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
            You are an expert HR and ATS (Applicant Tracking System) optimizer. 
            Analyze the following resume against the job description.
            
            Resume:
            ${resumeText}
            
            Job Description:
            ${jobDescription}
            
            Please provide a JSON response with the following fields:
            1. skillMatchPercentage: A number (0-100) representing how well the resume matches the job.
            2. missingSkills: An array of important skills found in the job description but missing from the resume.
            3. improvementSuggestions: An array of specific, actionable advice to improve the resume for this role.
            4. jobRecommendations: An array of 3-4 job titles or industries the candidate might also be suitable for based on their resume.

            Format the response strictly as valid JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up the response (remove markdown if Gemini adds it)
        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze resume. Please ensure your API key is valid.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
