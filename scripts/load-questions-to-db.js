// Script to load all questions from JSON files into the database
const fs = require('fs');
const path = require('path');

// Map of JSON files to their source categories
const questionFiles = {
  '../src/data/questions1.json': 'general',
  '../src/data/questions2.json': 'general',
  '../src/data/questions3.json': 'general',
  '../src/data/questions4.json': 'general',
  '../src/data/questions5.json': 'general',
  '../src/data/questions-culture.json': 'culture',
  '../src/data/questions-finance.json': 'finance',
  '../src/data/questions-health.json': 'health',
  '../src/data/questions-history.json': 'history'
};

// Convert old format to new format
function convertOldToNew(question) {
  if (Array.isArray(question.answers) && typeof question.answers[0] === 'string') {
    // Old format: answers are strings, correct is a string
    const newAnswers = question.answers.map((answer, index) => ({
      key: String.fromCharCode(65 + index), // A, B, C, ...
      text: answer,
      correct: answer === question.correct
    }));
    
    return {
      id: question.id,
      question: question.question,
      answers: newAnswers,
      audience: generateDefaultAudience(newAnswers.length),
      third: 'C',
      topic: question.topic || 'General'
    };
  }
  
  // Already new format
  return question;
}

// Generate default audience distribution
function generateDefaultAudience(answerCount) {
  const audience = {};
  const basePercent = Math.floor(100 / answerCount);
  const remainder = 100 - (basePercent * answerCount);
  
  for (let i = 0; i < answerCount; i++) {
    const key = String.fromCharCode(65 + i);
    audience[key] = basePercent + (i === 0 ? remainder : 0);
  }
  
  return audience;
}

// Generate SQL INSERT statements
function generateInsertSQL(questions, sourceCategory) {
  if (questions.length === 0) return '';
  
  const values = questions.map(q => {
    const converted = convertOldToNew(q);
    const id = converted.id.replace(/'/g, "''");
    const question = converted.question.replace(/'/g, "''");
    const answers = JSON.stringify(converted.answers).replace(/'/g, "''");
    const audience = JSON.stringify(converted.audience).replace(/'/g, "''");
    const third = converted.third.replace(/'/g, "''");
    
    return `('${id}', '${question}', '${answers}'::jsonb, '${audience}'::jsonb, '${third}', '${sourceCategory}')`;
  }).join(',\n');
  
  return `INSERT INTO questions (id, question, answers, audience, third, source_category) VALUES\n${values};\n\n`;
}

// Main execution
let allSQL = '-- Töröljük a meglévő kérdéseket\nTRUNCATE TABLE questions;\n\n';
let totalQuestions = 0;

console.log('Loading questions from JSON files...\n');

for (const [filePath, category] of Object.entries(questionFiles)) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    console.log(`${filePath}: ${data.length} questions (${category})`);
    totalQuestions += data.length;
    
    allSQL += `-- Questions from ${filePath} (${category})\n`;
    allSQL += generateInsertSQL(data, category);
    
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
  }
}

console.log(`\nTotal questions: ${totalQuestions}`);

// Write SQL to file
const outputPath = path.join(__dirname, 'load-questions.sql');
fs.writeFileSync(outputPath, allSQL);
console.log(`\nSQL written to: ${outputPath}`);
console.log('\nYou can now run this SQL file in your Supabase database.');
