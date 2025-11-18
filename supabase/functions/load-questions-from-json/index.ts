import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OldFormatQuestion {
  id: string
  question: string
  answers: string[]
  correct: string
  topic: string
}

interface NewFormatQuestion {
  id: string
  question: string
  answers: Array<{
    key: string
    text: string
    correct: boolean
  }>
  audience: Record<string, number>
  third: string
  topic: string
}

function convertOldToNew(q: OldFormatQuestion): NewFormatQuestion {
  const answers = q.answers.map((answer, index) => ({
    key: String.fromCharCode(65 + index), // A, B, C, ...
    text: answer,
    correct: answer === q.correct
  }))
  
  // Generate default audience distribution
  const answerCount = answers.length
  const basePercent = Math.floor(100 / answerCount)
  const remainder = 100 - (basePercent * answerCount)
  const audience: Record<string, number> = {}
  
  for (let i = 0; i < answerCount; i++) {
    const key = String.fromCharCode(65 + i)
    audience[key] = basePercent + (i === 0 ? remainder : 0)
  }
  
  return {
    id: q.id,
    question: q.question,
    answers,
    audience,
    third: 'C', // Default third option
    topic: q.topic
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[load-questions] Starting question load process...')

    // Question files and their categories
    const questionFiles = [
      { path: '/var/task/questions1.json', category: 'general', isOldFormat: true },
      { path: '/var/task/questions2.json', category: 'general', isOldFormat: true },
      { path: '/var/task/questions3.json', category: 'general', isOldFormat: true },
      { path: '/var/task/questions4.json', category: 'general', isOldFormat: true },
      { path: '/var/task/questions5.json', category: 'general', isOldFormat: true },
      { path: '/var/task/questions-culture.json', category: 'culture', isOldFormat: false },
      { path: '/var/task/questions-finance.json', category: 'finance', isOldFormat: false },
      { path: '/var/task/questions-health.json', category: 'health', isOldFormat: false },
      { path: '/var/task/questions-history.json', category: 'history', isOldFormat: false }
    ]

    let totalLoaded = 0
    const allQuestions: any[] = []

    // Load and convert all questions
    for (const file of questionFiles) {
      try {
        console.log(`[load-questions] Loading ${file.path}...`)
        const fileContent = await Deno.readTextFile(file.path)
        const questions = JSON.parse(fileContent)
        
        for (const q of questions) {
          const converted = file.isOldFormat ? convertOldToNew(q as OldFormatQuestion) : q as NewFormatQuestion
          
          allQuestions.push({
            id: converted.id,
            question: converted.question,
            answers: converted.answers,
            audience: converted.audience,
            third: converted.third,
            source_category: file.category
          })
        }
        
        console.log(`[load-questions] Loaded ${questions.length} questions from ${file.path}`)
        totalLoaded += questions.length
      } catch (error) {
        console.error(`[load-questions] Error loading ${file.path}:`, error)
      }
    }

    console.log(`[load-questions] Total questions to insert: ${totalLoaded}`)

    // Delete existing questions
    const { error: deleteError } = await supabaseClient
      .from('questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('[load-questions] Error deleting existing questions:', deleteError)
    }

    // Insert questions in batches of 100
    const batchSize = 100
    let inserted = 0
    
    for (let i = 0; i < allQuestions.length; i += batchSize) {
      const batch = allQuestions.slice(i, i + batchSize)
      
      const { error: insertError } = await supabaseClient
        .from('questions')
        .insert(batch)
      
      if (insertError) {
        console.error(`[load-questions] Error inserting batch ${i / batchSize + 1}:`, insertError)
      } else {
        inserted += batch.length
        console.log(`[load-questions] Inserted batch ${i / batchSize + 1} (${inserted}/${allQuestions.length})`)
      }
    }

    console.log(`[load-questions] Successfully loaded ${inserted} questions`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: inserted,
        message: `Successfully loaded ${inserted} questions into database`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[load-questions] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
