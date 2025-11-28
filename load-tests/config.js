require('dotenv').config();

module.exports = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://wdpxmwsxhckazwxufttk.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcHhtd3N4aGNrYXp3eHVmdHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ3ODUsImV4cCI6MjA3NjE4MDc4NX0.DeAS4ACvq-YVt2ytoOS3NVSg7xFSHVhvyjUEOti_NnA',
  
  // Test parameters
  virtualUsers: parseInt(process.env.VIRTUAL_USERS) || 25000,
  testDuration: parseInt(process.env.TEST_DURATION) || 90, // seconds
  connections: parseInt(process.env.CONNECTIONS) || 500,
  pipelining: parseInt(process.env.PIPELINING) || 20,
  
  // Edge function URLs
  endpoints: {
    loginPin: '/functions/v1/login-with-username-pin',
    startGame: '/functions/v1/start-game-session',
    getQuestions: '/functions/v1/get-game-questions',
    completeGame: '/functions/v1/complete-game',
    getWallet: '/functions/v1/get-wallet',
    leaderboard: '/functions/v1/get-daily-leaderboard-by-country',
  }
};
