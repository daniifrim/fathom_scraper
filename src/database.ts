import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

export interface MeetingRecord {
  id?: string;  // UUID, auto-generated
  title: string;
  date: string;
  duration: string;
  url: string;
  thumbnail_url: string;
  summary: string;
  transcript: string;
  created_at?: string; // Timestamp, auto-generated
}

export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('meetings')
      .select('id');

    if (error) {
      console.error('Database connection test failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('Database connection successful, current row count:', data?.length ?? 0);
    return true;
  } catch (error) {
    console.error('Unexpected error testing database connection:', error);
    return false;
  }
}

export async function insertMeeting(meeting: MeetingRecord) {
  try {
    console.log('Attempting to insert meeting:', {
      title: meeting.title,
      url: meeting.url,
      date: meeting.date
    });

    const { data, error } = await supabase
      .from('meetings')
      .insert([meeting])
      .select()
      .single();

    if (error) {
      console.error('Error inserting meeting:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        meeting: {
          title: meeting.title,
          url: meeting.url,
          date: meeting.date
        }
      });
      throw error;
    }

    console.log('Successfully inserted meeting:', {
      id: data.id,
      title: data.title,
      url: data.url
    });
    return data;
  } catch (error) {
    console.error('Unexpected error inserting meeting:', error);
    throw error;
  }
}

export async function getMeetingByUrl(url: string) {
  try {
    console.log('Looking up meeting by URL:', url);

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No meeting found with URL:', url);
        return null;
      }
      console.error('Error looking up meeting:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        url
      });
      throw error;
    }

    console.log('Found meeting:', {
      id: data.id,
      title: data.title,
      url: data.url
    });
    return data;
  } catch (error) {
    console.error('Unexpected error getting meeting:', error);
    throw error;
  }
}

export async function getAllMeetings() {
  try {
    console.log('Fetching all meetings...');

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`Successfully fetched ${data.length} meetings`);
    return data;
  } catch (error) {
    console.error('Unexpected error getting meetings:', error);
    throw error;
  }
}

export async function searchMeetings(query: string) {
  try {
    console.log('Searching meetings with query:', query);

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .or(`title.ilike.%${query}%, summary.ilike.%${query}%, transcript.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching meetings:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        query
      });
      throw error;
    }

    console.log(`Found ${data.length} meetings matching query:`, query);
    return data;
  } catch (error) {
    console.error('Unexpected error searching meetings:', error);
    throw error;
  }
} 