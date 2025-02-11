import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Read environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TranscriptData {
  meetingTitle: string;
  transcript: string;
  summary: string;
}

// Function to store transcript data into the "transcripts" table
export async function storeTranscript(data: TranscriptData): Promise<void> {
  console.log('Storing transcript data in Supabase...');
  
  const { error } = await supabase.from('transcripts').insert([
    {
      meeting_title: data.meetingTitle,
      transcript: data.transcript,
      summary: data.summary,
      created_at: new Date().toISOString()
    }
  ]);

  if (error) {
    throw new Error(`Failed to store transcript: ${error.message}`);
  }
} 